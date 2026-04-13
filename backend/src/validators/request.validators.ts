import { z } from 'zod';
import { RequestStatus, ServiceType, VehicleType, values } from '../types/enums.js';

const place = z.object({
  address: z.string().trim().min(2).max(300),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  }),
});

export const createRequestSchema = z.object({
  pickup: place,
  destination: place,
  serviceType: z.enum(values(ServiceType) as [string, ...string[]]),
  vehicleType: z.enum(values(VehicleType) as [string, ...string[]]).optional(),
  // Accept ISO strings or epoch ms; must be a valid, not-too-past date.
  scheduledAt: z.coerce.date().refine(
    (d) => d.getTime() > Date.now() - 60 * 60 * 1000,
    'Scheduled time cannot be in the past',
  ),
  description: z.string().trim().max(1000).optional(),
});

export const cancelRequestSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const requestIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});

export const feedQuerySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
  radius: z.coerce.number().int().positive().max(100_000).optional(),
  vehicleType: z.enum(values(VehicleType) as [string, ...string[]]).optional(),
});

export const historyQuerySchema = z.object({
  status: z.enum(values(RequestStatus) as [string, ...string[]]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
});
