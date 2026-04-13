import { Request, Response } from 'express';
import User from '../models/User';
import Attendance from '../models/Attendance';
import Subscription from '../models/Subscription';
import Measurement from '../models/Measurement';
import { successResponse, errorResponse } from '../utils/apiResponse';
import logger from '../utils/logger';

export class UserController {
  /**
   * @swagger
   * /api/v1/users/me:
   *   get:
   *     tags: [Users]
   *     summary: Get current logged-in user profile
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Profile data retrieved successfully
   */
  async getProfile(req: any, res: Response) {
    try {
      const user = await User.findById(req.user.id).select('-password').lean();
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      // Fetch active subscription
      const activeSubscription = await Subscription.findOne({
        userId: req.user.id,
        status: 'active'
      }).sort({ createdAt: -1 }).lean();

      return successResponse(res, 'Profile retrieved', {
        ...user,
        activeSubscription
      });
    } catch (error: any) {
      logger.error(`Get Profile Error: ${error.message}`);
      return errorResponse(res, 'Failed to retrieve profile', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/users/attendance:
   *   get:
   *     tags: [Users]
   *     summary: Get attendance history for current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Attendance logs retrieved
   */
  async getAttendanceHistory(req: any, res: Response) {
    try {
      const logs = await Attendance.find({ userId: req.user.id }).sort({ checkIn: -1 });
      return successResponse(res, 'Attendance history retrieved', logs);
    } catch (error: any) {
      logger.error(`Attendance History Error: ${error.message}`);
      return errorResponse(res, 'Failed to retrieve attendance history', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/users/subscriptions:
   *   get:
   *     tags: [Users]
   *     summary: Get payment and subscription history for current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Subscription history retrieved
   */
  async getSubscriptionHistory(req: any, res: Response) {
    try {
      const history = await Subscription.find({ userId: req.user.id })
        .populate('planId', 'name price')
        .sort({ createdAt: -1 });
      return successResponse(res, 'Subscription history retrieved', history);
    } catch (error: any) {
      logger.error(`Subscription History Error: ${error.message}`);
      return errorResponse(res, 'Failed to retrieve subscription history', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/users/measurements:
   *   post:
   *     tags: [Users]
   *     summary: Log weight and body measurements
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [weight]
   *             properties:
   *               weight: { type: number, example: 75.5 }
   *               height: { type: number, example: 175 }
   *               bodyFat: { type: number, example: 18.2 }
   *   get:
   *     tags: [Users]
   *     summary: Get measurement history and BMI progress
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: History retrieved
   */
  async addMeasurement(req: any, res: Response) {
    try {
      const measurement = await Measurement.create({
        ...req.body,
        userId: req.user.id,
      });
      return successResponse(res, 'Measurement logged successfully', measurement, 201);
    } catch (error: any) {
      logger.error(`Add Measurement Error: ${error.message}`);
      return errorResponse(res, 'Failed to log measurement', 500);
    }
  }

  async getMeasurementHistory(req: any, res: Response) {
    try {
      const history = await Measurement.find({ userId: req.user.id }).sort({ date: -1 });
      return successResponse(res, 'Measurement history retrieved', history);
    } catch (error: any) {
      logger.error(`Get Measurement History Error: ${error.message}`);
      return errorResponse(res, 'Failed to retrieve history', 500);
    }
  }
}

export default new UserController();
