import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/** Reached only when no route matched — hand a 404 to the error middleware. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
