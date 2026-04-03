import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { driverRepository } from '../repositories/driver.repository.js';
import {
  toNearbyVehicleDto,
  toNearbyDriverDto,
  type NearbyVehicleDto,
  type NearbyDriverDto,
} from '../dtos/discovery.dto.js';
import { env } from '../config/env.js';
import type { GeoPoint } from '../repositories/geo.types.js';

export interface NearbyQuery {
  lng: number;
  lat: number;
  radius?: number;
  type?: string; // vehicle type (vehicles) or drivable category (drivers)
  limit?: number;
}

const MAX_RESULTS = 100;

/**
 * Read-only geo discovery. Turns a coordinate + radius into "who's available
 * near me", backed entirely by 2dsphere indexes. No pricing, no fare, no ETA
 * computation — just proximity and provider info for the map.
 */
class DiscoveryService {
  private point(q: NearbyQuery): GeoPoint {
    return { type: 'Point', coordinates: [q.lng, q.lat] };
  }

  private radius(q: NearbyQuery): number {
    return Math.min(q.radius ?? env.DEFAULT_NEARBY_RADIUS_METERS, 100_000);
  }

  private limit(q: NearbyQuery): number {
    return Math.min(q.limit ?? 50, MAX_RESULTS);
  }

  async nearbyVehicles(q: NearbyQuery): Promise<NearbyVehicleDto[]> {
    const rows = await vehicleRepository.findNearbyAvailable(
      this.point(q),
      this.radius(q),
      q.type,
      this.limit(q),
    );
    return rows.map(toNearbyVehicleDto);
  }

  async nearbyDrivers(q: NearbyQuery): Promise<NearbyDriverDto[]> {
    const rows = await driverRepository.findNearbyAvailable(
      this.point(q),
      this.radius(q),
      q.type,
      this.limit(q),
    );
    return rows.map(toNearbyDriverDto);
  }

  /** Combined feed (vehicles + drivers), merged and sorted by distance. */
  async nearbyProviders(
    q: NearbyQuery,
  ): Promise<(NearbyVehicleDto | NearbyDriverDto)[]> {
    const [vehicles, drivers] = await Promise.all([
      this.nearbyVehicles(q),
      this.nearbyDrivers(q),
    ]);
    return [...vehicles, ...drivers].sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}

export const discoveryService = new DiscoveryService();
