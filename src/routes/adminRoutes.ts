import express from 'express';
import adminController from '../controllers/adminController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // All routes here require Admin role

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.post('/users/:id/freeze', adminController.freezeMembership);
router.post('/coupons', adminController.createCoupon);

export default router;
