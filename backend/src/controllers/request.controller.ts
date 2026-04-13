import type { Request, Response } from 'express';
import { requestService } from '../services/request.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';
import type { VehicleType } from '../types/enums.js';

const principal = (req: Request): { id: string; role: string } => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const request = await requestService.create(id, req.body);
  ApiResponse.created(res, request, 'Request posted');
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id, role } = principal(req);
  const request = await requestService.getById(id, role, req.params.id);
  ApiResponse.ok(res, request);
});

export const listMyRequests = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const status = req.query.status as string | undefined;
  const { items, meta } = await requestService.listMine(id, status, parsePagination(req.query));
  ApiResponse.ok(res, items, 'OK', meta);
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const request = await requestService.cancel(id, req.params.id, req.body.reason);
  ApiResponse.ok(res, request, 'Request cancelled');
});

export const requestFeed = asyncHandler(async (req: Request, res: Response) => {
  const { id, role } = principal(req);
  const items = await requestService.feedForProvider(id, role, {
    lng: Number(req.query.lng),
    lat: Number(req.query.lat),
    radius: req.query.radius ? Number(req.query.radius) : undefined,
    vehicleType: req.query.vehicleType as VehicleType | undefined,
  });
  ApiResponse.ok(res, items, `${items.length} requests nearby`);
});
