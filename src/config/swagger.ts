import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'The Burning Club API',
      description: 'Production-grade backend for Gym Management System (Automated Documentation)',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@theburningclub.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        HealthCheck: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['customer', 'admin'] },
            membershipStatus: { type: 'string', enum: ['active', 'inactive', 'expired'] },
          },
        },
        Plan: {
          type: 'object',
          required: ['name', 'price', 'durationMonths'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            durationMonths: { type: 'number' },
            description: { type: 'string' },
          },
        },
        Coupon: {
          type: 'object',
          required: ['code', 'discountPercent', 'expiryDate'],
          properties: {
            code: { type: 'string' },
            discountPercent: { type: 'number' },
            expiryDate: { type: 'string', format: 'date' },
            maxDiscount: { type: 'number' },
            minOrderAmount: { type: 'number' },
          },
        },
        Measurement: {
          type: 'object',
          required: ['weight', 'date'],
          properties: {
            weight: { type: 'number' },
            height: { type: 'number' },
            bmi: { type: 'number' },
            bodyFat: { type: 'number' },
            muscleMass: { type: 'number' },
            date: { type: 'string', format: 'date' },
          },
        },
      },
    },
  },
  // Path to the API docs inside the project
  // We scan both the route files and the main index file
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts'),
    path.join(__dirname, '../index.ts'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
