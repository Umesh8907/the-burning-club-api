import express from 'express';
import attendanceController from '../controllers/attendanceController';
import { protect } from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import { checkInSchema } from '../models/validation/attendanceSchema';

const router = express.Router();

/**
 * @swagger
 * /api/v1/attendance/check-in:
 *   post:
 *     tags: [Attendance]
 *     summary: Check-in using QR code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrSecret]
 *             properties:
 *               qrSecret: { type: string }
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       '200':
 *         description: Checked in successfully
 */
router.post('/check-in', protect, validate(checkInSchema), attendanceController.markAttendance);

export default router;
