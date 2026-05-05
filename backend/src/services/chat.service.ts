import { Types } from 'mongoose';
import { chatRepository } from '../repositories/chat.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { realtime } from './realtime.service.js';
import { storageService, type UploadedFile } from './storage.service.js';
import {
  toMessageDto,
  toConversationDto,
  type MessageDto,
  type ConversationDto,
} from '../dtos/chat.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import { MessageType } from '../types/enums.js';
import type { GeoPoint } from '../models/geo.schema.js';
import type { IChat } from '../models/index.js';

export interface SendMessageInput {
  type?: MessageType;
  text?: string;
  imageUrl?: string;
  location?: GeoPoint;
}

class ChatService {
  listConversations(userId: string): Promise<ConversationDto[]> {
    return chatRepository.listForUser(userId).then((rows) => rows.map(toConversationDto));
  }

  async getMessages(
    userId: string,
    chatId: string,
    page: { skip: number; limit: number },
  ): Promise<{ items: MessageDto[]; meta: PaginationMeta }> {
    await this.requireParticipant(chatId, userId);
    const { items, total } = await messageRepository.listForChat(chatId, page);
    return {
      // Reverse so the client gets oldest→newest within the page.
      items: items.map(toMessageDto).reverse(),
      meta: buildPaginationMeta(total, Math.floor(page.skip / page.limit) + 1, page.limit),
    };
  }

  /**
   * Persist a message, update the chat's denormalised last-message + unread
   * fields, and emit realtime events. Used by BOTH the REST endpoint and the
   * socket handler, so the two paths behave identically.
   */
  async sendMessage(
    userId: string,
    chatId: string,
    input: SendMessageInput,
  ): Promise<MessageDto> {
    const chat = await this.requireParticipant(chatId, userId);
    const type = input.type ?? MessageType.TEXT;
    this.validateContent(type, input);

    const message = await messageRepository.create({
      chat: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(userId),
      type,
      text: input.text,
      imageUrl: input.imageUrl,
      location: input.location,
      readBy: [new Types.ObjectId(userId)], // sender has "read" their own message
    });

    const recipientId = this.otherParticipant(chat, userId);
    await chatRepository.recordMessage({
      chatId,
      senderId: userId,
      recipientId,
      preview: this.preview(type, input.text),
      at: message.createdAt,
    });

    const dto = toMessageDto(message);
    realtime.newMessage(dto, recipientId);
    return dto;
  }

  async sendImageMessage(
    userId: string,
    chatId: string,
    file: UploadedFile,
  ): Promise<MessageDto> {
    await this.requireParticipant(chatId, userId);
    const asset = await storageService.upload(file, 'chat');
    return this.sendMessage(userId, chatId, { type: MessageType.IMAGE, imageUrl: asset.url });
  }

  async markRead(userId: string, chatId: string): Promise<void> {
    await this.requireParticipant(chatId, userId);
    const changed = await messageRepository.markReadByUser(chatId, userId);
    await chatRepository.clearUnread(chatId, userId);
    if (changed > 0) realtime.read(chatId, userId, new Date());
  }

  private otherParticipant(chat: IChat, userId: string): string {
    const other = chat.participants.find((p) => p.toString() !== userId);
    if (!other) throw ApiError.internal('Chat has no counterpart participant');
    return other.toString();
  }

  private async requireParticipant(chatId: string, userId: string): Promise<IChat> {
    const chat = await chatRepository.isParticipant(chatId, userId);
    if (!chat) throw ApiError.forbidden('You are not part of this conversation');
    return chat;
  }

  private validateContent(type: MessageType, input: SendMessageInput): void {
    if (type === MessageType.TEXT && !input.text?.trim()) {
      throw ApiError.badRequest('Message text is required');
    }
    if (type === MessageType.IMAGE && !input.imageUrl) {
      throw ApiError.badRequest('Image URL is required');
    }
    if (type === MessageType.LOCATION && !input.location) {
      throw ApiError.badRequest('Location is required');
    }
  }

  private preview(type: MessageType, text?: string): string {
    if (type === MessageType.IMAGE) return '📷 Photo';
    if (type === MessageType.LOCATION) return '📍 Location';
    return (text ?? '').slice(0, 120);
  }
}

export const chatService = new ChatService();
