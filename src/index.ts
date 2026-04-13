import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import logger from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import planRoutes from './routes/planRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import validateEnv from './config/env';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter';
import cronService from './services/cronService';

// Handle Uncaught Exceptions (Before everything else)
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Validate Environment
validateEnv();

// Connect Database
connectDB();

// Init Cron Jobs
cronService.init();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP in dev to avoid conflicts with Next.js
})); 

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use('/api/', apiLimiter); // Apply general rate limit to all api routes

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
const morganFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes); // Stricter limit for auth
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// Static Folder
app.use('/public', express.static(path.join(__dirname, '../public')));

// Basic Health Check Route
/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'The Burning Club API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Root Route
/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: Root endpoint
 *     responses:
 *       '200':
 *         description: Welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Welcome to The Burning Club API
 */
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to The Burning Club API');
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode`);
  logger.info(`Local:            http://localhost:${PORT}`);
  logger.info(`Client URL:       ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  logger.info(`Health Check:     http://localhost:${PORT}/health`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  // Optional: Graceful shutdown
  // server.close(() => process.exit(1));
});

export default app;
