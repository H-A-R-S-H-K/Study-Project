import { z } from 'zod';
import { VehicleType, values } from '../types/enums.js';

const geoPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

const vehicleType = z.enum(values(VehicleType) as [string, ...string[]]);

export const createVehicleSchema = z.object({
  type: vehicleType,
  title: z.string().trim().min(2).max(100),
  registrationNumber: z.string().trim().min(3).max(20),
  make: z.string().trim().max(60).optional(),
  modelName: z.string().trim().max(60).optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  color: z.string().trim().max(30).optional(),
  capacity: z.coerce.number().min(0).optional(),
  location: geoPoint.optional(),
});

// All fields optional for PATCH; must not be empty.
export const updateVehicleSchema = createVehicleSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  'Provide at least one field to update',
);

export const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const vehicleIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});
