import { Types } from 'mongoose';
import { Rating, type IRating } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import type { NearbyProviderUser } from './geo.types.js';

/** A received rating joined to the person who wrote it. */
export interface RatingRow {
  _id: unknown;
  score: number;
  review?: string;
  direction: string;
  createdAt: Date;
  rater: Pick<NearbyProviderUser, '_id' | 'name' | 'avatarUrl'>;
}

class RatingRepository extends BaseRepository<IRating> {
  constructor() {
    super(Rating);
  }

  findByRequestAndRater(requestId: string, raterId: string): Promise<IRating | null> {
    return this.findOne({ request: requestId, rater: raterId });
  }

  /** A user's received ratings, newest first, with the rater's name/avatar. */
  listForRatee(
    rateeId: string,
    opts: { skip: number; limit: number },
  ): Promise<RatingRow[]> {
    return this.model.aggregate<RatingRow>([
      { $match: { ratee: new Types.ObjectId(rateeId) } },
      { $sort: { createdAt: -1 } },
      { $skip: opts.skip },
      { $limit: opts.limit },
      { $lookup: { from: 'users', localField: 'rater', foreignField: '_id', as: 'rater' } },
      { $unwind: '$rater' },
      {
        $project: {
          score: 1,
          review: 1,
          direction: 1,
          createdAt: 1,
          'rater._id': 1,
          'rater.name': 1,
          'rater.avatarUrl': 1,
        },
      },
    ]);
  }

  countForRatee(rateeId: string): Promise<number> {
    return this.count({ ratee: rateeId });
  }
}

export const ratingRepository = new RatingRepository();
