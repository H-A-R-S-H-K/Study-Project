import { Server as IOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { verifyAccessToken } from '../utils/jwt.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { registerChatHandlers } from '../sockets/chat.socket.js';

/** Data we attach to every authenticated socket. */
export interface SocketData {
  userId: string;
  role: string;
}

export type AppSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

let io: IOServer | null = null;

/**
 * Attaches Socket.IO to the HTTP server. The handshake is authenticated with the
 * same JWT access token as the REST API (passed in `socket.handshake.auth.token`),
 * so an unauthenticated client can never open a connection. Each socket joins a
 * personal room `user:<id>` for targeted pushes (new message in another chat).
 */
export function initSocket(server: HttpServer): IOServer {
  io = new IOServer(server, {
    cors: { origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true, credentials: true },
    pingTimeout: 30_000,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccessToken(token);
      (socket as AppSocket).data.userId = payload.sub;
      (socket as AppSocket).data.role = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const s = socket as AppSocket;
    s.join(`user:${s.data.userId}`);
    logger.debug({ userId: s.data.userId }, 'Socket connected');
    registerChatHandlers(s);
    s.on('disconnect', () => logger.debug({ userId: s.data.userId }, 'Socket disconnected'));
  });

  return io;
}

/** Access the initialised io instance from services (throws if not started). */
export function getIo(): IOServer {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}
