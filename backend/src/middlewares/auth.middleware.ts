import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { UserStatus, type UserRole } from '../types/enums.js';

/**
 * Verifies the Bearer access token, confirms the account is still active, and
 * attaches `{ id, role }` to `req.user`. Any protected route depends on this.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }
    const payload = verifyAccessToken(header.slice(7));

    // A token can outlive a suspension; re-check status on every request.
    const user = await userRepository.findById(payload.sub, { status: 1, role: 1 });
    if (!user) throw ApiError.unauthorized('Account not found');
    if (user.status !== UserStatus.ACTIVE) {
      throw ApiError.forbidden('Account is not active');
    }

    req.user = { id: payload.sub, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Route guard factory: allow only the listed roles. Use after `authenticate`.
 *   router.get('/admin/x', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    next();
  };
}
