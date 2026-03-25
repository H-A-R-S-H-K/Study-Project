import { z } from 'zod';
import { VehicleType, values } from '../types/enums.js';

export const upsertDriverSchema = z.object({
  licenseNumber: z.string().trim().min(3).max(30),
  experienceYears: z.coerce.number().int().min(0).max(80),
  vehicleCategories: z
    .array(z.enum(values(VehicleType) as [string, ...string[]]))
    .min(1, 'Select at least one vehicle category'),
  bio: z.string().trim().max(500).optional(),
});

export const driverAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
