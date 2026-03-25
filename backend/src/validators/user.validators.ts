import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().optional(),
    homeAddress: z.string().trim().max(300).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const updateLocationSchema = z.object({
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  }),
});

export const userIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});
