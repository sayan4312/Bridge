import BusinessIdea from '../models/BusinessIdea.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from './notificationController.js';

// @desc    Get all business ideas
export const getBusinessIdeas = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, category, status = 'active',
      search, sortBy = 'createdAt', sortOrder = 'desc',
      minInvestment, maxInvestment
    } = req.query;

    const query = { status };

    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };
    if (minInvestment || maxInvestment) {
      query.investmentNeeded = {};
      if (minInvestment) query.investmentNeeded.$gte = Number(minInvestment);
      if (maxInvestment) query.investmentNeeded.$lte = Number(maxInvestment);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const businessIdeas = await BusinessIdea.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email role avatar');

    const total = await BusinessIdea.countDocuments(query);

    if (search && req.user) {
      await ActivityLog.logActivity(
        req.user._id,
        'SEARCH_PERFORMED',
        'BusinessIdea',
        req.user._id,
        { searchTerm: search, category, resultsCount: businessIdeas.length },
        req
      );
    }

    res.status(200).json({
      success: true,
      count: businessIdeas.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { businessIdeas }
    });
  } catch (error) {
    console.error('❌ Error fetching business ideas:', error.message);
    next(error);
  }
};

// @desc    Get single business idea
export const getBusinessIdea = async (req, res, next) => {
  try {
    const businessIdea = await BusinessIdea.findById(req.params.id)
      .populate('userId', 'name email role avatar profile');

    if (!businessIdea) {
      return res.status(404).json({ success: false, message: 'Business idea not found' });
    }

    businessIdea.views += 1;
    await businessIdea.save({ validateBeforeSave: false });

    if (req.user) {
      await ActivityLog.logActivity(
        req.user._id,
        'VIEW_BUSINESS_IDEA',
        'BusinessIdea',
        businessIdea._id,
        { viewedAt: new Date() },
        req
      );
    }

    res.status(200).json({ success: true, data: { businessIdea } });
  } catch (error) {
    console.error('❌ Error fetching single business idea:', error.message);
    next(error);
  }
};

// @desc    Create new business idea
export const createBusinessIdea = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;

    const businessIdea = await BusinessIdea.create(req.body);
    await businessIdea.populate('userId', 'name email role avatar');

    await ActivityLog.logActivity(
      req.user._id,
      'BUSINESS_IDEA_CREATED',
      'BusinessIdea',
      businessIdea._id,
      {
        title: businessIdea.title,
        category: businessIdea.category,
        investmentNeeded: businessIdea.investmentNeeded
      },
      req
    );

    // --- Send notification to the user ---
    await createNotification(
  req.user._id,
  'NEW_BUSINESS_IDEA', // ✅ valid enum
  'Business Idea Created',
  `Your business idea "${businessIdea.title}" was created successfully.`,
  { businessIdeaId: businessIdea._id },
  null,
  'medium',
  req
);


    console.log(`✅ Business idea created: "${businessIdea.title}" by ${req.user.email}`);

    res.status(201).json({ success: true, data: { businessIdea } });
  } catch (error) {
    console.error('❌ Error creating business idea:', error.message);
    next(error);
  }
};

// @desc    Update business idea
export const updateBusinessIdea = async (req, res, next) => {
  try {
    let businessIdea = await BusinessIdea.findById(req.params.id);

    if (!businessIdea) {
      return res.status(404).json({ success: false, message: 'Business idea not found' });
    }

    if (businessIdea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    businessIdea = await BusinessIdea.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('userId', 'name email role avatar');

    await ActivityLog.logActivity(
      req.user._id,
      'BUSINESS_IDEA_UPDATED',
      'BusinessIdea',
      businessIdea._id,
      { updatedFields: Object.keys(req.body) },
      req
    );

    console.log(`✏️ Business idea updated: "${businessIdea.title}" by ${req.user.email}`);

    res.status(200).json({ success: true, data: { businessIdea } });
  } catch (error) {
    console.error('❌ Error updating business idea:', error.message);
    next(error);
  }
};

// @desc    Delete business idea
export const deleteBusinessIdea = async (req, res, next) => {
  try {
    const businessIdea = await BusinessIdea.findById(req.params.id);

    if (!businessIdea) {
      return res.status(404).json({ success: false, message: 'Business idea not found' });
    }

    if (businessIdea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await businessIdea.deleteOne();

    await ActivityLog.logActivity(
      req.user._id,
      'BUSINESS_IDEA_DELETED',
      'BusinessIdea',
      businessIdea._id,
      { title: businessIdea.title },
      req
    );

    console.log(`🗑️ Business idea deleted: "${businessIdea.title}" by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Business idea deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting business idea:', error.message);
    next(error);
  }
};

// @desc    Like or unlike a business idea
export const toggleLike = async (req, res, next) => {
  try {
    const businessIdea = await BusinessIdea.findById(req.params.id);
    if (!businessIdea) {
      return res.status(404).json({ success: false, message: 'Business idea not found' });
    }

    const likeIndex = businessIdea.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    let action;
    if (likeIndex > -1) {
      businessIdea.likes.splice(likeIndex, 1);
      action = 'UNLIKE_BUSINESS_IDEA';
    } else {
      businessIdea.likes.push({ user: req.user._id });
      action = 'LIKE_BUSINESS_IDEA';
    }

    await businessIdea.save();

    await ActivityLog.logActivity(
      req.user._id,
      action,
      'BusinessIdea',
      businessIdea._id,
      { likeCount: businessIdea.likes.length },
      req
    );

    res.status(200).json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likeCount: businessIdea.likes.length
      }
    });
  } catch (error) {
    console.error('❌ Error toggling like:', error.message);
    next(error);
  }
};

// @desc    Get logged-in user's business ideas
import InvestmentProposal from '../models/InvestmentProposal.js';

export const getMyBusinessIdeas = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Fetch business ideas
    const businessIdeas = await BusinessIdea.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email role avatar');

    const total = await BusinessIdea.countDocuments(query);

    // Fetch proposal counts for each business idea
    const ideaIds = businessIdeas.map(idea => idea._id);
    const proposalCounts = await InvestmentProposal.aggregate([
      { $match: { businessIdeaId: { $in: ideaIds } } },
      { $group: { _id: '$businessIdeaId', count: { $sum: 1 } } }
    ]);

    // Map counts to ideas
    const countsMap = proposalCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // Attach count to each idea
    const ideasWithProposalCount = businessIdeas.map(idea => ({
      ...idea.toObject(),
      proposalCount: countsMap[idea._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      count: businessIdeas.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { businessIdeas: ideasWithProposalCount }
    });
  } catch (error) {
    console.error('❌ Error fetching user business ideas:', error.message);
    next(error);
  }
};
