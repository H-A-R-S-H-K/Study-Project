import type { INotification } from '../models/index.js';
import type { NotificationType } from '../types/enums.js';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

export function toNotificationDto(n: INotification): NotificationDto {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}
