import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';

const uid = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const chats = await chatService.listConversations(uid(req));
  ApiResponse.ok(res, chats);
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit } = parsePagination(req.query);
  const { items, meta } = await chatService.getMessages(uid(req), req.params.id, { skip, limit });
  ApiResponse.ok(res, items, 'OK', meta);
});

/** REST send — mirrors the socket path (useful for reliability / no socket). */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.sendMessage(uid(req), req.params.id, req.body);
  ApiResponse.created(res, message, 'Sent');
});

export const sendImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');
  const message = await chatService.sendImageMessage(uid(req), req.params.id, {
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
  });
  ApiResponse.created(res, message, 'Sent');
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await chatService.markRead(uid(req), req.params.id);
  ApiResponse.ok(res, null, 'Marked read');
});
