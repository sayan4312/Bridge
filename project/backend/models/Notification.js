import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'INVESTMENT_PROPOSAL_RECEIVED',
      'INVESTMENT_PROPOSAL_ACCEPTED',
      'INVESTMENT_PROPOSAL_REJECTED',
      'BUSINESS_IDEA_LIKED',
      'BUSINESS_IDEA_COMMENTED',
      'LOAN_APPLICATION_RECEIVED',
      'CONSULTATION_REQUEST',
      'CONSULTATION_RESPONSE',
      'NEW_BUSINESS_IDEA',
      'SYSTEM_ANNOUNCEMENT',
      'PROFILE_UPDATE',
      'PASSWORD_CHANGED',
      'LOGIN_ALERT'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Populate user info
notificationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userId',
    select: 'name email role avatar'
  });
  next();
});

// Static: Create Notification
notificationSchema.statics.createNotification = async function (
  userId,
  type,
  title,
  message,
  data = {},
  actionUrl = null,
  priority = 'medium'
) {
  try {
    const notification = await this.create({
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      priority
    });
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error.message);
    throw error;
  }
};

// Static: Mark Single Notification as Read
notificationSchema.statics.markAsRead = async function (notificationId, userId) {
  try {
    return await this.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  } catch (error) {
    console.error('❌ Error marking notification as read:', error.message);
    throw error;
  }
};

// Static: Mark All Notifications as Read
notificationSchema.statics.markAllAsRead = async function (userId) {
  try {
    return await this.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error.message);
    throw error;
  }
};

export default mongoose.model('Notification', notificationSchema);
