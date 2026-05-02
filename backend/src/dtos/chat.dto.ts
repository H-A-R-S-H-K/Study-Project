import type { IMessage } from '../models/index.js';
import type { ConversationRow } from '../repositories/chat.repository.js';
import type { MessageType } from '../types/enums.js';
import type { GeoPoint } from '../models/geo.schema.js';

export interface MessageDto {
  id: string;
  chat: string;
  sender: string;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  location?: GeoPoint;
  readBy: string[];
  createdAt: Date;
}

export function toMessageDto(m: IMessage): MessageDto {
  return {
    id: m._id.toString(),
    chat: m.chat.toString(),
    sender: m.sender.toString(),
    type: m.type,
    text: m.text,
    imageUrl: m.imageUrl,
    location: m.location,
    readBy: m.readBy.map((r) => r.toString()),
    createdAt: m.createdAt,
  };
}

export interface ConversationDto {
  id: string;
  request: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSender?: string;
  unread: number;
  other: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone: string;
    rating: { average: number; count: number };
  };
}

export function toConversationDto(row: ConversationRow): ConversationDto {
  return {
    id: String(row._id),
    request: String(row.request),
    lastMessage: row.lastMessage,
    lastMessageAt: row.lastMessageAt,
    lastMessageSender: row.lastMessageSender ? String(row.lastMessageSender) : undefined,
    unread: row.unreadForMe,
    other: {
      id: row.other._id.toString(),
      name: row.other.name,
      avatarUrl: row.other.avatarUrl,
      phone: row.other.phone,
      rating: row.other.ratingSummary,
    },
  };
}
