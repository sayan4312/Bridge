import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  businessIdeaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessIdea',
    required: true
  },
  investmentProposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentProposal',
    required: true
  },
  lastMessage: {
    content: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ businessIdeaId: 1 });
chatRoomSchema.index({ investmentProposalId: 1 });
chatRoomSchema.index({ 'lastMessage.timestamp': -1 });

// Populate references
chatRoomSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'participants',
    select: 'name email role avatar'
  }).populate({
    path: 'businessIdeaId',
    select: 'title description category investmentNeeded'
  }).populate({
    path: 'investmentProposalId',
    select: 'amount type status'
  }).populate({
    path: 'lastMessage.senderId',
    select: 'name avatar'
  });
  next();
});

// Virtual for getting the other participant
chatRoomSchema.virtual('otherParticipant').get(function() {
  if (!this.participants || this.participants.length < 2) return null;
  return this.participants.find(p => p._id.toString() !== this.currentUserId);
});

// Static method to find or create chat room
chatRoomSchema.statics.findOrCreateChatRoom = async function(investorId, businessOwnerId, businessIdeaId, investmentProposalId) {
  try {
    // Check if chat room already exists
    let chatRoom = await this.findOne({
      participants: { $all: [investorId, businessOwnerId] },
      businessIdeaId: businessIdeaId,
      investmentProposalId: investmentProposalId
    });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = await this.create({
        participants: [investorId, businessOwnerId],
        businessIdeaId: businessIdeaId,
        investmentProposalId: investmentProposalId,
        unreadCount: new Map([
          [investorId.toString(), 0],
          [businessOwnerId.toString(), 0]
        ])
      });
    }

    return chatRoom;
  } catch (error) {
    throw error;
  }
};

// Method to mark messages as read for a user
chatRoomSchema.methods.markAsRead = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  this.updatedAt = new Date();
  await this.save();
};

// Method to increment unread count for a user
chatRoomSchema.methods.incrementUnread = async function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  this.updatedAt = new Date();
  await this.save();
};

export default mongoose.model('ChatRoom', chatRoomSchema); 