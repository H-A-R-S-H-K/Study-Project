import { z } from 'zod';
import { UserRole, VehicleType, values } from '../types/enums.js';

/**
 * Request-body schemas for the auth routes. These are the single source of
 * truth for input shape; the validate() middleware runs them and the error
 * middleware renders per-field messages on failure.
 */

const phone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Enter a valid phone number');

const geoPoint = z.object({
  type: z.literal('Point'),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

export const requestOtpSchema = z.object({
  phone,
});

export const verifyOtpSchema = z.object({
  phone,
  code: z.string().trim().regex(/^\d{4,8}$/, 'Enter the numeric code'),
});

export const registerSchema = z.object({
  registrationToken: z.string().min(10),
  name: z.string().trim().min(2).max(80),
  role: z.enum(values(UserRole) as [string, ...string[]]).refine(
    (r) => r !== UserRole.ADMIN,
    'Invalid role',
  ),
  email: z.string().trim().email().optional(),
  homeAddress: z.string().trim().max(300).optional(),
  location: geoPoint.optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});

// Driver-specific vehicle categories reused when a driver completes their
// profile in Phase 3; exported here so the shape stays co-located with auth.
export const driverCategoriesSchema = z.object({
  vehicleCategories: z.array(z.enum(values(VehicleType) as [string, ...string[]])).min(1),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type VerifyOtpBody = z.infer<typeof verifyOtpSchema>;
