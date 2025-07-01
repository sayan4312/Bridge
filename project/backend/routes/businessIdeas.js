import express from 'express';
import {
  getBusinessIdeas,
  getBusinessIdea,
  createBusinessIdea,
  updateBusinessIdea,
  deleteBusinessIdea,
  toggleLike,
  getMyBusinessIdeas
} from '../controllers/businessIdeaController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { validateBusinessIdea, validateObjectId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// Only allow investor, banker, business_advisor to see all business ideas
router.get(
  '/',
  protect,
  authorize('investor', 'banker', 'business_advisor', 'business_person'),
  validatePagination,
  getBusinessIdeas
);

// Single idea can still be public if you want:
router.get('/:id', validateObjectId('id'), optionalAuth, getBusinessIdea);

// Protected routes for business_person
router.use(protect);

router.get('/my/ideas', authorize('business_person'), getMyBusinessIdeas);
router.post('/', authorize('business_person'), validateBusinessIdea, createBusinessIdea);
router.put('/:id', validateObjectId('id'), authorize('business_person'), validateBusinessIdea, updateBusinessIdea);
router.delete('/:id', validateObjectId('id'), authorize('business_person'), deleteBusinessIdea);
router.post('/:id/like', validateObjectId('id'), toggleLike);

export default router;