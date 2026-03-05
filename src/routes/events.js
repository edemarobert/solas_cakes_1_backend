import express from 'express';
import { 
  getAllEvents, 
  getEventById, 
  getEventsByType, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/type/:type', getEventsByType);

// Admin routes
router.post('/', protect, adminOnly, createEvent);
router.put('/:id', protect, adminOnly, updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

export default router;
