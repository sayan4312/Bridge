import express from 'express';
import {
  getConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getMyConsultations,
  toggleLike,
  addComment
} from '../controllers/consultationController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { validateConsultation, validateObjectId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, validatePagination, getConsultations);
router.get('/:id', validateObjectId('id'), optionalAuth, getConsultation);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/my/consultations', authorize('business_advisor'), getMyConsultations);
router.post('/', authorize('business_advisor'), validateConsultation, createConsultation);
router.put('/:id', validateObjectId('id'), authorize('business_advisor'), validateConsultation, updateConsultation);
router.delete('/:id', validateObjectId('id'), authorize('business_advisor'), deleteConsultation);
router.post('/:id/like', validateObjectId('id'), toggleLike);
router.post('/:id/comment', validateObjectId('id'), addComment);

export default router;