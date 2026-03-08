import { Schema, model, type Document, type Types } from 'mongoose';
import { VehicleType, values } from '../types/enums.js';
import { PointSchema, type GeoPoint } from './geo.schema.js';

/**
 * A vehicle owned by a Vehicle Owner (User). An owner may have many vehicles.
 * `isAvailable` + `location` decide whether the vehicle surfaces in nearby
 * request feeds. The registration document is verified via the Document
 * collection; `verifiedRegistration` mirrors the outcome for fast filtering.
 */
export interface IVehicle extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId; // ref User (role = vehicle_owner)
  type: VehicleType;
  title: string; // e.g. "Mahindra 575 DI"
  make?: string;
  modelName?: string;
  year?: number;
  color?: string;
  registrationNumber: string;
  capacity?: number; // seats or tonnage, provider-defined
  images: string[]; // Cloudinary URLs
  registrationDocument?: Types.ObjectId; // ref Document
  verifiedRegistration: boolean;
  isAvailable: boolean;
  location?: GeoPoint;
  isActive: boolean; // soft-delete flag
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: values(VehicleType), required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    make: { type: String, trim: true, maxlength: 60 },
    modelName: { type: String, trim: true, maxlength: 60 },
    year: { type: Number, min: 1950, max: 2100 },
    color: { type: String, trim: true, maxlength: 30 },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    capacity: { type: Number, min: 0 },
    images: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= 8, 'At most 8 images'],
    },
    registrationDocument: { type: Schema.Types.ObjectId, ref: 'Document' },
    verifiedRegistration: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true, index: true },
    location: { type: PointSchema },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

VehicleSchema.index({ location: '2dsphere' });
// Feed query: available vehicles of a type near a point.
VehicleSchema.index({ type: 1, isAvailable: 1, isActive: 1 });
// A registration number is unique per owner (same plate can't be added twice).
VehicleSchema.index({ owner: 1, registrationNumber: 1 }, { unique: true });

export const Vehicle = model<IVehicle>('Vehicle', VehicleSchema);
