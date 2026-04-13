import { z } from 'zod';

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Plan name must be at least 3 characters'),
    price: z.number().positive('Price must be positive'),
    durationMonths: z.number().int().min(1, 'Duration must be at least 1 month'),
    description: z.string().optional(),
  }),
});
