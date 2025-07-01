import LoanOffer from '../models/LoanOffer.js';
import ActivityLog from '../models/ActivityLog.js';

// ✅ Get all loan offers (public + filtered)
export const getLoanOffers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      loanType,
      minAmount,
      maxAmount,
      maxInterestRate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status && status !== 'all') query.status = status;
    if (loanType && loanType !== 'all') query.loanType = loanType;
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    if (maxInterestRate) {
      query.interestRate = { $lte: Number(maxInterestRate) };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const loanOffers = await LoanOffer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('bankerId', 'name email role avatar profile.company');

    const total = await LoanOffer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: loanOffers.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { loanOffers }
    });
  } catch (error) {
    console.error('❌ Get loan offers error:', error.message);
    next(error);
  }
};

// ✅ Get a single loan offer
export const getLoanOffer = async (req, res, next) => {
  try {
    const loanOffer = await LoanOffer.findById(req.params.id)
      .populate('bankerId', 'name email role avatar profile.company');

    if (!loanOffer) {
      return res.status(404).json({ success: false, message: 'Loan offer not found' });
    }

    res.status(200).json({ success: true, data: { loanOffer } });
  } catch (error) {
    console.error('❌ Get loan offer error:', error.message);
    next(error);
  }
};

// ✅ Create a loan offer
export const createLoanOffer = async (req, res, next) => {
  try {
    req.body.bankerId = req.user._id;

    const loanOffer = await LoanOffer.create(req.body);
    await loanOffer.populate('bankerId', 'name email role avatar profile.company');

    await ActivityLog.logActivity(
      req.user._id,
      'LOAN_OFFER_CREATED',
      'LoanOffer',
      loanOffer._id,
      {
        amount: loanOffer.amount,
        interestRate: loanOffer.interestRate,
        loanType: loanOffer.loanType
      },
      req
    );

    console.log(`✅ Loan offer created: ${loanOffer.amount} by ${req.user.email}`);

    res.status(201).json({ success: true, data: { loanOffer } });
  } catch (error) {
    console.error('❌ Create loan offer error:', error.message);
    next(error);
  }
};

// ✅ Update loan offer
export const updateLoanOffer = async (req, res, next) => {
  try {
    const loanOffer = await LoanOffer.findById(req.params.id).populate('bankerId');

    if (!loanOffer) {
      return res.status(404).json({ success: false, message: 'Loan offer not found' });
    }

    const bankerIdStr = loanOffer.bankerId._id?.toString() || loanOffer.bankerId.toString();
    if (bankerIdStr !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updatableFields = [
      'title', 'description', 'amount', 'maxAmount', 'interestRate', 'duration',
      'conditions', 'loanType', 'status', 'processingTime', 'tags'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        loanOffer[field] = req.body[field];
      }
    });

    if (req.body.requirements) {
      loanOffer.requirements = {
        ...loanOffer.requirements,
        ...req.body.requirements
      };
    }

    await loanOffer.save();
    await loanOffer.populate('bankerId', 'name email role avatar profile.company');

    res.status(200).json({ success: true, data: { loanOffer } });
  } catch (error) {
    console.error('❌ Update loan offer error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Validation failed'
    });
  }
};

// ✅ Delete loan offer
export const deleteLoanOffer = async (req, res, next) => {
  try {
    const loanOffer = await LoanOffer.findById(req.params.id);

    if (!loanOffer) {
      return res.status(404).json({ success: false, message: 'Loan offer not found' });
    }

    if (loanOffer.bankerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await loanOffer.deleteOne();

    await ActivityLog.logActivity(
      req.user._id,
      'LOAN_OFFER_DELETED',
      'LoanOffer',
      loanOffer._id,
      { amount: loanOffer.amount },
      req
    );

    console.log(`🗑️ Loan offer deleted: ${loanOffer._id} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Loan offer deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete loan offer error:', error.message);
    next(error);
  }
};

// ✅ Get loan offers of logged-in banker
export const getMyLoanOffers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { bankerId: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const loanOffers = await LoanOffer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('bankerId', 'name email role avatar profile.company');

    const total = await LoanOffer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: loanOffers.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: { loanOffers }
    });
  } catch (error) {
    console.error('❌ Get my loan offers error:', error.message);
    next(error);
  }
};
