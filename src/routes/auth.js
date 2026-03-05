import express from 'express';
import {
  register,
  login,
  verifyToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Protected Routes
router.get('/verify', protect, verifyToken);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin Routes
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.put('/admin/users/:userId/role', protect, adminOnly, updateUserRole);
router.delete('/admin/users/:userId', protect, adminOnly, deleteUser);

export default router;
