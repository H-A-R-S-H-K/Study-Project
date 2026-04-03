import type { NearbyVehicleRow } from '../repositories/vehicle.repository.js';
import type { NearbyDriverRow } from '../repositories/driver.repository.js';
import type { GeoPoint, NearbyProviderUser } from '../repositories/geo.types.js';

interface ProviderSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  phone: string;
  rating: { average: number; count: number };
}

export interface NearbyVehicleDto {
  kind: 'vehicle';
  id: string;
  type: string;
  title: string;
  images: string[];
  capacity?: number;
  verifiedRegistration: boolean;
  location?: GeoPoint;
  distanceMeters: number;
  provider: ProviderSummary;
}

export interface NearbyDriverDto {
  kind: 'driver';
  id: string;
  experienceYears: number;
  vehicleCategories: string[];
  licenseVerified: boolean;
  bio?: string;
  location?: GeoPoint;
  distanceMeters: number;
  provider: ProviderSummary;
}

function toProvider(u: NearbyProviderUser): ProviderSummary {
  return {
    id: u._id.toString(),
    name: u.name,
    avatarUrl: u.avatarUrl,
    phone: u.phone,
    rating: u.ratingSummary,
  };
}

/** Round to whole metres — distance is display-only, no need for sub-metre noise. */
const round = (m: number): number => Math.round(m);

export function toNearbyVehicleDto(row: NearbyVehicleRow): NearbyVehicleDto {
  return {
    kind: 'vehicle',
    id: String(row._id),
    type: row.type,
    title: row.title,
    images: row.images,
    capacity: row.capacity,
    verifiedRegistration: row.verifiedRegistration,
    location: row.location,
    distanceMeters: round(row.distanceMeters),
    provider: toProvider(row.ownerUser),
  };
}

export function toNearbyDriverDto(row: NearbyDriverRow): NearbyDriverDto {
  return {
    kind: 'driver',
    id: String(row._id),
    experienceYears: row.experienceYears,
    vehicleCategories: row.vehicleCategories,
    licenseVerified: row.licenseVerified,
    bio: row.bio,
    location: row.location,
    distanceMeters: round(row.distanceMeters),
    provider: toProvider(row.driverUser),
  };
}
