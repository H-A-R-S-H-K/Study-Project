import { Schema, model, type Document, type Types } from 'mongoose';
import {
  RequestStatus,
  ServiceType,
  VehicleType,
  values,
} from '../types/enums.js';
import { PlaceSchema, type Place } from './geo.schema.js';

/**
 * A transport request posted by a customer. This is the demand side of the
 * marketplace. Providers query OPEN requests near them (2dsphere on pickup) and
 * respond with Offers. When one offer is accepted the request moves to MATCHED
 * and `acceptedOffer`/`selectedProvider` are set.
 *
 * NOTE: there is intentionally NO price field here and NO fare estimate — price
 * only ever exists on an Offer, entered manually by a provider.
 */
export interface IRequest extends Document {
  _id: Types.ObjectId;
  customer: Types.ObjectId; // ref User
  pickup: Place;
  destination: Place;
  vehicleType?: VehicleType; // optional for DRIVER_ONLY
  serviceType: ServiceType;
  scheduledAt: Date; // when the customer needs it
  description?: string;
  status: RequestStatus;

  offersCount: number; // denormalised counter for list screens

  acceptedOffer?: Types.ObjectId; // ref Offer
  selectedProvider?: Types.ObjectId; // ref User
  chat?: Types.ObjectId; // ref Chat, created on acceptance

  cancelledBy?: Types.ObjectId; // ref User
  cancelReason?: string;
  completedAt?: Date;
  expiresAt?: Date; // auto-expire stale open requests

  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pickup: { type: PlaceSchema, required: true },
    destination: { type: PlaceSchema, required: true },
    vehicleType: { type: String, enum: values(VehicleType) },
    serviceType: { type: String, enum: values(ServiceType), required: true },
    scheduledAt: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: values(RequestStatus),
      default: RequestStatus.OPEN,
      index: true,
    },

    offersCount: { type: Number, default: 0, min: 0 },

    acceptedOffer: { type: Schema.Types.ObjectId, ref: 'Offer' },
    selectedProvider: { type: Schema.Types.ObjectId, ref: 'User' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },

    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    completedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// Providers browse OPEN requests near a pickup point.
RequestSchema.index({ 'pickup.location': '2dsphere' });
// Feed / filter: open requests of a vehicle type, newest first.
RequestSchema.index({ status: 1, vehicleType: 1, scheduledAt: 1 });
// A customer's own request history.
RequestSchema.index({ customer: 1, status: 1, createdAt: -1 });
// TTL-style cleanup handled by a job; index supports the expiry sweep.
RequestSchema.index({ expiresAt: 1 }, { sparse: true });

export const Request = model<IRequest>('Request', RequestSchema);
