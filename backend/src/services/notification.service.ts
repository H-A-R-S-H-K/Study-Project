import { Types } from 'mongoose';
import { notificationRepository } from '../repositories/notification.repository.js';
import { pushService } from './push.service.js';
import { realtime } from './realtime.service.js';
import { toNotificationDto, type NotificationDto } from '../dtos/notification.dto.js';
import { buildPaginationMeta, type PaginationOptions } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import type { NotificationType } from '../types/enums.js';
import { logger } from '../config/logger.js';

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * The single entry point for notifying a user. Every notification is (1) durably
 * recorded — the in-app inbox is the source of truth, (2) pushed via FCM, and
 * (3) emitted over the socket for an instant in-app badge. `notify` never
 * throws: a notification failure must not break the action that triggered it.
 */
class NotificationService {
  async notify(recipientId: string, input: NotifyInput): Promise<void> {
    try {
      const notification = await notificationRepository.create({
        recipient: new Types.ObjectId(recipientId),
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
      });
      const dto = toNotificationDto(notification);
      realtime.notification(recipientId, dto);
      await pushService.sendToUser(recipientId, {
        title: input.title,
        body: input.body,
        data: input.data,
      });
    } catch (err) {
      logger.error({ err, recipientId, type: input.type }, 'notify failed');
    }
  }

  /** Fan out to many recipients (e.g. nearby providers), capped by the caller. */
  async notifyMany(recipientIds: string[], input: NotifyInput): Promise<void> {
    await Promise.all(recipientIds.map((id) => this.notify(id, input)));
  }

  async list(
    userId: string,
    unreadOnly: boolean,
    page: PaginationOptions,
  ): Promise<{ items: NotificationDto[]; meta: PaginationMeta }> {
    const { items, total } = await notificationRepository.listForUser(userId, unreadOnly, page);
    return {
      items: items.map(toNotificationDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  unreadCount(userId: string): Promise<number> {
    return notificationRepository.unreadCount(userId);
  }

  markRead(userId: string, id: string): Promise<unknown> {
    return notificationRepository.markRead(id, userId);
  }

  markAllRead(userId: string): Promise<number> {
    return notificationRepository.markAllRead(userId);
  }
}

export const notificationService = new NotificationService();
