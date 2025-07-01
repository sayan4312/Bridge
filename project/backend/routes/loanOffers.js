import express from 'express';
import {
  getLoanOffers,
  getLoanOffer,
  createLoanOffer,
  updateLoanOffer,
  deleteLoanOffer,
  getMyLoanOffers
} from '../controllers/loanOfferController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validateLoanOffer, validateObjectId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// Public routes
router.get('/', validatePagination, getLoanOffers);
router.get('/:id', validateObjectId('id'), getLoanOffer);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/my/offers', authorize('banker'), getMyLoanOffers);
router.post('/', authorize('banker'), validateLoanOffer, createLoanOffer);
router.put('/:id', validateObjectId('id'), authorize('banker'), validateLoanOffer, updateLoanOffer);
router.delete('/:id', validateObjectId('id'), authorize('banker'), deleteLoanOffer);

export default router;