import type { Request, Response } from 'express';
import { vehicleService } from '../services/vehicle.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';
import type { UploadedFile } from '../services/storage.service.js';

const ownerId = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

/** Normalise a multer file into the storage service's minimal shape. */
const toUploaded = (f: Express.Multer.File): UploadedFile => ({
  buffer: f.buffer,
  originalname: f.originalname,
  mimetype: f.mimetype,
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.create(ownerId(req), req.body);
  ApiResponse.created(res, vehicle, 'Vehicle added');
});

export const listMyVehicles = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await vehicleService.listMine(ownerId(req), parsePagination(req.query));
  ApiResponse.ok(res, items, 'OK', meta);
});

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getOwned(ownerId(req), req.params.id);
  ApiResponse.ok(res, vehicle);
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.update(ownerId(req), req.params.id, req.body);
  ApiResponse.ok(res, vehicle, 'Vehicle updated');
});

export const setVehicleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.setAvailability(
    ownerId(req),
    req.params.id,
    req.body.isAvailable,
  );
  ApiResponse.ok(res, vehicle, 'Availability updated');
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  await vehicleService.remove(ownerId(req), req.params.id);
  ApiResponse.ok(res, null, 'Vehicle removed');
});

export const uploadVehicleImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest('No images uploaded');
  const vehicle = await vehicleService.addImages(
    ownerId(req),
    req.params.id,
    files.map(toUploaded),
  );
  ApiResponse.ok(res, vehicle, 'Images uploaded');
});

export const uploadVehicleRegistration = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No document uploaded');
  const vehicle = await vehicleService.uploadRegistration(
    ownerId(req),
    req.params.id,
    toUploaded(req.file),
    req.body.number,
  );
  ApiResponse.ok(res, vehicle, 'Registration document uploaded');
});
