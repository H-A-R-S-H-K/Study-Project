import { z } from 'zod';

export const listNotificationsQuery = z.object({
  unread: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const notificationIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});

export const registerDeviceSchema = z.object({
  token: z.string().min(10).max(4096),
});
