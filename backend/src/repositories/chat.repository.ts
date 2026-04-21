import { Types } from 'mongoose';
import { Chat, type IChat } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class ChatRepository extends BaseRepository<IChat> {
  constructor() {
    super(Chat);
  }

  findByRequest(requestId: string): Promise<IChat | null> {
    return this.findOne({ request: requestId });
  }

  /**
   * Creates the chat for a request if it doesn't exist yet (idempotent on the
   * unique `request` index). Called when an offer is accepted — the chat opens
   * automatically. Messaging itself is Phase 7.
   */
  async openForRequest(
    requestId: string,
    customerId: string,
    providerId: string,
  ): Promise<IChat> {
    const existing = await this.findByRequest(requestId);
    if (existing) return existing;
    return this.model.create({
      request: new Types.ObjectId(requestId),
      participants: [new Types.ObjectId(customerId), new Types.ObjectId(providerId)],
      unread: {},
    });
  }
}

export const chatRepository = new ChatRepository();
