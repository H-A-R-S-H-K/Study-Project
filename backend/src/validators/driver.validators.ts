import { z } from 'zod';
import { VehicleType, values } from '../types/enums.js';

const geoPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

export const upsertDriverSchema = z.object({
  licenseNumber: z.string().trim().min(3).max(30),
  experienceYears: z.coerce.number().int().min(0).max(80),
  vehicleCategories: z
    .array(z.enum(values(VehicleType) as [string, ...string[]]))
    .min(1, 'Select at least one vehicle category'),
  bio: z.string().trim().max(500).optional(),
  location: geoPoint.optional(),
});

export const driverAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

/** Drivers push location updates as they move (feeds nearby matching). */
export const driverLocationSchema = z.object({
  location: geoPoint,
});
