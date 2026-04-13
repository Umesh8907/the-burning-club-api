import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().url(),
  CACHE_STORE: z.enum(['redis', 'memory']).default('memory'),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(10),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  GYM_QR_SECRET: z.string().min(1).default('THE_BURNING_CLUB_2024'),
});

const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed:');
      error.issues.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
  }
};

export default validateEnv;
