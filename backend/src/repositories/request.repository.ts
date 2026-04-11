import { Request, type IRequest } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import type { GeoPoint, NearbyProviderUser } from './geo.types.js';

export interface NearbyRequestRow {
  _id: unknown;
  pickup: { address: string; location: GeoPoint };
  destination: { address: string; location: GeoPoint };
  vehicleType?: string;
  serviceType: string;
  scheduledAt: Date;
  description?: string;
  offersCount: number;
  createdAt: Date;
  distanceMeters: number;
  customerUser: NearbyProviderUser;
}

class RequestRepository extends BaseRepository<IRequest> {
  constructor() {
    super(Request);
  }

  /**
   * Open requests whose PICKUP is within `radiusMeters` of the provider, nearest
   * first. `serviceTypes`/`vehicleTypes` narrow the feed to what this provider
   * can actually fulfil (computed by the service from the caller's role). Joined
   * to the customer for display. $geoNear is backed by the pickup 2dsphere index.
   */
  async findNearbyOpen(args: {
    point: GeoPoint;
    radiusMeters: number;
    serviceTypes: string[];
    vehicleTypes?: string[];
    excludeCustomer?: string;
    limit: number;
  }): Promise<NearbyRequestRow[]> {
    const query: Record<string, unknown> = {
      status: 'open',
      serviceType: { $in: args.serviceTypes },
    };
    if (args.vehicleTypes && args.vehicleTypes.length > 0) {
      // Match the requested vehicle type OR requests that left it unspecified.
      query.$or = [
        { vehicleType: { $in: args.vehicleTypes } },
        { vehicleType: { $exists: false } },
        { vehicleType: null },
      ];
    }

    return this.model.aggregate<NearbyRequestRow>([
      {
        $geoNear: {
          near: args.point,
          distanceField: 'distanceMeters',
          maxDistance: args.radiusMeters,
          spherical: true,
          key: 'pickup.location',
          query,
        },
      },
      { $limit: args.limit },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerUser',
        },
      },
      { $unwind: '$customerUser' },
      { $match: { 'customerUser.status': 'active' } },
      {
        $project: {
          pickup: 1,
          destination: 1,
          vehicleType: 1,
          serviceType: 1,
          scheduledAt: 1,
          description: 1,
          offersCount: 1,
          createdAt: 1,
          distanceMeters: 1,
          'customerUser._id': 1,
          'customerUser.name': 1,
          'customerUser.avatarUrl': 1,
          'customerUser.phone': 1,
          'customerUser.ratingSummary': 1,
        },
      },
    ]);
  }

  listByCustomer(
    customerId: string,
    status: string | undefined,
    opts: { skip: number; limit: number; sort: Record<string, 1 | -1> },
  ): Promise<{ items: IRequest[]; total: number }> {
    const filter: Record<string, unknown> = { customer: customerId };
    if (status) filter.status = status;
    return this.paginate(filter, opts);
  }

  incrementOffers(requestId: string, by = 1): Promise<IRequest | null> {
    return this.model
      .findByIdAndUpdate(requestId, { $inc: { offersCount: by } }, { new: true })
      .exec();
  }

  /** Bulk-expire open requests whose expiry has passed. Returns affected count. */
  async expireStale(now: Date): Promise<number> {
    const res = await this.model
      .updateMany(
        { status: 'open', expiresAt: { $lte: now } },
        { $set: { status: 'expired' } },
      )
      .exec();
    return res.modifiedCount;
  }
}

export const requestRepository = new RequestRepository();
