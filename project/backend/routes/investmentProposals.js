import express from 'express';
import {
  getInvestmentProposals,
  getInvestmentProposal,
  createInvestmentProposal,
  updateProposalStatus,
  withdrawProposal,
  getProposalsForBusinessIdea
} from '../controllers/investmentProposalController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validateInvestmentProposal, validateObjectId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', validatePagination, getInvestmentProposals);
router.get('/:id', validateObjectId('id'), getInvestmentProposal);
router.post('/', authorize('investor'), validateInvestmentProposal, createInvestmentProposal);
router.put('/:id/status', validateObjectId('id'), authorize('business_person'), updateProposalStatus);
router.put('/:id/withdraw', validateObjectId('id'), authorize('investor'), withdrawProposal);
router.get('/business-idea/:businessIdeaId', validateObjectId('businessIdeaId'), authorize('business_person'), getProposalsForBusinessIdea);

export default router;