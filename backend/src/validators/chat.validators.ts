import { z } from 'zod';
import { MessageType, values } from '../types/enums.js';

export const chatIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat id'),
});

export const messagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const sendMessageSchema = z
  .object({
    type: z.enum(values(MessageType) as [string, ...string[]]).optional(),
    text: z.string().trim().max(2000).optional(),
    imageUrl: z.string().url().optional(),
    location: z
      .object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
      })
      .optional(),
  })
  .refine((v) => v.text || v.imageUrl || v.location, 'A message must have content');
