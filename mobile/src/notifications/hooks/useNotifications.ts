import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';
import { connectSocket } from '../../services/socket';
import { registerDeviceToken, onTokenRefresh, onForegroundMessage } from '../services/fcm';
import { useAppSelector } from '../../redux/store';

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.list() });
}

/** Unread badge count, kept live by the socket `notification:new` push. */
export function useUnreadCount() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationApi.unreadCount,
  });

  useEffect(() => {
    const socket = connectSocket();
    const onNew = (): void => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
    };
  }, [qc]);

  return query;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/**
 * Registers the device for push once authenticated and wires token-refresh +
 * foreground-message handling. Foreground pushes just refresh the badge/list;
 * the durable inbox is the source of truth.
 */
export function usePushRegistration(): void {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;
    void registerDeviceToken();
    const offRefresh = onTokenRefresh();
    const offMessage = onForegroundMessage(() => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => {
      offRefresh();
      offMessage();
    };
  }, [isAuthenticated, qc]);
}
