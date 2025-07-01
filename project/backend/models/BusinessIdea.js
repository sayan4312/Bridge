import mongoose from 'mongoose';

const businessIdeaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Technology', 'Healthcare', 'Finance', 'Agriculture', 'Education', 'Manufacturing', 'Retail', 'Services', 'Other']
  },
  investmentNeeded: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [1000, 'Investment must be at least $1,000']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'funded', 'closed'],
    default: 'active'
  },
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  }],
  tags: [String],
  fundingGoal: {
    type: Number,
    default: function() { return this.investmentNeeded; }
  },
  currentFunding: {
    type: Number,
    default: 0
  },
  investorCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
businessIdeaSchema.index({ userId: 1 });
businessIdeaSchema.index({ category: 1 });
businessIdeaSchema.index({ status: 1 });
businessIdeaSchema.index({ createdAt: -1 });
businessIdeaSchema.index({ title: 'text', description: 'text' });

// Virtual for funding percentage
businessIdeaSchema.virtual('fundingPercentage').get(function() {
  return Math.round((this.currentFunding / this.fundingGoal) * 100);
});

// Populate user information
businessIdeaSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'userId',
    select: 'name email role avatar'
  });
  next();
});

export default mongoose.model('BusinessIdea', businessIdeaSchema);