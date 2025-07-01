import Consultation from '../models/Consultation.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from './notificationController.js';

// @desc Get all consultations
export const getConsultations = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, category, isPublic = true,
      search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { isPublic, status: 'published' };
    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const consultations = await Consultation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('advisorId', 'name');

    const total = await Consultation.countDocuments(query);

    if (search && req.user) {
      await ActivityLog.logActivity(
        req.user._id,
        'SEARCH_CONSULTATIONS',
        'Consultation',
        req.user._id,
        { searchTerm: search, category, resultsCount: consultations.length },
        req
      );
    }

    res.status(200).json({
      success: true,
      count: consultations.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { consultations }
    });
  } catch (error) {
    console.error('❌ Error fetching consultations:', error.message);
    next(error);
  }
};

// @desc Get single consultation
export const getConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    consultation.views += 1;
    await consultation.save({ validateBeforeSave: false });

    if (req.user) {
      await ActivityLog.logActivity(
        req.user._id,
        'VIEW_CONSULTATION',
        'Consultation',
        consultation._id,
        { viewedAt: new Date() },
        req
      );
    }

    res.status(200).json({ success: true, data: { consultation } });
  } catch (error) {
    console.error('❌ Error fetching consultation:', error.message);
    next(error);
  }
};

// @desc Create new consultation
export const createConsultation = async (req, res, next) => {
  try {
    req.body.advisorId = req.user._id;

    const consultation = await Consultation.create(req.body);
    await consultation.populate('advisorId', 'name email role avatar profile.company profile.specialization');

    await ActivityLog.logActivity(
      req.user._id,
      'CONSULTATION_CREATED',
      'Consultation',
      consultation._id,
      {
        title: consultation.title,
        category: consultation.category,
        businessIdeaId: consultation.businessIdeaId
      },
      req
    );

    // --- Send notification to the advisor (or another user if needed) ---
   await createNotification(
  req.user._id,
  'CONSULTATION_REQUEST', 
  'Consultation Created',
  `Your consultation "${consultation.title}" was created successfully.`,
  { consultationId: consultation._id },
  null,
  'medium',
  req
);


    console.log(`✅ Consultation created: ${consultation.title} by ${req.user.email}`);

    res.status(201).json({ success: true, data: { consultation } });
  } catch (error) {
    console.error('❌ Error creating consultation:', error.message);
    next(error);
  }
};

// @desc Update consultation
export const updateConsultation = async (req, res, next) => {
  try {
    let consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    if (consultation.advisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await ActivityLog.logActivity(
      req.user._id,
      'CONSULTATION_UPDATED',
      'Consultation',
      consultation._id,
      { updatedFields: Object.keys(req.body) },
      req
    );

    console.log(`✏️ Consultation updated: ${consultation.title} by ${req.user.email}`);

    res.status(200).json({ success: true, data: { consultation } });
  } catch (error) {
    console.error('❌ Error updating consultation:', error.message);
    next(error);
  }
};

// @desc Delete consultation
export const deleteConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    if (consultation.advisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await consultation.deleteOne();

    await ActivityLog.logActivity(
      req.user._id,
      'CONSULTATION_DELETED',
      'Consultation',
      consultation._id,
      { title: consultation.title },
      req
    );

    console.log(`🗑️ Consultation deleted: ${consultation.title} by ${req.user.email}`);

    res.status(200).json({ success: true, message: 'Consultation deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting consultation:', error.message);
    next(error);
  }
};

// @desc Get current advisor's consultations
export const getMyConsultations = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, category,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { advisorId: req.user._id };
    if (status) query.status = status;
    if (category) query.category = category;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const consultations = await Consultation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Consultation.countDocuments(query);

    res.status(200).json({
      success: true,
      count: consultations.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { consultations }
    });
  } catch (error) {
    console.error('❌ Error fetching my consultations:', error.message);
    next(error);
  }
};

// @desc Like/Unlike consultation
export const toggleLike = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const likeIndex = consultation.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    let action;
    if (likeIndex > -1) {
      consultation.likes.splice(likeIndex, 1);
      action = 'UNLIKE_CONSULTATION';
    } else {
      consultation.likes.push({ user: req.user._id });
      action = 'LIKE_CONSULTATION';
    }

    await consultation.save();

    await ActivityLog.logActivity(
      req.user._id,
      action,
      'Consultation',
      consultation._id,
      { likeCount: consultation.likes.length },
      req
    );

    res.status(200).json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likeCount: consultation.likes.length
      }
    });
  } catch (error) {
    console.error('❌ Error toggling like on consultation:', error.message);
    next(error);
  }
};

// @desc Add comment to consultation
export const addComment = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const comment = {
      user: req.user._id,
      content: req.body.content
    };

    consultation.comments.push(comment);
    await consultation.save();

    await consultation.populate('comments.user', 'name email role avatar');

    await ActivityLog.logActivity(
      req.user._id,
      'COMMENT_CREATED',
      'Consultation',
      consultation._id,
      { commentContent: req.body.content },
      req
    );

    res.status(201).json({ success: true, data: { consultation } });
  } catch (error) {
    console.error('❌ Error adding comment:', error.message);
    next(error);
  }
};
