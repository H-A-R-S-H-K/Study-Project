import type { NextFunction, Request, Response, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * Express error middleware instead of crashing the process. Lets controllers
 * be written as clean `async` functions with no try/catch boilerplate.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
