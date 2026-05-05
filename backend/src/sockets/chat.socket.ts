import type { AppSocket } from '../config/socket.js';
import { chatService } from '../services/chat.service.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { realtime } from '../services/realtime.service.js';
import { logger } from '../config/logger.js';
import type { MessageType } from '../types/enums.js';
import type { GeoPoint } from '../models/geo.schema.js';

interface JoinPayload {
  chatId: string;
}
interface SendPayload {
  chatId: string;
  type?: MessageType;
  text?: string;
  imageUrl?: string;
  location?: GeoPoint;
}
interface TypingPayload {
  chatId: string;
  isTyping: boolean;
}

/**
 * Per-connection chat event handlers. Joining a chat room is authorised against
 * participation, so a client can never subscribe to a thread they're not in.
 * Message persistence + fan-out is delegated to chatService (same path as REST).
 */
export function registerChatHandlers(socket: AppSocket): void {
  const userId = socket.data.userId;

  socket.on('chat:join', async ({ chatId }: JoinPayload, ack?: (ok: boolean) => void) => {
    const chat = await chatRepository.isParticipant(chatId, userId);
    if (!chat) return ack?.(false);
    await socket.join(`chat:${chatId}`);
    ack?.(true);
  });

  socket.on('chat:leave', ({ chatId }: JoinPayload) => {
    void socket.leave(`chat:${chatId}`);
  });

  socket.on('message:send', async (payload: SendPayload, ack?: (res: unknown) => void) => {
    try {
      const message = await chatService.sendMessage(userId, payload.chatId, payload);
      ack?.({ ok: true, message });
    } catch (err) {
      logger.warn({ err, userId }, 'socket message:send failed');
      ack?.({ ok: false, error: err instanceof Error ? err.message : 'Failed to send' });
    }
  });

  socket.on('typing', ({ chatId, isTyping }: TypingPayload) => {
    realtime.typing(chatId, userId, isTyping);
  });

  socket.on('message:read', async ({ chatId }: JoinPayload) => {
    try {
      await chatService.markRead(userId, chatId);
    } catch (err) {
      logger.warn({ err, userId }, 'socket message:read failed');
    }
  });
}
