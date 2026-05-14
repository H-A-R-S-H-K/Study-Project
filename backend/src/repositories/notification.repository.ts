import { Notification, type INotification } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  listForUser(
    userId: string,
    unreadOnly: boolean,
    opts: { skip: number; limit: number; sort: Record<string, 1 | -1> },
  ): Promise<{ items: INotification[]; total: number }> {
    const filter: Record<string, unknown> = { recipient: userId };
    if (unreadOnly) filter.isRead = false;
    return this.paginate(filter, opts);
  }

  unreadCount(userId: string): Promise<number> {
    return this.count({ recipient: userId, isRead: false });
  }

  markRead(id: string, userId: string): Promise<INotification | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, recipient: userId },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async markAllRead(userId: string): Promise<number> {
    const res = await this.model
      .updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return res.modifiedCount;
  }
}

export const notificationRepository = new NotificationRepository();
