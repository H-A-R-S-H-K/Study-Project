import type { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';

const uid = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  const { items, meta } = await notificationService.list(
    uid(req),
    unreadOnly,
    parsePagination(req.query),
  );
  ApiResponse.ok(res, items, 'OK', meta);
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.unreadCount(uid(req));
  ApiResponse.ok(res, { count });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markRead(uid(req), req.params.id);
  ApiResponse.ok(res, null, 'Marked read');
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.markAllRead(uid(req));
  ApiResponse.ok(res, { count }, 'All marked read');
});
