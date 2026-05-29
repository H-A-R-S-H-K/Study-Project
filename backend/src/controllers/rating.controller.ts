import type { Request, Response } from 'express';
import { ratingService } from '../services/rating.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';

const uid = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const rate = asyncHandler(async (req: Request, res: Response) => {
  const rating = await ratingService.rate(uid(req), req.params.requestId, req.body);
  ApiResponse.created(res, rating, 'Thanks for your rating');
});

export const ratingStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await ratingService.status(uid(req), req.params.requestId);
  ApiResponse.ok(res, status);
});

export const listReceived = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await ratingService.listReceived(
    req.params.id,
    parsePagination(req.query),
  );
  ApiResponse.ok(res, items, 'OK', meta);
});
