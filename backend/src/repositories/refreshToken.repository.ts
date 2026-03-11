import { RefreshToken, type IRefreshToken } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshToken);
  }

  findByHash(tokenHash: string): Promise<IRefreshToken | null> {
    return this.findOne({ tokenHash });
  }

  /** Mark a token revoked, optionally recording the token that replaced it. */
  revoke(tokenHash: string, replacedByHash?: string): Promise<IRefreshToken | null> {
    return this.model
      .findOneAndUpdate(
        { tokenHash },
        { revokedAt: new Date(), ...(replacedByHash ? { replacedByHash } : {}) },
        { new: true },
      )
      .exec();
  }

  /** Revoke every active session for a user (logout everywhere / theft response). */
  revokeAllForUser(userId: string): Promise<unknown> {
    return this.model
      .updateMany({ user: userId, revokedAt: { $exists: false } }, { revokedAt: new Date() })
      .exec();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
