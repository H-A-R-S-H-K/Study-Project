import { Schema, model, type Document, type Types } from 'mongoose';
import { UserRole, UserStatus, values } from '../types/enums.js';
import { PointSchema, type GeoPoint } from './geo.schema.js';

/**
 * The single identity collection for every human on the platform. Role-specific
 * data lives in dedicated collections (Vehicle, Driver) referenced back to a
 * User — this keeps the user document small and queries role-agnostic.
 *
 * `ratingSummary` is a denormalised aggregate (avg + count) kept in sync when a
 * Rating is written, so listing screens never have to aggregate on read.
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string; // E.164, unique — primary login identifier
  countryCode: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;

  /** Only set for accounts that use email+password login (admins). */
  passwordHash?: string;

  /** Last known location — powers "nearby" queries for providers. */
  location?: GeoPoint;
  homeAddress?: string;

  /** Device push tokens (FCM). A user may have several devices. */
  fcmTokens: string[];

  ratingSummary: { average: number; count: number };

  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'],
    },
    countryCode: { type: String, default: '+91', trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
    avatarUrl: { type: String, trim: true },
    role: { type: String, enum: values(UserRole), required: true, index: true },
    status: {
      type: String,
      enum: values(UserStatus),
      default: UserStatus.ACTIVE,
      index: true,
    },
    isPhoneVerified: { type: Boolean, default: false },
    passwordHash: { type: String, select: false }, // never returned by default

    location: { type: PointSchema },
    homeAddress: { type: String, trim: true, maxlength: 300 },

    fcmTokens: { type: [String], default: [] },

    ratingSummary: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    lastActiveAt: { type: Date },
  },
  { timestamps: true },
);

// Geo index for "providers near me".
UserSchema.index({ location: '2dsphere' });
// Common admin/list filters.
UserSchema.index({ role: 1, status: 1, createdAt: -1 });

export const User = model<IUser>('User', UserSchema);
