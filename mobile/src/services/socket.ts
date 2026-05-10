import { io, type Socket } from 'socket.io-client';
import { config } from '../config';
import { store } from '../redux/store';
import type { ChatMessage } from '../types/domain';

/**
 * Events the server pushes to the client. Typing these gives us checked
 * `socket.on('message:new', m => …)` with `m: ChatMessage`.
 */
export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:read': (payload: { chatId: string; userId: string; at: string }) => void;
  typing: (payload: { chatId: string; userId: string; isTyping: boolean }) => void;
  'conversation:updated': (payload: { chatId: string }) => void;
}

export interface ClientToServerEvents {
  'chat:join': (payload: { chatId: string }, ack?: (ok: boolean) => void) => void;
  'chat:leave': (payload: { chatId: string }) => void;
  'message:send': (
    payload: { chatId: string; type?: string; text?: string; imageUrl?: string },
    ack?: (res: { ok: boolean; message?: ChatMessage; error?: string }) => void,
  ) => void;
  'message:read': (payload: { chatId: string }) => void;
  typing: (payload: { chatId: string; isTyping: boolean }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * Lazily creates a single shared socket authenticated with the current access
 * token. Reused across screens; the chat screens connect on focus and the app
 * disconnects on logout. Auth is re-read on each (re)connect so a refreshed
 * token is picked up automatically.
 */
export function getSocket(): AppSocket {
  if (socket) return socket;
  socket = io(config.socketUrl, {
    transports: ['websocket'],
    autoConnect: false,
    auth: (cb) => cb({ token: store.getState().auth.accessToken ?? '' }),
  });
  return socket;
}

export function connectSocket(): AppSocket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
