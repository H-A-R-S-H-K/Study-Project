import type { AuthenticatedUser } from './jwt.js';

/**
 * Augment Express' Request with the authenticated principal set by the auth
 * middleware, so `req.user` is fully typed in every downstream handler.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
