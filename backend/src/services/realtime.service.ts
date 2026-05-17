import { getIo } from '../config/socket.js';
import type { MessageDto } from '../dtos/chat.dto.js';

/**
 * Thin wrapper over Socket.IO emits so services stay decoupled from transport.
 * Both the REST controllers and the socket handlers funnel through here, so a
 * message sent via HTTP and one sent via socket produce identical realtime
 * events. Rooms: `chat:<id>` (people viewing the thread) and `user:<id>`
 * (a participant's devices, wherever they are in the app).
 */
export const realtime = {
  /** New message → everyone in the thread, plus the recipient's personal room. */
  newMessage(message: MessageDto, recipientId: string): void {
    const io = getIo();
    io.to(`chat:${message.chat}`).emit('message:new', message);
    io.to(`user:${recipientId}`).emit('conversation:updated', { chatId: message.chat });
  },

  /** Read receipt → the thread. */
  read(chatId: string, readerId: string, at: Date): void {
    getIo().to(`chat:${chatId}`).emit('message:read', { chatId, userId: readerId, at });
  },

  /** Typing indicator → the thread, excluding the typer is done at the handler. */
  typing(chatId: string, userId: string, isTyping: boolean): void {
    getIo().to(`chat:${chatId}`).emit('typing', { chatId, userId, isTyping });
  },

  /** In-app notification → the recipient's devices (instant badge update). */
  notification(userId: string, payload: unknown): void {
    getIo().to(`user:${userId}`).emit('notification:new', payload);
  },
};
