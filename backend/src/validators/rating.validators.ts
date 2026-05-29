import { z } from 'zod';

export const rateSchema = z.object({
  score: z
    .number({ invalid_type_error: 'Give a star rating' })
    .int()
    .min(1, 'Rating must be 1–5')
    .max(5, 'Rating must be 1–5'),
  review: z.string().trim().max(1000).optional(),
});

export const ratingRequestParams = z.object({
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request id'),
});

export const rateeIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});
