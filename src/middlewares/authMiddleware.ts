import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/apiResponse';
import authService from '../services/authService';

export const protect = async (req: any, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log(`[AUTH DEBUG] 401: No token found in Authorization header for ${req.originalUrl}`);
    return errorResponse(res, 'Not authorized to access this route', 401);
  }

  try {
    // Check if blacklisted in Redis
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.log(`[AUTH DEBUG] 401: Token is blacklisted for ${req.originalUrl}`);
      return errorResponse(res, 'Session expired. Please login again', 401);
    }

    // Verify token using centralized service
    const decoded = authService.verifyAccessToken(token);
    if (!decoded) {
      console.log(`[AUTH DEBUG] 401: Token verification failed for ${req.originalUrl}`);
      return errorResponse(res, 'Not authorized to access this route', 401);
    }
    
    req.user = decoded;
    next();
  } catch (error: any) {
    console.log(`[AUTH DEBUG] 401: Exception in auth middleware: ${error.message}`);
    return errorResponse(res, 'Not authorized to access this route', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};
