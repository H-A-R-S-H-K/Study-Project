import type { Request, Response } from 'express';
import { adminAuthService } from '../services/admin-auth.service.js';
import { adminService } from '../services/admin.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';
import type { UserStatus, VerificationStatus } from '../types/enums.js';

const adminId = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminAuthService.login(req.body.email, req.body.password, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  ApiResponse.ok(res, result, 'Logged in');
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.ok(res, await adminService.stats());
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await adminService.listUsers(
    {
      search: req.query.search as string | undefined,
      role: req.query.role as string | undefined,
      status: req.query.status as string | undefined,
    },
    parsePagination(req.query),
  );
  ApiResponse.ok(res, items, 'OK', meta);
});

export const setUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.setUserStatus(req.params.id, req.body.status as UserStatus);
  ApiResponse.ok(res, user, 'User updated');
});

export const documentQueue = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await adminService.documentQueue(
    req.query.status as string | undefined,
    parsePagination(req.query),
  );
  ApiResponse.ok(res, items, 'OK', meta);
});

export const verifyDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await adminService.verifyDocument(
    req.params.id,
    adminId(req),
    req.body.status as VerificationStatus,
    req.body.reason,
  );
  ApiResponse.ok(res, doc, 'Document reviewed');
});

export const listVehicles = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await adminService.listVehicles(parsePagination(req.query));
  ApiResponse.ok(res, items, 'OK', meta);
});

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await adminService.listRequests(
    req.query.status as string | undefined,
    parsePagination(req.query),
  );
  ApiResponse.ok(res, items, 'OK', meta);
});
