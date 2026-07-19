import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, VehicleType } from '../../types/domain';

interface ProviderSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  phone: string;
  rating: { average: number; count: number };
}

export interface NearbyVehicle {
  kind: 'vehicle';
  id: string;
  type: VehicleType;
  title: string;
  images: string[];
  capacity?: number;
  verifiedRegistration: boolean;
  location?: { type: 'Point'; coordinates: [number, number] };
  distanceMeters: number;
  provider: ProviderSummary;
}

export interface NearbyDriver {
  kind: 'driver';
  id: string;
  experienceYears: number;
  vehicleCategories: VehicleType[];
  licenseVerified: boolean;
  bio?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  distanceMeters: number;
  provider: ProviderSummary;
}

export type NearbyProvider = NearbyVehicle | NearbyDriver;

export interface NearbyParams {
  lng: number;
  lat: number;
  radius?: number;
  type?: VehicleType;
}

// Built with plain strings (not URLSearchParams — Hermes doesn't reliably
// support it, which would throw before the request is ever sent).
const query = (p: NearbyParams): string => {
  const parts = [`lng=${p.lng}`, `lat=${p.lat}`];
  if (p.radius) parts.push(`radius=${p.radius}`);
  if (p.type) parts.push(`type=${p.type}`);
  return parts.join('&');
};

export const discoveryApi = {
  async nearbyProviders(p: NearbyParams): Promise<NearbyProvider[]> {
    const { data } = await apiClient.get<ApiEnvelope<NearbyProvider[]>>(
      `/discovery/providers/nearby?${query(p)}`,
    );
    return data.data;
  },
  async nearbyVehicles(p: NearbyParams): Promise<NearbyVehicle[]> {
    const { data } = await apiClient.get<ApiEnvelope<NearbyVehicle[]>>(
      `/discovery/vehicles/nearby?${query(p)}`,
    );
    return data.data;
  },
};
