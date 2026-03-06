/**
 * Central domain enums shared across models, validators, services and sockets.
 * Kept as `const` objects (not TS `enum`) so the runtime values are plain strings —
 * easy to store in Mongo, validate with Zod, and send over the wire.
 */

export const UserRole = {
  CUSTOMER: 'customer',
  VEHICLE_OWNER: 'vehicle_owner',
  DRIVER: 'driver',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const VehicleType = {
  BIKE: 'bike',
  AUTO: 'auto',
  CAR: 'car',
  SUV: 'suv',
  VAN: 'van',
  MINI_TRUCK: 'mini_truck',
  PICKUP: 'pickup',
  TRACTOR: 'tractor',
  TEMPO: 'tempo',
  BUS: 'bus',
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

/** What the customer is asking for. Drives which provider types may offer. */
export const ServiceType = {
  VEHICLE_ONLY: 'vehicle_only',
  DRIVER_ONLY: 'driver_only',
  VEHICLE_AND_DRIVER: 'vehicle_and_driver',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const RequestStatus = {
  OPEN: 'open', // accepting offers
  MATCHED: 'matched', // an offer was accepted
  IN_PROGRESS: 'in_progress', // job started
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const OfferStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

/** Who authored an offer — determines whether a vehicle ref is required. */
export const ProviderType = {
  VEHICLE_OWNER: 'vehicle_owner',
  DRIVER: 'driver',
} as const;
export type ProviderType = (typeof ProviderType)[keyof typeof ProviderType];

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  LOCATION: 'location',
  SYSTEM: 'system',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const DocumentType = {
  DRIVING_LICENSE: 'driving_license',
  VEHICLE_REGISTRATION: 'vehicle_registration',
  IDENTITY: 'identity',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const VerificationStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;
export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const NotificationType = {
  NEW_NEARBY_REQUEST: 'new_nearby_request',
  NEW_OFFER: 'new_offer',
  OFFER_ACCEPTED: 'offer_accepted',
  NEW_MESSAGE: 'new_message',
  BOOKING_CANCELLED: 'booking_cancelled',
  RIDE_COMPLETED: 'ride_completed',
  DOCUMENT_VERIFIED: 'document_verified',
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const RatingDirection = {
  CUSTOMER_TO_PROVIDER: 'customer_to_provider',
  PROVIDER_TO_CUSTOMER: 'provider_to_customer',
} as const;
export type RatingDirection = (typeof RatingDirection)[keyof typeof RatingDirection];

/** Helper to extract the string-union value list for schema `enum` + Zod. */
export const values = <T extends Record<string, string>>(obj: T): T[keyof T][] =>
  Object.values(obj) as T[keyof T][];
