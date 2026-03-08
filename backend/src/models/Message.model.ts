import { Schema, model, type Document, type Types } from 'mongoose';
import { MessageType, values } from '../types/enums.js';
import { PointSchema, type GeoPoint } from './geo.schema.js';

/**
 * A single message within a Chat. Supports text, shared images (Cloudinary URL),
 * and shared locations (GeoJSON point). `readBy` records who has read the
 * message, powering read receipts; delivery/typing indicators are transient and
 * handled over Socket.IO (Phase 7), not persisted.
 */
export interface IMessage extends Document {
  _id: Types.ObjectId;
  chat: Types.ObjectId; // ref Chat
  sender: Types.ObjectId; // ref User
  type: MessageType;
  text?: string;
  imageUrl?: string;
  location?: GeoPoint;
  readBy: Types.ObjectId[];
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: values(MessageType), default: MessageType.TEXT },
    text: { type: String, trim: true, maxlength: 2000 },
    imageUrl: { type: String, trim: true },
    location: { type: PointSchema },
    readBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

// Paginated message history for a chat (newest first, then reversed client-side).
MessageSchema.index({ chat: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', MessageSchema);
