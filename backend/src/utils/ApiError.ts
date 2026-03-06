import { StatusCodes } from 'http-status-codes';

/**
 * Application-level error carrying an HTTP status. Thrown from services/controllers
 * and translated to a JSON response by the central error middleware.
 * `isOperational` distinguishes expected errors (bad input, not found) from
 * programmer bugs — only the latter should page an on-call engineer.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(StatusCodes.BAD_REQUEST, message, details);
  }
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }
  static conflict(message = 'Conflict', details?: unknown): ApiError {
    return new ApiError(StatusCodes.CONFLICT, message, details);
  }
  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(StatusCodes.TOO_MANY_REQUESTS, message);
  }
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, undefined, false);
  }
}
