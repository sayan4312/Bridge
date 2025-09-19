import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_REGISTER',
      'BUSINESS_IDEA_CREATED',
      'BUSINESS_IDEA_UPDATED',
      'BUSINESS_IDEA_DELETED',
      'INVESTMENT_PROPOSAL_CREATED',
      'INVESTMENT_PROPOSAL_UPDATED',
      'INVESTMENT_PROPOSAL_ACCEPTED',
      'INVESTMENT_PROPOSAL_REJECTED',
      'LOAN_OFFER_CREATED',
      'LOAN_OFFER_UPDATED',
      'LOAN_OFFER_DELETED',
      'CONSULTATION_CREATED',
      'CONSULTATION_UPDATED',
      'CONSULTATION_DELETED',
      'PROFILE_UPDATED',
      'PASSWORD_CHANGED',
      'FILE_UPLOADED',
      'SEARCH_PERFORMED',
      'VIEW_BUSINESS_IDEA',
      'VIEW_CONSULTATION',
      'LIKE_BUSINESS_IDEA',
      'UNLIKE_BUSINESS_IDEA',
      'COMMENT_CREATED',
      'COMMENT_DELETED',
      'ALL_NOTIFICATIONS_READ'
    ]
  },
  resourceType: {
    type: String,
    enum: ['User', 'BusinessIdea', 'InvestmentProposal', 'LoanOffer', 'Consultation', 'ActivityLog',
    'Notification'
    ],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resourceType: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

// TTL index to automatically delete logs older than 1 year
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Populate user information
activityLogSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'userId',
    select: 'name email role'
  });
  next();
});

// Static method to log activity
activityLogSchema.statics.logActivity = async function(userId, action, resourceType, resourceId, details = {}, req = null) {
  try {
    const logData = {
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req ? (req.ip || req.connection.remoteAddress || 'unknown') : 'system',
      userAgent: req ? (req.get('User-Agent') || 'unknown') : 'system'
    };

    if (req && req.sessionID) {
      logData.sessionId = req.sessionID;
    }

    await this.create(logData);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export default mongoose.model('ActivityLog', activityLogSchema);