import { Response } from 'express';

/**
 * Standard API Response Wrapper
 */
export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: any = null,
  error: string | null = null
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    error,
  });
};

/**
 * Common success response
 */
export const successResponse = (res: Response, message: string, data: any = null, statusCode: number = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

/**
 * Common error response
 */
export const errorResponse = (res: Response, message: string, statusCode: number = 400, error: any = null) => {
  return sendResponse(res, statusCode, false, message, null, error);
};
