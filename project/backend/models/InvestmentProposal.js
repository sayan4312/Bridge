import mongoose from 'mongoose';

const investmentProposalSchema = new mongoose.Schema({
  businessIdeaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessIdea',
    required: true
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [1000, 'Investment must be at least $1,000']
  },
  type: {
    type: String,
    enum: ['equity', 'loan', 'partnership'],
    required: [true, 'Investment type is required']
  },
  equityPercentage: {
    type: Number,
    min: 0,
    max: 100,
    required: function() {
      return this.type === 'equity';
    }
  },
  interestRate: {
    type: Number,
    min: 0,
    max: 50,
    required: function() {
      return this.type === 'loan';
    }
  },
  loanDuration: {
    type: Number, // in months
    min: 1,
    max: 360,
    required: function() {
      return this.type === 'loan';
    }
  },
  terms: {
    type: String,
    required: [true, 'Terms and conditions are required'],
    maxlength: [1000, 'Terms cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot be more than 500 characters']
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
investmentProposalSchema.index({ businessIdeaId: 1 });
investmentProposalSchema.index({ investorId: 1 });
investmentProposalSchema.index({ status: 1 });
investmentProposalSchema.index({ createdAt: -1 });

// Populate references
investmentProposalSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'businessIdeaId',
    select: 'title description category investmentNeeded userId'
  }).populate({
    path: 'investorId',
    select: 'name email role avatar'
  });
  next();
});

// Virtual for monthly payment (for loans)
investmentProposalSchema.virtual('monthlyPayment').get(function() {
  if (this.type === 'loan' && this.interestRate && this.loanDuration) {
    const monthlyRate = this.interestRate / 100 / 12;
    const payment = (this.amount * monthlyRate * Math.pow(1 + monthlyRate, this.loanDuration)) / 
                   (Math.pow(1 + monthlyRate, this.loanDuration) - 1);
    return Math.round(payment * 100) / 100;
  }
  return null;
});

export default mongoose.model('InvestmentProposal', investmentProposalSchema);