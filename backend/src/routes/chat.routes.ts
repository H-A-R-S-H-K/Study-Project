import { Router } from 'express';
import * as ctrl from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import multer from 'multer';
import {
  chatIdParams,
  messagesQuerySchema,
  sendMessageSchema,
} from '../validators/chat.validators.js';

// Single-image uploader for chat photos (field "image").
const uploadChatImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

/**
 * Chat REST surface. Realtime happens over Socket.IO; these endpoints back it
 * for history, image upload, and a socket-less fallback for sending/reading.
 */
const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /chats:
 *   get:
 *     tags: [Chat]
 *     summary: My conversations (with last message + unread count)
 *     responses: { 200: { description: Conversations } }
 */
router.get('/', ctrl.listConversations);

/**
 * @openapi
 * /chats/{id}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Paginated message history for a chat
 *     responses: { 200: { description: Messages (oldest→newest within page) } }
 *   post:
 *     tags: [Chat]
 *     summary: Send a message (REST fallback; realtime is via Socket.IO)
 *     responses: { 201: { description: Sent } }
 */
router
  .route('/:id/messages')
  .get(validate({ params: chatIdParams, query: messagesQuerySchema }), ctrl.getMessages)
  .post(validate({ params: chatIdParams, body: sendMessageSchema }), ctrl.sendMessage);

/**
 * @openapi
 * /chats/{id}/image:
 *   post:
 *     tags: [Chat]
 *     summary: Upload and send an image message (multipart, field "image")
 *     responses: { 201: { description: Sent } }
 */
router.post('/:id/image', validate({ params: chatIdParams }), uploadChatImage, ctrl.sendImage);

/**
 * @openapi
 * /chats/{id}/read:
 *   post:
 *     tags: [Chat]
 *     summary: Mark a conversation read (receipts + clears unread)
 *     responses: { 200: { description: Marked read } }
 */
router.post('/:id/read', validate({ params: chatIdParams }), ctrl.markRead);

export default router;
