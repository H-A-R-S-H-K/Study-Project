import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { UserRole } from '../types/enums.js';

/** HTTP-only glue: read the request, call one service method, send a response. */

function sessionContext(req: Request): { userAgent?: string; ip?: string } {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

export const requestOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.requestOtp(req.body.phone);
  ApiResponse.ok(res, result, 'OTP sent');
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(
    req.body.phone,
    req.body.code,
    sessionContext(req),
  );
  ApiResponse.ok(res, result, result.isNewUser ? 'Phone verified — complete signup' : 'Logged in');
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(
    {
      registrationToken: req.body.registrationToken,
      name: req.body.name,
      role: req.body.role as UserRole,
      email: req.body.email,
      homeAddress: req.body.homeAddress,
      location: req.body.location,
    },
    sessionContext(req),
  );
  ApiResponse.created(res, result, 'Account created');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refresh(req.body.refreshToken, sessionContext(req));
  ApiResponse.ok(res, tokens, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  ApiResponse.ok(res, null, 'Logged out');
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await authService.logoutAll(req.user.id);
  ApiResponse.ok(res, null, 'Logged out of all devices');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.me(req.user.id);
  ApiResponse.ok(res, user, 'OK');
});
