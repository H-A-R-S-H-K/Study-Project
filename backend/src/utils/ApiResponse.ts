import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Uniform success envelope so every endpoint returns the same shape:
 * `{ success, message, data, meta? }`. The mobile client can rely on this
 * invariant instead of special-casing each route.
 */
export const ApiResponse = {
  ok<T>(res: Response, data: T, message = 'OK', meta?: PaginationMeta): Response {
    return res.status(StatusCodes.OK).json({ success: true, message, data, ...(meta && { meta }) });
  },
  created<T>(res: Response, data: T, message = 'Created'): Response {
    return res.status(StatusCodes.CREATED).json({ success: true, message, data });
  },
  noContent(res: Response): Response {
    return res.status(StatusCodes.NO_CONTENT).send();
  },
};
