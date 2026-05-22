import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, AppNotification } from '../../types/domain';

export const notificationApi = {
  async list(unreadOnly = false): Promise<AppNotification[]> {
    const q = unreadOnly ? '?unread=true&limit=50' : '?limit=50';
    const { data } = await apiClient.get<ApiEnvelope<AppNotification[]>>(`/notifications${q}`);
    return data.data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<ApiEnvelope<{ count: number }>>(
      '/notifications/unread-count',
    );
    return data.data.count;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  async registerDevice(token: string): Promise<void> {
    await apiClient.post('/users/me/devices', { token });
  },

  async unregisterDevice(token: string): Promise<void> {
    await apiClient.delete(`/users/me/devices/${encodeURIComponent(token)}`);
  },
};
