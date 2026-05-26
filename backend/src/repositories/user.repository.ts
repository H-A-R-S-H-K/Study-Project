import { User, type IUser } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

/**
 * All User persistence lives here. Services call these methods and never touch
 * the Mongoose model directly.
 */
class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  findByPhone(phone: string): Promise<IUser | null> {
    return this.findOne({ phone });
  }

  existsByPhone(phone: string): Promise<boolean> {
    return this.model.exists({ phone }).then((r) => r !== null);
  }

  /** Add an FCM device token without duplicates. */
  addFcmToken(userId: string, token: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, { $addToSet: { fcmTokens: token } }, { new: true })
      .exec();
  }

  removeFcmToken(userId: string, token: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, { $pull: { fcmTokens: token } }, { new: true })
      .exec();
  }

  touchLastActive(userId: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, { lastActiveAt: new Date() }, { new: true })
      .exec();
  }

  /**
   * Fold a new rating into the ratee's denormalised summary atomically using an
   * aggregation-pipeline update: newAvg = (avg*count + score) / (count+1). No
   * read-modify-write race — the recompute reads the document's own current
   * values inside the single update.
   */
  applyRating(userId: string, score: number): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(
        userId,
        [
          {
            $set: {
              'ratingSummary.average': {
                $divide: [
                  {
                    $add: [
                      { $multiply: ['$ratingSummary.average', '$ratingSummary.count'] },
                      score,
                    ],
                  },
                  { $add: ['$ratingSummary.count', 1] },
                ],
              },
              'ratingSummary.count': { $add: ['$ratingSummary.count', 1] },
            },
          },
        ],
        { new: true },
      )
      .exec();
  }
}

export const userRepository = new UserRepository();
