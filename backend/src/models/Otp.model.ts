import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * A one-time passcode issued for a phone number. Only the SHA-256 hash of the
 * code is stored, so a DB leak cannot reveal live codes. A TTL index deletes the
 * document at `expiresAt`; `attempts` caps brute-force verification. This is an
 * infrastructure collection added in Phase 2 (auth) beyond the core domain set.
 */
export interface IOtp extends Document {
  _id: Types.ObjectId;
  phone: string;
  codeHash: string;
  attempts: number;
  consumed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL cleanup exactly when the code expires.
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Fetch the latest live code for a phone.
OtpSchema.index({ phone: 1, createdAt: -1 });

export const Otp = model<IOtp>('Otp', OtpSchema);
