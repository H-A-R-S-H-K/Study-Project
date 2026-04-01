import type { Request, Response } from 'express';
import { driverService } from '../services/driver.service.js';
import { documentService } from '../services/document.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const uid = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const getMyDriverProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await driverService.getMine(uid(req));
  ApiResponse.ok(res, profile, profile ? 'OK' : 'No driver profile yet');
});

export const upsertMyDriverProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await driverService.upsertMine(uid(req), req.body);
  ApiResponse.ok(res, profile, 'Driver profile saved');
});

export const setDriverAvailability = asyncHandler(async (req: Request, res: Response) => {
  const profile = await driverService.setAvailability(uid(req), req.body.isAvailable);
  ApiResponse.ok(res, profile, 'Availability updated');
});

export const updateDriverLocation = asyncHandler(async (req: Request, res: Response) => {
  const profile = await driverService.updateLocation(uid(req), req.body.location);
  ApiResponse.ok(res, profile, 'Location updated');
});

export const uploadLicense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No document uploaded');
  const profile = await driverService.uploadLicense(
    uid(req),
    { buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype },
    req.body.licenseNumber,
  );
  ApiResponse.ok(res, profile, 'License uploaded');
});

export const listMyDocuments = asyncHandler(async (req: Request, res: Response) => {
  const docs = await documentService.listMine(uid(req));
  ApiResponse.ok(res, docs);
});
