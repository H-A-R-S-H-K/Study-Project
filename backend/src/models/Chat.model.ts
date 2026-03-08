import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * A 1:1 conversation between a customer and a chosen provider, opened
 * automatically when an offer is accepted. Bound to the originating request so
 * the chat has full context. `lastMessage*` fields are denormalised for the
 * conversation-list screen (avoids a lookup per row).
 *
 * `unread` maps each participant's userId → their unread count.
 */
export interface IChat extends Document {
  _id: Types.ObjectId;
  request: Types.ObjectId; // ref Request
  participants: Types.ObjectId[]; // exactly [customerId, providerId]
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSender?: Types.ObjectId;
  unread: Map<string, number>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    request: {
      type: Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      unique: true, // one chat per request
    },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: [(v: Types.ObjectId[]) => v.length === 2, 'A chat has exactly two participants'],
      index: true,
    },
    lastMessage: { type: String, trim: true, maxlength: 500 },
    lastMessageAt: { type: Date },
    lastMessageSender: { type: Schema.Types.ObjectId, ref: 'User' },
    unread: { type: Map, of: Number, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// A user's conversation list, most-recent activity first.
ChatSchema.index({ participants: 1, lastMessageAt: -1 });

export const Chat = model<IChat>('Chat', ChatSchema);
