# Bridge - Business & Investment Platform

A comprehensive full-stack platform that connects entrepreneurs with investors, bankers, and business advisors. Built with React, TypeScript, Node.js, and MongoDB.



## 🌟 Overview

Bridge is a modern business networking platform designed to facilitate connections between:
- **Business Persons/Entrepreneurs** - Post business ideas and seek funding
- **Investors** - Discover and invest in promising business opportunities
- **Bankers** - Offer loans and financial services
- **Business Advisors** - Provide expert consultation and guidance

## ✨ Key Features

### 🚀 Core Functionality
- **Multi-role Authentication System** with JWT-based security
- **Business Ideas Marketplace** with advanced search and filtering
- **Investment Proposal System** with real-time status tracking
- **Loan Offers Platform** with comprehensive terms management
- **Business Consultation Hub** with expert advice sharing
- **Real-time Chat System** for investor-entrepreneur communication
- **Smart Notifications** with priority-based delivery
- **Activity Logging** with comprehensive audit trails

### 🎨 User Experience
- **Responsive Design** optimized for all devices
- **Dark/Light Theme** with system preference detection
- **Real-time Updates** with WebSocket-like polling
- **Advanced Search** with full-text indexing
- **Interactive Dashboard** with analytics and insights
- **File Upload Support** for business documents
- **Progressive Web App** capabilities

### 🔒 Security & Performance
- **JWT Authentication** with secure token management
- **Role-based Access Control** (RBAC)
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **Activity Monitoring** and logging
- **Error Handling** with user-friendly messages
- **Performance Optimization** with lazy loading

### 💬 Real-Time Chat System
- **Socket.IO Integration** for real-time messaging
- **Auto-Chat Room Creation** when investment proposals are submitted
- **Typing Indicators** showing when users are typing
- **Online/Offline Status** for all participants
- **Message Persistence** with MongoDB storage
- **Unread Message Counts** and notifications
- **Secure Chat Rooms** with participant-only access
- **Business Idea Context** in chat rooms

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   └── Notifications/  # Notification system
├── pages/              # Main application pages
├── services/           # API service layers
├── store/              # Zustand state management
├── utils/              # Utility functions
└── config/             # Configuration files
```

### Backend (Node.js + Express)
```
backend/
├── config/             # Database and logger configuration
├── controllers/        # Business logic controllers
├── middlewares/        # Custom middleware functions
├── models/             # MongoDB schemas
├── routes/             # API route definitions
└── utils/              # Backend utilities
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Zustand** - Lightweight state management
- **React Hook Form** - Efficient form handling
- **Zod** - Schema validation
- **React Hot Toast** - Beautiful notifications
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons
- **Date-fns** - Date manipulation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Winston** - Logging library
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression

### Development Tools
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Nodemon** - Development server auto-restart

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bridge-platform
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Environment Setup**

Create `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bridge_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Create `.env` file in the root directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start the application**

```bash
# Start backend server (from backend directory)
cd backend
npm run dev

# Start frontend development server (from root directory)
cd ..
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/health

## 📖 User Roles & Permissions

### Business Person/Entrepreneur
- ✅ Create and manage business ideas
- ✅ View and respond to investment proposals
- ✅ Access business consultations
- ✅ Chat with investors after proposal acceptance
- ✅ Track funding progress and investor engagement

### Investor
- ✅ Browse and search business ideas
- ✅ Create investment proposals
- ✅ Track proposal status and responses
- ✅ Chat with entrepreneurs after proposal acceptance
- ✅ View investment portfolio and analytics

### Banker
- ✅ Create and manage loan offers
- ✅ Set loan terms and conditions
- ✅ View loan applications and inquiries
- ✅ Track loan portfolio performance
- ✅ Manage interest rates and approval criteria

### Business Advisor
- ✅ Create business consultations and advice
- ✅ Share expertise and industry insights
- ✅ Respond to consultation requests
- ✅ Build professional network and reputation
- ✅ Track consultation engagement and feedback

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/me          # Get current user
PUT  /api/auth/profile     # Update user profile
PUT  /api/auth/password    # Change password
```

### Business Ideas Endpoints
```
GET    /api/business-ideas           # Get all business ideas
GET    /api/business-ideas/:id       # Get single business idea
POST   /api/business-ideas           # Create business idea
PUT    /api/business-ideas/:id       # Update business idea
DELETE /api/business-ideas/:id       # Delete business idea
POST   /api/business-ideas/:id/like  # Like/unlike business idea
GET    /api/business-ideas/my/ideas  # Get user's business ideas
```

### Investment Proposals Endpoints
```
GET  /api/investment-proposals                    # Get proposals
GET  /api/investment-proposals/:id                # Get single proposal
POST /api/investment-proposals                    # Create proposal
PUT  /api/investment-proposals/:id/status         # Update proposal status
PUT  /api/investment-proposals/:id/withdraw       # Withdraw proposal
GET  /api/investment-proposals/business-idea/:id  # Get proposals for business idea
```

### Additional Endpoints
- **Loan Offers**: `/api/loan-offers/*`
- **Consultations**: `/api/consultations/*`
- **Notifications**: `/api/notifications/*`
- **Chat**: `/api/chat/*`

## 🎯 Key Features Deep Dive

### Real-time Chat System
- Automatic chat room creation when investment proposals are accepted
- Real-time message delivery with polling mechanism
- Message editing and deletion capabilities
- Read receipts and typing indicators
- File sharing support

### Smart Notifications
- Priority-based notification system (low, medium, high, urgent)
- Real-time delivery with browser notifications
- Categorized notifications by type and action
- Bulk operations (mark all read, clear read notifications)
- Notification statistics and analytics

### Advanced Search & Filtering
- Full-text search across business ideas and consultations
- Multi-criteria filtering (category, investment range, status)
- Sorting options (date, popularity, funding amount)
- Pagination with infinite scroll support
- Search result highlighting

### Investment Proposal Workflow
1. Investor discovers business idea
2. Investor creates detailed proposal with terms
3. Business owner receives notification
4. Business owner reviews and responds (accept/reject)
5. If accepted, automatic chat room creation
6. Real-time communication between parties
7. Investment tracking and progress monitoring

## 🔧 Development

### Project Structure
```
bridge-platform/
├── src/                    # Frontend source code
├── backend/                # Backend source code
├── public/                 # Static assets
├── docs/                   # Documentation
├── .env                    # Frontend environment variables
├── package.json            # Frontend dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

### Available Scripts

**Frontend:**
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

**Backend:**
```bash
npm run dev         # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
```

### Code Style & Standards
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Component-based architecture** for maintainability
- **Service layer pattern** for API interactions
- **Custom hooks** for reusable logic

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### Backend Deployment (Railway/Heroku)
```bash
# Set environment variables in your hosting platform
# Deploy backend/ folder
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=your_frontend_domain
```

## 📊 Database Schema

### User Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['business_person', 'investor', 'banker', 'business_advisor'],
  avatar: String,
  isActive: Boolean,
  profile: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Business Idea Collection
```javascript
{
  title: String,
  description: String,
  category: Enum,
  investmentNeeded: Number,
  userId: ObjectId (ref: User),
  status: Enum ['active', 'funded', 'closed'],
  currentFunding: Number,
  investorCount: Number,
  views: Number,
  likes: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Investment Proposal Collection
```javascript
{
  businessIdeaId: ObjectId (ref: BusinessIdea),
  investorId: ObjectId (ref: User),
  amount: Number,
  type: Enum ['equity', 'loan', 'partnership'],
  terms: String,
  status: Enum ['pending', 'accepted', 'rejected', 'withdrawn'],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** to prevent API abuse
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers
- **Activity Logging** for audit trails
- **Role-based Access Control** (RBAC)

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
npm test
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for user workflows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Help

### Common Issues
- **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
- **Port Conflicts**: Change ports in environment variables if needed
- **CORS Errors**: Verify CLIENT_URL matches your frontend URL
- **Authentication Issues**: Check JWT_SECRET and token expiration

### Getting Help
- Check the [Issues](../../issues) page for known problems
- Create a new issue for bugs or feature requests
- Review the API documentation for endpoint details
- Check the console for error messages and logs

## 🎉 Acknowledgments

- **React Team** for the amazing React library
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB** for the flexible NoSQL database
- **Express.js** for the robust web framework
- **All Contributors** who helped build this platform

---

**Built with ❤️ by the Bridge Team**

*Connecting businesses, investors, and advisors for a better tomorrow.*
