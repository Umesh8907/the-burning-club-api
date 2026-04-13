import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import User from '../models/User';
import { successResponse, errorResponse } from '../utils/apiResponse';
import logger from '../utils/logger';

export class AttendanceController {
  async markAttendance(req: any, res: Response) {
    try {
      const { lat, lng, qrSecret } = req.body;
      const userId = req.user.id;

      // 1. Verify QR Secret (Matches fixed QR on gym wall)
      // Production: This should be compared against a value in DB/Config
      const GYM_QR_SECRET = process.env.GYM_QR_SECRET || 'THE_BURNING_CLUB_2024';
      if (qrSecret !== GYM_QR_SECRET) {
        return errorResponse(res, 'Invalid QR Code', 400);
      }

      // 2. Verify User Membership
      const user = await User.findById(userId);
      if (!user || user.membershipStatus !== 'active') {
        return errorResponse(res, 'Active membership required for check-in', 403);
      }

      // 3. Geo-fencing (Optional but recommended)
      if (lat && lng) {
        const gymLat = parseFloat(process.env.GYM_LATITUDE || '0');
        const gymLng = parseFloat(process.env.GYM_LONGITUDE || '0');
        const radius = parseFloat(process.env.GYM_RADIUS_METERS || '100');

        if (gymLat !== 0 && gymLng !== 0) {
          const distance = this.calculateDistance(lat, lng, gymLat, gymLng);
          if (distance > radius) {
            return errorResponse(res, 'You must be at the gym to mark attendance', 400);
          }
        }
      }

      // 4. Prevent duplicate check-in (Today)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const existing = await Attendance.findOne({
        userId,
        checkIn: { $gte: startOfDay },
      });

      if (existing) {
        return successResponse(res, 'You have already checked in today', existing);
      }

      const attendance = await Attendance.create({
        userId,
        location: { lat, lng },
      });

      logger.info(`Attendance marked for user: ${userId}`);
      return successResponse(res, 'Checked in successfully', attendance, 201);
    } catch (error: any) {
      logger.error(`Attendance Error: ${error.message}`);
      return errorResponse(res, 'Failed to mark attendance', 500);
    }
  }

  // Helper: Haversine formula to calculate distance in meters
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }
}

export default new AttendanceController();
