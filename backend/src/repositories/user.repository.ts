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
}

export const userRepository = new UserRepository();
