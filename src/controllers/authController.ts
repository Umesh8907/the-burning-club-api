import { Request, Response } from 'express';
import userRepository from '../repositories/userRepository';
import authService from '../services/authService';
import { successResponse, errorResponse } from '../utils/apiResponse';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, phone, password, role } = req.body;

      const existingUser = await userRepository.findByPhone(phone);
      if (existingUser) {
        return errorResponse(res, 'A user with this phone number already exists', 400);
      }

      const user = await userRepository.createUser({
        name,
        phone,
        password,
        role: role || 'customer',
      });

      const { accessToken, refreshToken } = authService.generateTokens(user);

      logger.info(`User registered: ${user.phone}`);
      return successResponse(res, 'User registered successfully', {
        user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
        accessToken,
        refreshToken,
      }, 201);
    } catch (error: any) {
      logger.error(`Registration error: ${error.message}`);
      return errorResponse(res, 'Failed to register user', 500, error.message);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { phone, password } = req.body;

      const user = await userRepository.findByPhone(phone);
      if (!user || !(await user.comparePassword(password))) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      if (!user.isActive) {
        return errorResponse(res, 'Your account has been deactivated. Please contact admin.', 403);
      }

      const { accessToken, refreshToken } = authService.generateTokens(user);

      logger.info(`User logged in: ${user.phone}`);
      return successResponse(res, 'Login successful', {
        user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      logger.error(`Login error: ${error.message}`);
      return errorResponse(res, 'Failed to login', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: Logout user (Invalidate session)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Logged out successfully
   */
  async logout(req: any, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        // Blacklist for the remainder of token life (assuming 24h max for simplicity)
        await authService.blacklistToken(token, 86400);
      }
      logger.info(`User logged out: ${req.user.id}`);
      return successResponse(res, 'Logged out successfully');
    } catch (error: any) {
      logger.error(`Logout Error: ${error.message}`);
      return errorResponse(res, 'Failed to logout', 500);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return errorResponse(res, 'Refresh token required', 400);
      }

      const decoded = authService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return errorResponse(res, 'Invalid or expired refresh token', 401);
      }

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      const accessToken = authService.generateAccessToken(user._id as any, user.role);

      return successResponse(res, 'Token refreshed successfully', {
        accessToken,
        user: { id: user._id, name: user.name, phone: user.phone, role: user.role }
      });
    } catch (error: any) {
      logger.error(`Refresh Token Error: ${error.message}`);
      return errorResponse(res, 'Internal server error during refresh', 500);
    }
  }
}

export default new AuthController();
