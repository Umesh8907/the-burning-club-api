import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['customer', 'admin']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    password: z.string().min(1, 'Password is required'),
  }),
});
