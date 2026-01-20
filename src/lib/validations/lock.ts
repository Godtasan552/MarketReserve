import { z } from 'zod';

export const lockSchema = z.object({
  lockNumber: z.string().min(1, 'Lock number is required'),
  zone: z.string().min(1, 'Zone ID is required'),
  size: z.object({
    width: z.number().positive('Width must be positive'),
    length: z.number().positive('Length must be positive'),
    unit: z.enum(['m', 'sqm']).default('m'),
  }),
  pricing: z.object({
    daily: z.number().positive('Daily price must be positive'),
    weekly: z.number().optional(),
    monthly: z.number().optional(),
  }),
  description: z.string().optional(),
  status: z.enum(['available', 'booked', 'rented', 'maintenance']).default('available'),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type LockFormData = z.infer<typeof lockSchema>;
