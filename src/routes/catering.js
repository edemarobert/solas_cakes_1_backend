import express from 'express';
import { 
  getAllCatering, 
  getCateringById, 
  createCatering, 
  updateCatering, 
  deleteCatering 
} from '../controllers/cateringController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllCatering);
router.get('/:id', getCateringById);

// Admin routes
router.post('/', protect, adminOnly, createCatering);
router.put('/:id', protect, adminOnly, updateCatering);
router.delete('/:id', protect, adminOnly, deleteCatering);

export default router;
