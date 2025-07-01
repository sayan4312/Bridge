import express from 'express';
import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationStats
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';
import { validateObjectId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', validatePagination, getNotifications);
router.get('/stats', getNotificationStats);
router.get('/:id', validateObjectId('id'), getNotification);
router.put('/:id/read', validateObjectId('id'), markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', validateObjectId('id'), deleteNotification);
router.delete('/clear-read', clearReadNotifications);

export default router;