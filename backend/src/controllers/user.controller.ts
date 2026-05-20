import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const uid = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(uid(req), req.body);
  ApiResponse.ok(res, user, 'Profile updated');
});

export const updateMyLocation = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateLocation(uid(req), req.body.location);
  ApiResponse.ok(res, user, 'Location updated');
});

export const updateMyAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');
  const user = await userService.updateAvatar(uid(req), {
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
  });
  ApiResponse.ok(res, user, 'Avatar updated');
});

export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getPublicProfile(req.params.id);
  ApiResponse.ok(res, user);
});

/** Register this device's FCM token so the user receives push notifications. */
export const registerDevice = asyncHandler(async (req: Request, res: Response) => {
  await userRepository.addFcmToken(uid(req), req.body.token);
  ApiResponse.ok(res, null, 'Device registered');
});

export const unregisterDevice = asyncHandler(async (req: Request, res: Response) => {
  await userRepository.removeFcmToken(uid(req), req.params.token);
  ApiResponse.ok(res, null, 'Device removed');
});
