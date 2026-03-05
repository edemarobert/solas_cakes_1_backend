import express from 'express';
import { 
  createOrder, 
  getOrderById, 
  getOrderByNumber, 
  getUserOrders, 
  updateOrderStatus, 
  updatePaymentStatus,
  getAllOrders,
  cancelOrder 
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/track/:orderNumber', getOrderByNumber); // Track order by number

// Protected routes
router.post('/', protect, createOrder); // Create order
router.get('/my-orders/:userId', protect, getUserOrders); // Get user's orders
router.put('/:id/cancel', protect, cancelOrder); // Cancel user's order

// Admin routes
router.get('/', protect, adminOnly, getAllOrders); // Get all orders
router.get('/:id', protect, adminOnly, getOrderById); // Get order details
router.put('/:id/status', protect, adminOnly, updateOrderStatus); // Update status
router.put('/:id/payment', protect, adminOnly, updatePaymentStatus); // Update payment

export default router;
