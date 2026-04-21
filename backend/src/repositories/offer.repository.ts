import { Types } from 'mongoose';
import { Offer, type IOffer } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { OfferStatus } from '../types/enums.js';
import type { NearbyProviderUser } from './geo.types.js';

const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

/** An offer joined to its provider (and vehicle, if any) for the customer's inbox. */
export interface OfferRow {
  _id: unknown;
  request: unknown;
  price: number;
  currency: string;
  message?: string;
  status: string;
  providerType: string;
  createdAt: Date;
  provider: NearbyProviderUser;
  vehicle?: {
    _id: unknown;
    title: string;
    type: string;
    images: string[];
    verifiedRegistration: boolean;
  };
}

class OfferRepository extends BaseRepository<IOffer> {
  constructor() {
    super(Offer);
  }

  findActive(requestId: string, providerId: string): Promise<IOffer | null> {
    return this.findOne({
      request: requestId,
      provider: providerId,
      status: { $in: [OfferStatus.PENDING, OfferStatus.ACCEPTED] },
    });
  }

  /** All offers on a request, newest first, joined to provider + vehicle. */
  listForRequest(requestId: string): Promise<OfferRow[]> {
    return this.model.aggregate<OfferRow>([
      { $match: { request: toObjectId(requestId) } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'users', localField: 'provider', foreignField: '_id', as: 'provider' } },
      { $unwind: '$provider' },
      {
        $lookup: { from: 'vehicles', localField: 'vehicle', foreignField: '_id', as: 'vehicle' },
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          request: 1,
          price: 1,
          currency: 1,
          message: 1,
          status: 1,
          providerType: 1,
          createdAt: 1,
          'provider._id': 1,
          'provider.name': 1,
          'provider.avatarUrl': 1,
          'provider.phone': 1,
          'provider.ratingSummary': 1,
          'vehicle._id': 1,
          'vehicle.title': 1,
          'vehicle.type': 1,
          'vehicle.images': 1,
          'vehicle.verifiedRegistration': 1,
        },
      },
    ]);
  }

  listByProvider(
    providerId: string,
    opts: { skip: number; limit: number; sort: Record<string, 1 | -1> },
  ): Promise<{ items: IOffer[]; total: number }> {
    return this.paginate({ provider: providerId }, opts);
  }

  setStatus(offerId: string, status: OfferStatus): Promise<IOffer | null> {
    return this.updateById(offerId, { status });
  }

  /** Reject every still-pending offer on a request except the accepted one. */
  async rejectOthers(requestId: string, exceptOfferId: string): Promise<number> {
    const res = await this.model
      .updateMany(
        { request: requestId, _id: { $ne: exceptOfferId }, status: OfferStatus.PENDING },
        { $set: { status: OfferStatus.REJECTED } },
      )
      .exec();
    return res.modifiedCount;
  }
}

export const offerRepository = new OfferRepository();
