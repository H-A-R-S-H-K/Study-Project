import { Schema, model, type Document, type Types } from 'mongoose';
import { VehicleType, values } from '../types/enums.js';
import { PointSchema, type GeoPoint } from './geo.schema.js';

/**
 * Driver-specific profile for a User whose role is `driver`. Drivers do not own
 * vehicles; they offer driving skills. `vehicleCategories` lists the vehicle
 * types they are competent to drive, so a "driver only" request for a tractor
 * only reaches drivers who can drive tractors.
 *
 * One-to-one with User (unique `user`), kept separate so the User collection
 * stays lean and role data can grow independently.
 */
export interface IDriver extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId; // ref User (role = driver)
  licenseNumber: string;
  licenseDocument?: Types.ObjectId; // ref Document
  licenseVerified: boolean;
  experienceYears: number;
  vehicleCategories: VehicleType[]; // types this driver can operate
  bio?: string;
  isAvailable: boolean;
  location?: GeoPoint;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    licenseNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    licenseDocument: { type: Schema.Types.ObjectId, ref: 'Document' },
    licenseVerified: { type: Boolean, default: false },
    experienceYears: { type: Number, default: 0, min: 0, max: 80 },
    vehicleCategories: {
      type: [String],
      enum: values(VehicleType),
      default: [],
      index: true,
    },
    bio: { type: String, trim: true, maxlength: 500 },
    isAvailable: { type: Boolean, default: true, index: true },
    location: { type: PointSchema },
  },
  { timestamps: true },
);

DriverSchema.index({ location: '2dsphere' });
// Feed query: available drivers who can drive a given vehicle category near a point.
DriverSchema.index({ vehicleCategories: 1, isAvailable: 1 });

export const Driver = model<IDriver>('Driver', DriverSchema);
