import { Schema, model, type Document, type Types } from 'mongoose';
import { NotificationType, values } from '../types/enums.js';

/**
 * An in-app notification record. Push delivery (FCM) is fire-and-forget in
 * Phase 8; this collection is the durable inbox the app reads on open and marks
 * read. `data` carries a small typed payload (ids) the client uses to deep-link.
 */
export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId; // ref User
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>; // deep-link ids (requestId, chatId, ...)
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: values(NotificationType), required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 300 },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true },
);

// A user's notification feed, newest first; also supports unread filtering.
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Auto-purge notifications after 60 days to keep the collection bounded.
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

export const Notification = model<INotification>('Notification', NotificationSchema);
