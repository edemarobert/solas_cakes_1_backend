import express from 'express';
import { 
  getAllCakes, 
  getCakeById, 
  getCakesByCategory, 
  createCake, 
  updateCake, 
  deleteCake, 
  addReview 
} from '../controllers/cakeController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllCakes);
router.get('/:id', getCakeById);
router.get('/category/:category', getCakesByCategory);
router.post('/:id/reviews', addReview);

// Admin routes
router.post('/', protect, adminOnly, createCake);
router.put('/:id', protect, adminOnly, updateCake);
router.delete('/:id', protect, adminOnly, deleteCake);

export default router;
