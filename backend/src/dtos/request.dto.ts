import type { IRequest } from '../models/index.js';
import type { NearbyRequestRow } from '../repositories/request.repository.js';
import type { RequestStatus, ServiceType, VehicleType } from '../types/enums.js';
import type { Place } from '../models/geo.schema.js';

export interface RequestDto {
  id: string;
  customer: string;
  pickup: Place;
  destination: Place;
  vehicleType?: VehicleType;
  serviceType: ServiceType;
  scheduledAt: Date;
  description?: string;
  status: RequestStatus;
  offersCount: number;
  acceptedOffer?: string;
  selectedProvider?: string;
  chat?: string;
  cancelReason?: string;
  completedAt?: Date;
  createdAt: Date;
}

export function toRequestDto(r: IRequest): RequestDto {
  return {
    id: r._id.toString(),
    customer: r.customer.toString(),
    pickup: r.pickup,
    destination: r.destination,
    vehicleType: r.vehicleType,
    serviceType: r.serviceType,
    scheduledAt: r.scheduledAt,
    description: r.description,
    status: r.status,
    offersCount: r.offersCount,
    acceptedOffer: r.acceptedOffer?.toString(),
    selectedProvider: r.selectedProvider?.toString(),
    chat: r.chat?.toString(),
    cancelReason: r.cancelReason,
    completedAt: r.completedAt,
    createdAt: r.createdAt,
  };
}

/** Feed row shown to providers — includes distance and a customer summary. */
export interface FeedRequestDto {
  id: string;
  pickup: Place;
  destination: Place;
  vehicleType?: string;
  serviceType: string;
  scheduledAt: Date;
  description?: string;
  offersCount: number;
  distanceMeters: number;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: { average: number; count: number };
  };
}

export function toFeedRequestDto(row: NearbyRequestRow): FeedRequestDto {
  return {
    id: String(row._id),
    pickup: row.pickup,
    destination: row.destination,
    vehicleType: row.vehicleType,
    serviceType: row.serviceType,
    scheduledAt: row.scheduledAt,
    description: row.description,
    offersCount: row.offersCount,
    distanceMeters: Math.round(row.distanceMeters),
    createdAt: row.createdAt,
    customer: {
      id: row.customerUser._id.toString(),
      name: row.customerUser.name,
      avatarUrl: row.customerUser.avatarUrl,
      rating: row.customerUser.ratingSummary,
    },
  };
}
