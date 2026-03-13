import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { signAccessToken } from '../utils/jwt.js';
import { randomToken, sha256 } from '../utils/crypto.js';
import { durationToMs } from '../utils/duration.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import type { IUser } from '../models/index.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface SessionContext {
  userAgent?: string;
  ip?: string;
}

/**
 * Owns the token lifecycle: issue, rotate, revoke.
 *
 * - Access token: stateless JWT, short-lived.
 * - Refresh token: opaque random string; only its SHA-256 hash is persisted.
 *   On refresh we ROTATE (issue a new one, revoke the old). If a token that has
 *   already been rotated is presented again, that signals theft — we revoke the
 *   whole family for the user.
 */
class TokenService {
  async issuePair(user: IUser, ctx: SessionContext = {}): Promise<TokenPair> {
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = randomToken();

    await refreshTokenRepository.create({
      user: user._id,
      tokenHash: sha256(refreshToken),
      userAgent: ctx.userAgent,
      ip: ctx.ip,
      expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
    });

    return { accessToken, refreshToken };
  }

  async rotate(rawRefreshToken: string, user: IUser, ctx: SessionContext = {}): Promise<TokenPair> {
    const presentedHash = sha256(rawRefreshToken);
    const stored = await refreshTokenRepository.findByHash(presentedHash);

    if (!stored) throw ApiError.unauthorized('Invalid refresh token');

    // Reuse of an already-rotated/revoked token → likely theft. Nuke the family.
    if (stored.revokedAt) {
      logger.warn({ user: user._id }, 'Refresh token reuse detected — revoking all sessions');
      await refreshTokenRepository.revokeAllForUser(user._id.toString());
      throw ApiError.unauthorized('Refresh token no longer valid');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw ApiError.unauthorized('Refresh token expired');
    }

    const next = await this.issuePair(user, ctx);
    await refreshTokenRepository.revoke(presentedHash, sha256(next.refreshToken));
    return next;
  }

  async revoke(rawRefreshToken: string): Promise<void> {
    await refreshTokenRepository.revoke(sha256(rawRefreshToken));
  }

  async revokeAll(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
  }
}

export const tokenService = new TokenService();
