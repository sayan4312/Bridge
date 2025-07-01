import mongoose from 'mongoose';

const loanOfferSchema = new mongoose.Schema({
  bankerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Loan title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [1000, 'Loan amount must be at least $1,000']
  },
  maxAmount: {
    type: Number,
    validate: {
      validator: function(value) {
        return !value || value >= this.amount;
      },
      message: 'Maximum amount must be greater than or equal to minimum amount'
    }
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0.1, 'Interest rate must be at least 0.1%'],
    max: [50, 'Interest rate cannot exceed 50%']
  },
  duration: {
    type: Number, // in months
    required: [true, 'Loan duration is required'],
    min: [1, 'Duration must be at least 1 month'],
    max: [360, 'Duration cannot exceed 360 months']
  },
  conditions: {
    type: String,
    required: [true, 'Loan conditions are required'],
    maxlength: [2000, 'Conditions cannot be more than 2000 characters']
  },
  requirements: {
    minCreditScore: {
      type: Number,
      min: 300,
      max: 850
    },
    minAnnualRevenue: Number,
    collateralRequired: {
      type: Boolean,
      default: false
    },
    businessPlanRequired: {
      type: Boolean,
      default: true
    },
    guarantorRequired: {
      type: Boolean,
      default: false
    }
  },
  loanType: {
    type: String,
    enum: ['business', 'equipment', 'working_capital', 'real_estate', 'personal', 'other'],
    default: 'business'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  approvalRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  processingTime: {
    type: String,
    enum: ['1-3 days', '1 week', '2 weeks', '1 month', '2+ months'],
    default: '1 week'
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
loanOfferSchema.index({ bankerId: 1 });
loanOfferSchema.index({ status: 1 });
loanOfferSchema.index({ loanType: 1 });
loanOfferSchema.index({ interestRate: 1 });
loanOfferSchema.index({ amount: 1 });
loanOfferSchema.index({ createdAt: -1 });

// Populate banker information
loanOfferSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'bankerId',
    select: 'name email role avatar profile.company'
  });
  next();
});

// Virtual for monthly payment calculation
loanOfferSchema.virtual('monthlyPayment').get(function() {
  const monthlyRate = this.interestRate / 100 / 12;
  const payment = (this.amount * monthlyRate * Math.pow(1 + monthlyRate, this.duration)) / 
                 (Math.pow(1 + monthlyRate, this.duration) - 1);
  return Math.round(payment * 100) / 100;
});

// Virtual for total payment
loanOfferSchema.virtual('totalPayment').get(function() {
  return Math.round(this.monthlyPayment * this.duration * 100) / 100;
});

export default mongoose.model('LoanOffer', loanOfferSchema);