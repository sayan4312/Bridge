import InvestmentProposal from '../models/InvestmentProposal.js';
import BusinessIdea from '../models/BusinessIdea.js';
import ActivityLog from '../models/ActivityLog.js';
import ChatRoom from '../models/ChatRoom.js';
import { createNotification } from './notificationController.js';

// @desc    Get investment proposals
export const getInvestmentProposals = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, type,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    let query = {};

    if (req.user.role === 'investor') {
      query.investorId = req.user._id;
    } else if (req.user.role === 'business_person') {
      const myIdeas = await BusinessIdea.find({ userId: req.user._id }).select('_id');
      const ids = myIdeas.map(idea => idea._id);
      query.businessIdeaId = { $in: ids };
    }

    if (status) query.status = status;
    if (type) query.type = type;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const proposals = await InvestmentProposal.find(query)
      .sort(sort).skip(skip).limit(Number(limit));

    const total = await InvestmentProposal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: proposals.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { proposals }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single proposal
export const getInvestmentProposal = async (req, res, next) => {
  try {
    const proposal = await InvestmentProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });

    const businessIdea = await BusinessIdea.findById(proposal.businessIdeaId).populate('userId');
    const businessOwnerId = businessIdea?.userId?._id?.toString() || businessIdea?.userId?.toString();
    const isOwner = proposal.investorId.toString() === req.user._id.toString();
    const isBusinessOwner = businessOwnerId === req.user._id.toString();

    if (!isOwner && !isBusinessOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({ success: true, data: { proposal } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create proposal
export const createInvestmentProposal = async (req, res, next) => {
  try {
    const { businessIdeaId } = req.body;

    const idea = await BusinessIdea.findById(businessIdeaId);
    if (!idea) return res.status(404).json({ success: false, message: 'Business idea not found' });
    if (idea.status !== 'active') return res.status(400).json({ success: false, message: 'Inactive idea' });
    if (idea.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot invest in your own idea' });
    }

    const existing = await InvestmentProposal.findOne({
      businessIdeaId,
      investorId: req.user._id,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Already proposed' });
    }

    req.body.investorId = req.user._id;
    const proposal = await InvestmentProposal.create(req.body);

    await proposal.populate([
      { path: 'businessIdeaId', select: 'title description category investmentNeeded userId' },
      { path: 'investorId', select: 'name email role avatar' }
    ]);

    await ActivityLog.logActivity(
      req.user._id,
      'INVESTMENT_PROPOSAL_CREATED',
      'InvestmentProposal',
      proposal._id,
      { businessIdeaId, amount: proposal.amount, type: proposal.type },
      req
    );

    // Create chat room automatically when proposal is submitted
    try {
      // Ensure we pass only ObjectId strings
      const investorId = req.user._id.toString();
      const businessOwnerId = idea.userId._id ? idea.userId._id.toString() : idea.userId.toString();
      const businessIdeaId = idea._id.toString();
      const investmentProposalId = proposal._id.toString();
      const chatRoom = await ChatRoom.findOrCreateChatRoom(
        investorId,
        businessOwnerId,
        businessIdeaId,
        investmentProposalId
      );
      if (!chatRoom) {
        console.error(`[createInvestmentProposal] Chat room creation returned null/undefined!`);
      }
    } catch (chatError) {
      console.error('❌ Error creating chat room:', chatError);
    }

    await createNotification(
      idea.userId,
      'INVESTMENT_PROPOSAL_RECEIVED',
      'New Investment Proposal',
      `${req.user.name} has sent you an investment proposal for "${idea.title}".`,
      { proposalId: proposal._id, businessIdeaId: idea._id },
      null,
      'high',
      req
    );

    res.status(201).json({ success: true, data: { proposal } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update proposal status
export const updateProposalStatus = async (req, res, next) => {
  try {
    const { status, responseMessage } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const proposal = await InvestmentProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'pending') return res.status(400).json({ success: false, message: 'Already responded' });

    const idea = await BusinessIdea.findById(proposal.businessIdeaId).populate('userId');
    if (!idea) return res.status(404).json({ success: false, message: 'Business idea not found' });

    const ideaOwnerId = idea.userId?._id?.toString() || idea.userId.toString();
    if (ideaOwnerId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    proposal.status = status;
    proposal.responseMessage = responseMessage;
    proposal.respondedAt = new Date();
    await proposal.save();

    if (status === 'accepted') {
      idea.currentFunding += proposal.amount;
      idea.investorCount += 1;
      if (idea.currentFunding >= idea.fundingGoal) {
        idea.status = 'funded';
      }
      await idea.save();
    }

    await proposal.populate([
      { path: 'businessIdeaId', select: 'title description category investmentNeeded userId' },
      { path: 'investorId', select: 'name email role avatar' }
    ]);

    await ActivityLog.logActivity(
      req.user._id,
      status === 'accepted' ? 'INVESTMENT_PROPOSAL_ACCEPTED' : 'INVESTMENT_PROPOSAL_REJECTED',
      'InvestmentProposal',
      proposal._id,
      { proposalId: proposal._id, amount: proposal.amount, responseMessage },
      req
    );

    await createNotification(
      proposal.investorId,
      status === 'accepted' ? 'INVESTMENT_PROPOSAL_ACCEPTED' : 'INVESTMENT_PROPOSAL_REJECTED',
      `Your proposal was ${status}`,
      `Your investment proposal for "${idea.title}" was ${status}.`,
      { proposalId: proposal._id, businessIdeaId: idea._id, responseMessage },
      null,
      status === 'accepted' ? 'high' : 'medium',
      req
    );

    res.status(200).json({ success: true, data: { proposal } });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw proposal
export const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await InvestmentProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });

    if (proposal.investorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw now' });
    }

    proposal.status = 'withdrawn';
    await proposal.save();

    await ActivityLog.logActivity(
      req.user._id,
      'INVESTMENT_PROPOSAL_WITHDRAWN',
      'InvestmentProposal',
      proposal._id,
      { proposalId: proposal._id },
      req
    );

    res.status(200).json({ success: true, message: 'Proposal withdrawn successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get proposals for a business idea
export const getProposalsForBusinessIdea = async (req, res, next) => {
  try {
    const { businessIdeaId } = req.params;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const idea = await BusinessIdea.findById(businessIdeaId);
    if (!idea) return res.status(404).json({ success: false, message: 'Business idea not found' });

    const ideaOwnerId = idea.userId?._id?.toString() || idea.userId.toString();
    if (ideaOwnerId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const query = { businessIdeaId };
    if (status) query.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const proposals = await InvestmentProposal.find(query)
      .populate('investorId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await InvestmentProposal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: proposals.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { proposals }
    });
  } catch (error) {
    next(error);
  }
};
