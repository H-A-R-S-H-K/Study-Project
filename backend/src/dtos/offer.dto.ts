import type { IOffer } from '../models/index.js';
import type { OfferRow } from '../repositories/offer.repository.js';
import type { OfferStatus, ProviderType } from '../types/enums.js';

export interface OfferDto {
  id: string;
  request: string;
  provider: string;
  providerType: ProviderType;
  vehicle?: string;
  price: number;
  currency: string;
  message?: string;
  status: OfferStatus;
  createdAt: Date;
}

export function toOfferDto(o: IOffer): OfferDto {
  return {
    id: o._id.toString(),
    request: o.request.toString(),
    provider: o.provider.toString(),
    providerType: o.providerType,
    vehicle: o.vehicle?.toString(),
    price: o.price,
    currency: o.currency,
    message: o.message,
    status: o.status,
    createdAt: o.createdAt,
  };
}

/** Offer enriched with provider + vehicle for the customer's offer inbox. */
export interface OfferDetailDto {
  id: string;
  request: string;
  price: number;
  currency: string;
  message?: string;
  status: string;
  providerType: string;
  createdAt: Date;
  provider: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone: string;
    rating: { average: number; count: number };
  };
  vehicle?: {
    id: string;
    title: string;
    type: string;
    images: string[];
    verifiedRegistration: boolean;
  };
}

export function toOfferDetailDto(row: OfferRow): OfferDetailDto {
  return {
    id: String(row._id),
    request: String(row.request),
    price: row.price,
    currency: row.currency,
    message: row.message,
    status: row.status,
    providerType: row.providerType,
    createdAt: row.createdAt,
    provider: {
      id: row.provider._id.toString(),
      name: row.provider.name,
      avatarUrl: row.provider.avatarUrl,
      phone: row.provider.phone,
      rating: row.provider.ratingSummary,
    },
    vehicle: row.vehicle
      ? {
          id: String(row.vehicle._id),
          title: row.vehicle.title,
          type: row.vehicle.type,
          images: row.vehicle.images,
          verifiedRegistration: row.vehicle.verifiedRegistration,
        }
      : undefined,
  };
}
