import express from 'express';
import {
  getUserChatRooms,
  getChatRoom,
  sendMessage,
  createChatRoomFromProposal,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage,
  deleteChatRoom,
  uploadChatFileHandler
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';
import { validateMessage } from '../middlewares/validation.js';
import multer from 'multer';
import path from 'path';
import { uploadChatFile } from '../middlewares/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Chat room routes
router.get('/rooms', getUserChatRooms);
router.get('/rooms/:id', getChatRoom);
router.post('/rooms/:id/messages', validateMessage, sendMessage);
router.put('/rooms/:id/read', markMessagesAsRead);
router.delete('/rooms/:id', deleteChatRoom);

// Chat room creation from proposal
router.post('/create-from-proposal', createChatRoomFromProposal);

// File upload for chat
router.post('/rooms/:id/upload', uploadChatFile.single('file'), uploadChatFileHandler);

// Utility routes
router.get('/unread-count', getUnreadCount);
router.delete('/messages/:id', deleteMessage);

export default router; 