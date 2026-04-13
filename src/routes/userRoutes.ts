import express from 'express';
import userController from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect); // All user routes are protected

router.get('/me', userController.getProfile);
router.get('/attendance', userController.getAttendanceHistory);
router.get('/subscriptions', userController.getSubscriptionHistory);

// Progress Tracking
router.post('/measurements', userController.addMeasurement);
router.get('/measurements', userController.getMeasurementHistory);

export default router;
