import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    qrSecret: z.string().min(1, 'QR code is required'),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
});
