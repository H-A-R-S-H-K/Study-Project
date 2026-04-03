import type { Request, Response } from 'express';
import { discoveryService, type NearbyQuery } from '../services/discovery.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Query params are validated+coerced by the nearbyQuerySchema before we get here. */
const toQuery = (req: Request): NearbyQuery => ({
  lng: Number(req.query.lng),
  lat: Number(req.query.lat),
  radius: req.query.radius ? Number(req.query.radius) : undefined,
  limit: req.query.limit ? Number(req.query.limit) : undefined,
  type: req.query.type as string | undefined,
});

export const nearbyVehicles = asyncHandler(async (req: Request, res: Response) => {
  const items = await discoveryService.nearbyVehicles(toQuery(req));
  ApiResponse.ok(res, items, `${items.length} vehicles nearby`);
});

export const nearbyDrivers = asyncHandler(async (req: Request, res: Response) => {
  const items = await discoveryService.nearbyDrivers(toQuery(req));
  ApiResponse.ok(res, items, `${items.length} drivers nearby`);
});

export const nearbyProviders = asyncHandler(async (req: Request, res: Response) => {
  const items = await discoveryService.nearbyProviders(toQuery(req));
  ApiResponse.ok(res, items, `${items.length} providers nearby`);
});
