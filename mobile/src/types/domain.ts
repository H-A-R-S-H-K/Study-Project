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

export interface TransportRequest {
  id: string;
  customer: string;
  pickup: Place;
  destination: Place;
  vehicleType?: VehicleType;
  serviceType: ServiceType;
  scheduledAt: string;
  description?: string;
  status: RequestStatus;
  offersCount: number;
  acceptedOffer?: string;
  selectedProvider?: string;
  chat?: string;
  cancelReason?: string;
  createdAt: string;
}

export interface FeedRequest {
  id: string;
  pickup: Place;
  destination: Place;
  vehicleType?: VehicleType;
  serviceType: ServiceType;
  scheduledAt: string;
  description?: string;
  offersCount: number;
  distanceMeters: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: { average: number; count: number };
  };
}

export interface Offer {
  id: string;
  request: string;
  provider: string;
  providerType: 'vehicle_owner' | 'driver';
  vehicle?: string;
  price: number;
  currency: string;
  message?: string;
  status: OfferStatus;
  createdAt: string;
}

export interface OfferDetail {
  id: string;
  request: string;
  price: number;
  currency: string;
  message?: string;
  status: OfferStatus;
  providerType: 'vehicle_owner' | 'driver';
  createdAt: string;
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
    type: VehicleType;
    images: string[];
    verifiedRegistration: boolean;
  };
}

export type NotificationType =
  | 'new_nearby_request'
  | 'new_offer'
  | 'offer_accepted'
  | 'new_message'
  | 'booking_cancelled'
  | 'ride_completed'
  | 'document_verified';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'location' | 'system';

export interface ChatMessage {
  id: string;
  chat: string;
  sender: string;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  location?: GeoPoint;
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  request: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSender?: string;
  unread: number;
  other: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone: string;
    rating: { average: number; count: number };
  };
}

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  vehicle_only: 'Vehicle only',
  driver_only: 'Driver only',
  vehicle_and_driver: 'Vehicle + Driver',
};

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
