import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessIdeaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessIdea',
    default: null
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Consultation title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Problem description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  advice: {
    type: String,
    required: [true, 'Advice is required'],
    maxlength: [3000, 'Advice cannot be more than 3000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Strategy', 'Marketing', 'Finance', 'Operations', 'Technology', 'Legal', 'HR', 'Sales', 'Other']
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  estimatedReadTime: {
    type: Number, // in minutes
    default: function() {
      const wordCount = (this.description + ' ' + this.advice).split(' ').length;
      return Math.ceil(wordCount / 200); // Average reading speed
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  isPublic: {
    type: Boolean,
    default: true
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
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    ratings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
consultationSchema.index({ advisorId: 1 });
consultationSchema.index({ businessIdeaId: 1 });
consultationSchema.index({ category: 1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ isPublic: 1 });
consultationSchema.index({ createdAt: -1 });
consultationSchema.index({ title: 'text', description: 'text', advice: 'text' });

// Populate references
consultationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'advisorId',
    select: 'name email role avatar profile.company profile.specialization'
  }).populate({
    path: 'businessIdeaId',
    select: 'title category'
  }).populate({
    path: 'clientId',
    select: 'name email role avatar'
  });
  next();
});

// Virtual for like count
consultationSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
consultationSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

export default mongoose.model('Consultation', consultationSchema);