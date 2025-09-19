import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/database.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import businessIdeaRoutes from './routes/businessIdeas.js';
import investmentProposalRoutes from './routes/investmentProposals.js';
import loanOfferRoutes from './routes/loanOffers.js';
import consultationRoutes from './routes/consultations.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

let io; // Exported if needed

const startServer = async () => {
  try {
    await connectDB();
    const app = express();

    // 🔒 Security middleware
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // 🌐 CORS, parsers, compression
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(compression());

    // Logging
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    } else {
      app.use(morgan('combined'));
    }

    // Rate limiter and static files
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Health check route
    app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/business-ideas', businessIdeaRoutes);
    app.use('/api/investment-proposals', investmentProposalRoutes);
    app.use('/api/loan-offers', loanOfferRoutes);
    app.use('/api/consultations', consultationRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/chat', chatRoutes);

    // 404 fallback
    app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Error handler
    app.use(errorHandler);

    // --- SOCKET.IO SETUP ---
    const server = http.createServer(app);
    io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
      }
    });

    // Chat room connection handling
    io.on('connection', (socket) => {

      // Join user's personal room for notifications
      socket.on('join_user', ({ userId }) => {
        socket.join(`user_${userId}`);
      });

      // Join chat room
      socket.on('join_chat_room', ({ chatRoomId }) => {
        socket.join(`chat_${chatRoomId}`);
      });

      // Leave chat room
      socket.on('leave_chat_room', ({ chatRoomId }) => {
        socket.leave(`chat_${chatRoomId}`);
      });

      // Typing indicator
      socket.on('typing_start', ({ chatRoomId, userId, userName }) => {
        socket.to(`chat_${chatRoomId}`).emit('user_typing', { userId, userName });
      });

      socket.on('typing_stop', ({ chatRoomId, userId }) => {
        socket.to(`chat_${chatRoomId}`).emit('user_stopped_typing', { userId });
      });

      // User presence
      socket.on('user_online', ({ userId }) => {
        socket.broadcast.emit('user_status_change', { userId, status: 'online' });
      });

      socket.on('disconnect', () => {
      });
    });

    // Export io for use in controllers if needed
    app.set('io', io);

    server.listen(PORT, () => {
    });

    // Global error handlers
    process.on('unhandledRejection', (err) => {
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      process.exit(1);
    });

  } catch (err) {
    process.exit(1);
  }
};

startServer();
