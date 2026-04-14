import express from 'express';
import adminController from '../controllers/adminController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // All routes here require Admin role

router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.post('/users/:id/freeze', adminController.freezeMembership);

// Coupon Management
router.get('/coupons', adminController.getAllCoupons);
router.post('/coupons', adminController.createCoupon);
router.patch('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// Plan Management
router.get('/plans', adminController.getAllPlans);
router.patch('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

// Subscription Management
router.get('/subscriptions', adminController.getAllSubscriptions);

// Attendance Management
router.get('/attendance', adminController.getAllAttendance);

// Measurement Management
router.get('/measurements', adminController.getAllMeasurements);

export default router;
