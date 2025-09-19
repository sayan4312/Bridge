import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
messageSchema.index({ chatRoomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ createdAt: -1 });

// Populate references
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'senderId',
    select: 'name email role avatar'
  });
  next();
});

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static method to get unread count for a user in a chat room
messageSchema.statics.getUnreadCount = async function(chatRoomId, userId) {
  return await this.countDocuments({
    chatRoomId: chatRoomId,
    senderId: { $ne: userId },
    isRead: false
  });
};

// Static method to mark all messages as read for a user in a chat room
messageSchema.statics.markAllAsRead = async function(chatRoomId, userId) {
  return await this.updateMany(
    {
      chatRoomId: chatRoomId,
      senderId: { $ne: userId },
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

export default mongoose.model('Message', messageSchema); 