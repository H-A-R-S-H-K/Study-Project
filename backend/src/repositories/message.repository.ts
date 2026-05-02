import { Types } from 'mongoose';
import { Message, type IMessage } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message);
  }

  /** Paginated history for a chat, newest first (client reverses for display). */
  listForChat(
    chatId: string,
    opts: { skip: number; limit: number },
  ): Promise<{ items: IMessage[]; total: number }> {
    return this.paginate(
      { chat: chatId },
      { ...opts, sort: { createdAt: -1 } },
    );
  }

  /**
   * Mark all messages in a chat that the reader did not send as read by them.
   * Returns how many were newly marked (drives whether a receipt is emitted).
   */
  async markReadByUser(chatId: string, userId: string): Promise<number> {
    const res = await this.model
      .updateMany(
        { chat: chatId, sender: { $ne: userId }, readBy: { $ne: new Types.ObjectId(userId) } },
        { $addToSet: { readBy: new Types.ObjectId(userId) } },
      )
      .exec();
    return res.modifiedCount;
  }
}

export const messageRepository = new MessageRepository();
