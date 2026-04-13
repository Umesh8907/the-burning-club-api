import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';
import { errorResponse } from '../utils/apiResponse';
import logger from '../utils/logger';

// Logic to determine which store to use
const getStore = () => {
  if (process.env.CACHE_STORE === 'redis') {
    return new RedisStore({
      // @ts-expect-error - compatibility
      sendCommand: (...args: string[]) => redis.call(...args),
    });
  }
  
  // Default to MemoryStore for development to avoid blocking without local Redis
  logger.info('Using MemoryStore for rate limiting');
  return undefined; 
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: (req: any, res: any) => {
    return errorResponse(res, 'Too many requests, please try again later', 429);
  },
  store: getStore(),
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100, // Increased for dev
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isTestPhone = req.body?.phone === '7209536820';
    if (isTestPhone) logger.info(`Skipping rate limit for Test User: ${req.body.phone}`);
    return isTestPhone;
  },
  message: (req: any, res: any) => {
    return errorResponse(res, 'Too many login attempts, please try again in an hour', 429);
  },
  store: getStore(),
});
