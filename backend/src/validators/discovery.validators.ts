import { z } from 'zod';
import { VehicleType, values } from '../types/enums.js';

/**
 * Query params for nearby searches. Coordinates are required; radius/limit are
 * bounded; `type` is an optional vehicle-type/category filter. All coerced from
 * strings since they arrive as query params.
 */
export const nearbyQuerySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
  radius: z.coerce.number().int().positive().max(100_000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.enum(values(VehicleType) as [string, ...string[]]).optional(),
});

export type NearbyQueryInput = z.infer<typeof nearbyQuerySchema>;
