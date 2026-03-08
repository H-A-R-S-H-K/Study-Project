import { Schema, model, type Document, type Types } from 'mongoose';
import { OfferStatus, ProviderType, values } from '../types/enums.js';

/**
 * A provider's response to a Request. Price is entered manually by the provider —
 * the platform never computes or suggests it. A vehicle owner offering a
 * vehicle must reference which vehicle; a driver need not.
 *
 * A provider may hold at most one active (pending/accepted) offer per request,
 * enforced by a partial unique index.
 */
export interface IOffer extends Document {
  _id: Types.ObjectId;
  request: Types.ObjectId; // ref Request
  provider: Types.ObjectId; // ref User
  providerType: ProviderType;
  vehicle?: Types.ObjectId; // ref Vehicle (required when offering a vehicle)
  price: number; // in the smallest sensible unit (₹), provider-set, >= 0
  currency: string;
  message?: string; // optional note, e.g. "can reach in 20 min"
  status: OfferStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    request: { type: Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    providerType: { type: String, enum: values(ProviderType), required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      max: [10_000_000, 'Price is unrealistically high'],
    },
    currency: { type: String, default: 'INR', trim: true, uppercase: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: values(OfferStatus),
      default: OfferStatus.PENDING,
      index: true,
    },
  },
  { timestamps: true },
);

// List a request's offers, newest first (customer's offer inbox).
OfferSchema.index({ request: 1, status: 1, createdAt: -1 });
// A provider's own sent offers.
OfferSchema.index({ provider: 1, createdAt: -1 });
// One active offer per provider per request (pending or accepted).
OfferSchema.index(
  { request: 1, provider: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [OfferStatus.PENDING, OfferStatus.ACCEPTED] },
    },
  },
);

export const Offer = model<IOffer>('Offer', OfferSchema);
