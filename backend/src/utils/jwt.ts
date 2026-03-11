import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';
import type {
  AccessTokenPayload,
  RegistrationTokenPayload,
} from '../types/jwt.js';

/**
 * JWT helpers. Access tokens are signed with the access secret and are
 * short-lived; the long-lived credential is an opaque *refresh token* (not a
 * JWT) tracked in the database — see TokenService. Registration tokens reuse the
 * access secret but carry `type: 'registration'` so they can never be used as
 * access tokens.
 */

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') throw ApiError.unauthorized('Invalid token type');
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

export function signRegistrationToken(phone: string): string {
  const payload: RegistrationTokenPayload = { phone, type: 'registration' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function verifyRegistrationToken(token: string): RegistrationTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as RegistrationTokenPayload;
    if (decoded.type !== 'registration') throw ApiError.unauthorized('Invalid token type');
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Invalid or expired registration token');
  }
}
