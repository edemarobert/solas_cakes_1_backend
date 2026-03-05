import express from 'express';
import { 
  getAllTestimonials, 
  getTestimonialById, 
  createTestimonial, 
  updateTestimonial, 
  verifyTestimonial, 
  deleteTestimonial 
} from '../controllers/testimonialController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllTestimonials);
router.get('/:id', getTestimonialById);
router.post('/', createTestimonial); // Anyone can submit testimonial (unverified)

// Admin routes
router.put('/:id', protect, adminOnly, updateTestimonial);
router.put('/:id/verify', protect, adminOnly, verifyTestimonial);
router.delete('/:id', protect, adminOnly, deleteTestimonial);

export default router;
