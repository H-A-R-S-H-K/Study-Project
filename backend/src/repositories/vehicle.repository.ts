import { Vehicle, type IVehicle } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import type { GeoPoint, NearbyProviderUser } from './geo.types.js';

export interface NearbyVehicleRow {
  _id: unknown;
  type: string;
  title: string;
  images: string[];
  registrationNumber: string;
  capacity?: number;
  verifiedRegistration: boolean;
  location?: GeoPoint;
  distanceMeters: number;
  ownerUser: NearbyProviderUser;
}

class VehicleRepository extends BaseRepository<IVehicle> {
  constructor() {
    super(Vehicle);
  }

  /**
   * Available vehicles within `radiusMeters` of a point, nearest first, joined
   * to their owner. Uses a $geoNear aggregation (backed by the 2dsphere index)
   * so distance is computed by MongoDB — `distanceMeters` is for DISPLAY ONLY
   * and never feeds any pricing logic (there is none).
   */
  async findNearbyAvailable(
    point: GeoPoint,
    radiusMeters: number,
    type: string | undefined,
    limit: number,
  ): Promise<NearbyVehicleRow[]> {
    const match: Record<string, unknown> = { isAvailable: true, isActive: true };
    if (type) match.type = type;

    return this.model.aggregate<NearbyVehicleRow>([
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
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerUser',
        },
      },
      { $unwind: '$ownerUser' },
      { $match: { 'ownerUser.status': 'active' } },
      {
        $project: {
          type: 1,
          title: 1,
          images: 1,
          registrationNumber: 1,
          capacity: 1,
          verifiedRegistration: 1,
          location: 1,
          distanceMeters: 1,
          'ownerUser._id': 1,
          'ownerUser.name': 1,
          'ownerUser.avatarUrl': 1,
          'ownerUser.phone': 1,
          'ownerUser.ratingSummary': 1,
        },
      },
    ]);
  }

  /** A single active vehicle scoped to its owner (ownership-safe fetch). */
  findOwnedById(id: string, ownerId: string): Promise<IVehicle | null> {
    return this.findOne({ _id: id, owner: ownerId, isActive: true });
  }

  listByOwner(
    ownerId: string,
    opts: { skip: number; limit: number; sort: Record<string, 1 | -1> },
  ): Promise<{ items: IVehicle[]; total: number }> {
    return this.paginate({ owner: ownerId, isActive: true }, opts);
  }

  pushImages(id: string, urls: string[]): Promise<IVehicle | null> {
    return this.model
      .findByIdAndUpdate(id, { $push: { images: { $each: urls } } }, { new: true })
      .exec();
  }
}

export const vehicleRepository = new VehicleRepository();
