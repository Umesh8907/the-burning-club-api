import { Request, Response } from 'express';
import User from '../models/User';
import Attendance from '../models/Attendance';
import Subscription from '../models/Subscription';
import Coupon from '../models/Coupon';
import { successResponse, errorResponse } from '../utils/apiResponse';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';

export class AdminController {
  /**
   * @swagger
   * /api/v1/admin/dashboard:
   *   get:
   *     tags: [Admin]
   *     summary: Get dashboard analytics and statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Stats retrieved successfully
   */
  async getDashboardStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await User.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: 'count' }],
            activeMembers: [
              { $match: { membershipStatus: 'active' } },
              { $count: 'count' }
            ],
            attendanceToday: [
              {
                $lookup: {
                  from: 'attendances',
                  localField: '_id',
                  foreignField: 'userId',
                  as: 'attendance'
                }
              },
              {
                $match: {
                  'attendance.checkIn': { $gte: today }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]);

      const revenue = await Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const result = {
        totalUsers: stats[0].totalUsers[0]?.count || 0,
        activeMembers: stats[0].activeMembers[0]?.count || 0,
        attendanceToday: stats[0].attendanceToday[0]?.count || 0,
        totalRevenue: (revenue[0]?.total || 0) / 100, // Razorpay amounts are in paise
      };

      return successResponse(res, 'Dashboard stats retrieved', result);
    } catch (error: any) {
      logger.error(`Dashboard Stats Error: ${error.message}`);
      return errorResponse(res, 'Failed to retrieve stats', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/admin/users:
   *   get:
   *     tags: [Admin]
   *     summary: List all gym users
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: User list retrieved
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return successResponse(res, 'User list retrieved', users);
    } catch (error: any) {
      logger.error(`Get Users Error: ${error.message}`);
      return errorResponse(res, 'Failed to retrieve users', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/admin/users/{id}/toggle-status:
   *   patch:
   *     tags: [Admin]
   *     summary: Manually toggle user active/inactive status
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *         description: Status updated
   */
  async toggleUserStatus(req: Request, res: Response) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return errorResponse(res, 'User not found', 404);

      user.isActive = !user.isActive;
      await user.save();

      logger.info(`Admin toggled status for user ${user._id} to ${user.isActive}`);
      return successResponse(res, `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`, user);
    } catch (error: any) {
      logger.error(`Toggle Status Error: ${error.message}`);
      return errorResponse(res, 'Failed to update user status', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/admin/users/{id}/freeze:
   *   post:
   *     tags: [Admin]
   *     summary: Freeze membership for a specific number of days
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [days]
   *             properties:
   *               days: { type: number, example: 7 }
   *     responses:
   *       '200':
   *         description: Membership frozen successfully
   */
  async freezeMembership(req: Request, res: Response) {
    try {
      const { days } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return errorResponse(res, 'User not found', 404);

      // We shift the endDate of their latest active subscription
      const subscription = await Subscription.findOne({ 
        userId: user._id, 
        status: 'active' 
      }).sort({ endDate: -1 });

      if (!subscription) {
        return errorResponse(res, 'No active subscription to freeze', 400);
      }

      subscription.endDate = new Date(subscription.endDate.getTime() + days * 24 * 60 * 60 * 1000);
      await subscription.save();

      await notificationService.sendSMS(user.phone, `Your gym membership has been frozen/extended for ${days} days. New expiry: ${subscription.endDate.toDateString()}`);

      logger.info(`Admin frozen membership for user ${user._id} for ${days} days`);
      return successResponse(res, `Membership extended by ${days} days due to freeze`, subscription);
    } catch (error: any) {
      logger.error(`Freeze Membership Error: ${error.message}`);
      return errorResponse(res, 'Failed to freeze membership', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/admin/coupons:
   *   post:
   *     tags: [Admin]
   *     summary: Create a new discount coupon
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [code, discountPercent, expiryDate]
   *             properties:
   *               code: { type: string, example: 'OFFER10' }
   *               discountPercent: { type: number, example: 10 }
   *               expiryDate: { type: string, example: '2024-12-31' }
   *               maxUsage: { type: number, example: 100 }
   *     responses:
   *       '201':
   *         description: Coupon created
   */
  async createCoupon(req: Request, res: Response) {
    try {
      const coupon = await Coupon.create(req.body);
      return successResponse(res, 'Coupon created successfully', coupon, 201);
    } catch (error: any) {
      logger.error(`Create Coupon Error: ${error.message}`);
      return errorResponse(res, 'Failed to create coupon', 500);
    }
  }
}

export default new AdminController();
