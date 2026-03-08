import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Server-side record of an issued refresh token, enabling rotation and
 * revocation (logout, "log out all devices", theft detection). We store only a
 * SHA-256 HASH of the token — never the raw value — so a DB leak cannot be
 * replayed. A Mongo TTL index deletes expired rows automatically.
 */
export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId; // ref User
  tokenHash: string; // sha256 of the raw token
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByHash?: string; // set when rotated, for reuse detection
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, trim: true },
    ip: { type: String, trim: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByHash: { type: String },
  },
  { timestamps: true },
);

// TTL: purge tokens once expired.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
