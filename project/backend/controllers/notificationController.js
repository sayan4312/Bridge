import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, isRead, type, priority,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort(sort).skip(skip).limit(Number(limit));
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { notifications }
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    next(error);
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    console.error('❌ Get notification error:', error);
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await ActivityLog.logActivity(
      req.user._id,
      'NOTIFICATION_READ',
      'Notification',
      notification._id,
      { type: notification.type },
      req
    );

    res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    await ActivityLog.logActivity(
      req.user._id,
      'ALL_NOTIFICATIONS_READ',
      'Notification',
      req.user._id,
      { modifiedCount: result.modifiedCount },
      req
    );

    console.log(`ℹ️ All notifications marked as read for ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await ActivityLog.logActivity(
      req.user._id,
      'NOTIFICATION_DELETED',
      'Notification',
      notification._id,
      { type: notification.type },
      req
    );

    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('❌ Delete notification error:', error);
    next(error);
  }
};

export const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id, isRead: true });

    await ActivityLog.logActivity(
      req.user._id,
      'READ_NOTIFICATIONS_CLEARED',
      'Notification',
      req.user._id,
      { deletedCount: result.deletedCount },
      req
    );

    console.log(`ℹ️ Cleared ${result.deletedCount} read notifications for ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Read notifications cleared successfully',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('❌ Clear read notifications error:', error);
    next(error);
  }
};

export const getNotificationStats = async (req, res, next) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, unread: 0, high: 0, urgent: 0 },
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('❌ Get notification stats error:', error);
    next(error);
  }
};

// Used throughout other modules
export const createNotification = async (
  userId,
  type,
  title,
  message,
  data = {},
  actionUrl = null,
  priority = 'medium',
  req = null
) => {
  try {
    const notification = await Notification.createNotification(
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      priority
    );

    if (req?.app?.get('io')) {
      req.app.get('io').to(userId.toString()).emit('notification', notification);
    }

    console.log(`🔔 Notification created for user ${userId}: ${type}`);
    return notification;
  } catch (error) {
    console.error('❌ Create notification error:', error);
    throw error;
  }
};

