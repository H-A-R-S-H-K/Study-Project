import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { isProd } from '../config/env.js';

/**
 * Central error translator. Every thrown error — ApiError, Zod, Mongoose,
 * or unexpected — funnels here and becomes a consistent JSON body:
 * `{ success: false, message, details? }`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    details = err.flatten().fieldErrors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid value for '${err.path}'`;
  } else if (err instanceof MulterError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large (max 5 MB)'
        : `Upload error: ${err.message}`;
  } else if (isDuplicateKeyError(err)) {
    statusCode = StatusCodes.CONFLICT;
    message = 'Duplicate value violates a unique constraint';
    details = err.keyValue;
  }

  // Log server-side faults with full context; client faults stay quiet.
  if (statusCode >= 500) {
    logger.error({ err }, 'Unhandled error');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(isProd || statusCode < 500 ? {} : { stack: (err as Error)?.stack }),
  });
}

interface MongoDuplicateKeyError {
  code: number;
  keyValue: Record<string, unknown>;
}
function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  );
}
