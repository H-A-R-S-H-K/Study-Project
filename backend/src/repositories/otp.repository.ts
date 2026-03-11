import { Otp, type IOtp } from '../models/Otp.model.js';
import { BaseRepository } from './base.repository.js';

class OtpRepository extends BaseRepository<IOtp> {
  constructor() {
    super(Otp);
  }

  /** Most recent, unconsumed, unexpired code for a phone. */
  findLatestLive(phone: string): Promise<IOtp | null> {
    return this.model
      .findOne({ phone, consumed: false, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .exec();
  }

  incrementAttempts(id: string): Promise<IOtp | null> {
    return this.model.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true }).exec();
  }

  consume(id: string): Promise<IOtp | null> {
    return this.model.findByIdAndUpdate(id, { consumed: true }, { new: true }).exec();
  }

  /** Invalidate any outstanding codes before issuing a fresh one. */
  invalidateAllForPhone(phone: string): Promise<unknown> {
    return this.model.updateMany({ phone, consumed: false }, { consumed: true }).exec();
  }
}

export const otpRepository = new OtpRepository();
