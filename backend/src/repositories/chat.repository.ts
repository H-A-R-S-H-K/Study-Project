import { Types } from 'mongoose';
import { Chat, type IChat } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import type { NearbyProviderUser } from './geo.types.js';

/** A conversation-list row: the chat plus the *other* participant's summary. */
export interface ConversationRow {
  _id: unknown;
  request: unknown;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSender?: unknown;
  unreadForMe: number;
  updatedAt: Date;
  other: NearbyProviderUser;
}

class ChatRepository extends BaseRepository<IChat> {
  constructor() {
    super(Chat);
  }

  findByRequest(requestId: string): Promise<IChat | null> {
    return this.findOne({ request: requestId });
  }

  /** Is this user one of the chat's two participants? (authorization gate) */
  async isParticipant(chatId: string, userId: string): Promise<IChat | null> {
    return this.findOne({ _id: chatId, participants: userId });
  }

  /** The user's conversation list, most-recent activity first. */
  listForUser(userId: string): Promise<ConversationRow[]> {
    const uid = new Types.ObjectId(userId);
    return this.model.aggregate<ConversationRow>([
      { $match: { participants: uid } },
      { $sort: { lastMessageAt: -1, updatedAt: -1 } },
      {
        $addFields: {
          otherId: { $first: { $filter: { input: '$participants', cond: { $ne: ['$$this', uid] } } } },
          unreadForMe: { $ifNull: [{ $getField: { field: userId, input: '$unread' } }, 0] },
        },
      },
      { $lookup: { from: 'users', localField: 'otherId', foreignField: '_id', as: 'other' } },
      { $unwind: '$other' },
      {
        $project: {
          request: 1,
          lastMessage: 1,
          lastMessageAt: 1,
          lastMessageSender: 1,
          unreadForMe: 1,
          updatedAt: 1,
          'other._id': 1,
          'other.name': 1,
          'other.avatarUrl': 1,
          'other.phone': 1,
          'other.ratingSummary': 1,
        },
      },
    ]);
  }

  /** After a message: bump last-message fields and the recipient's unread count. */
  recordMessage(args: {
    chatId: string;
    senderId: string;
    recipientId: string;
    preview: string;
    at: Date;
  }): Promise<IChat | null> {
    return this.model
      .findByIdAndUpdate(
        args.chatId,
        {
          $set: {
            lastMessage: args.preview,
            lastMessageAt: args.at,
            lastMessageSender: new Types.ObjectId(args.senderId),
          },
          $inc: { [`unread.${args.recipientId}`]: 1 },
        },
        { new: true },
      )
      .exec();
  }

  /** Reset a user's unread counter for a chat (on read). */
  clearUnread(chatId: string, userId: string): Promise<IChat | null> {
    return this.model
      .findByIdAndUpdate(chatId, { $set: { [`unread.${userId}`]: 0 } }, { new: true })
      .exec();
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
