import { Driver, type IDriver } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class DriverRepository extends BaseRepository<IDriver> {
  constructor() {
    super(Driver);
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
