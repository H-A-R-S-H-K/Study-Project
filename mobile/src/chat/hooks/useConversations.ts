import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatApi } from '../api/chatApi';
import { connectSocket } from '../../services/socket';

/**
 * The conversation list. Also subscribes to `conversation:updated` pushes so the
 * list refreshes (unread badges, last message) when a message arrives while the
 * user is on this screen but not inside that thread.
 */
export function useConversations() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['conversations'], queryFn: chatApi.listConversations });

  useEffect(() => {
    const socket = connectSocket();
    const onUpdated = (): void => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('conversation:updated', onUpdated);
    return () => {
      socket.off('conversation:updated', onUpdated);
    };
  }, [qc]);

  return query;
}
