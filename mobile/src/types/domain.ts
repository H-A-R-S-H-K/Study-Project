/**
 * Client-side mirror of the backend domain enums and DTO shapes. Kept in sync
 * with `backend/src/types/enums.ts`. In a later phase these can be generated
 * from the OpenAPI spec to guarantee they never drift.
 */

export type UserRole = 'customer' | 'vehicle_owner' | 'driver' | 'admin';

export type VehicleType =
  | 'bike'
  | 'auto'
  | 'car'
  | 'suv'
  | 'van'
  | 'mini_truck'
  | 'pickup'
  | 'tractor'
  | 'tempo'
  | 'bus';

export type ServiceType = 'vehicle_only' | 'driver_only' | 'vehicle_and_driver';

export type RequestStatus =
  | 'open'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Place {
  address: string;
  location: GeoPoint;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  ratingSummary: { average: number; count: number };
}

export interface Vehicle {
  id: string;
  owner: string;
  type: VehicleType;
  title: string;
  make?: string;
  modelName?: string;
  year?: number;
  color?: string;
  registrationNumber: string;
  capacity?: number;
  images: string[];
  verifiedRegistration: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  user: string;
  licenseNumber: string;
  licenseVerified: boolean;
  experienceYears: number;
  vehicleCategories: VehicleType[];
  bio?: string;
  isAvailable: boolean;
  createdAt: string;
}

export const VEHICLE_TYPES: VehicleType[] = [
  'bike',
  'auto',
  'car',
  'suv',
  'van',
  'mini_truck',
  'pickup',
  'tractor',
  'tempo',
  'bus',
];

/** Standard API envelope every request returns. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
