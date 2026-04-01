import { Driver, type IDriver } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import type { GeoPoint, NearbyProviderUser } from './geo.types.js';

export interface NearbyDriverRow {
  _id: unknown;
  licenseNumber: string;
  experienceYears: number;
  vehicleCategories: string[];
  licenseVerified: boolean;
  bio?: string;
  location?: GeoPoint;
  distanceMeters: number;
  driverUser: NearbyProviderUser;
}

class DriverRepository extends BaseRepository<IDriver> {
  constructor() {
    super(Driver);
  }

  /**
   * Available drivers within `radiusMeters` of a point, nearest first, joined to
   * their user. `category` (optional) filters to drivers who can operate that
   * vehicle type. Distance comes from MongoDB's $geoNear — display only.
   */
  async findNearbyAvailable(
    point: GeoPoint,
    radiusMeters: number,
    category: string | undefined,
    limit: number,
  ): Promise<NearbyDriverRow[]> {
    const match: Record<string, unknown> = { isAvailable: true };
    if (category) match.vehicleCategories = category;

    return this.model.aggregate<NearbyDriverRow>([
      {
        $geoNear: {
          near: point,
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: match,
        },
      },
      { $limit: limit },
      {
        $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'driverUser' },
      },
      { $unwind: '$driverUser' },
      { $match: { 'driverUser.status': 'active' } },
      {
        $project: {
          licenseNumber: 1,
          experienceYears: 1,
          vehicleCategories: 1,
          licenseVerified: 1,
          bio: 1,
          location: 1,
          distanceMeters: 1,
          'driverUser._id': 1,
          'driverUser.name': 1,
          'driverUser.avatarUrl': 1,
          'driverUser.phone': 1,
          'driverUser.ratingSummary': 1,
        },
      },
    ]);
  }

  findByUser(userId: string): Promise<IDriver | null> {
    return this.findOne({ user: userId });
  }

  /** Create the profile if absent, otherwise update it (used by PUT /drivers/me). */
  upsertByUser(userId: string, data: Partial<IDriver>): Promise<IDriver | null> {
    return this.model
      .findOneAndUpdate(
        { user: userId },
        { $set: data, $setOnInsert: { user: userId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}

export const driverRepository = new DriverRepository();
