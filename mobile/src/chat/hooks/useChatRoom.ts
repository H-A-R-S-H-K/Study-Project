import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '../api/chatApi';
import { connectSocket } from '../../services/socket';
import { useAppSelector } from '../../redux/store';
import type { ChatMessage } from '../../types/domain';

interface ChatRoomState {
  messages: ChatMessage[];
  loading: boolean;
  otherTyping: boolean;
  send: (text: string) => void;
  setTyping: (isTyping: boolean) => void;
}

/**
 * Owns a live chat thread: loads history over REST, then keeps it current over
 * the socket (join room, receive new messages, typing, read receipts). Sending
 * emits over the socket and falls back to REST if the socket isn't connected —
 * either way the server echoes `message:new`, which is the single place we
 * append (deduped by id), so sender and recipient stay consistent.
 */
export function useChatRoom(chatId: string): ChatRoomState {
  const myId = useAppSelector((s) => s.auth.user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upsert = useCallback((incoming: ChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
    );
  }, []);

  useEffect(() => {
    let active = true;
    const socket = connectSocket();

    void chatApi.getMessages(chatId).then((history) => {
      if (active) {
        setMessages(history);
        setLoading(false);
      }
    });

    socket.emit('chat:join', { chatId });
    socket.emit('message:read', { chatId }); // opening the thread reads it

    const onNew = (m: ChatMessage): void => {
      if (m.chat !== chatId) return;
      upsert(m);
      if (m.sender !== myId) socket.emit('message:read', { chatId });
    };
    const onTyping = (p: { chatId: string; userId: string; isTyping: boolean }): void => {
      if (p.chatId === chatId && p.userId !== myId) setOtherTyping(p.isTyping);
    };
    const onRead = (p: { chatId: string; userId: string }): void => {
      if (p.chatId !== chatId || p.userId === myId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.readBy.includes(p.userId) ? m : { ...m, readBy: [...m.readBy, p.userId] },
        ),
      );
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('message:read', onRead);

    return () => {
      active = false;
      socket.emit('chat:leave', { chatId });
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('message:read', onRead);
    };
  }, [chatId, myId, upsert]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const socket = connectSocket();
      if (socket.connected) {
        socket.emit('message:send', { chatId, text: trimmed });
      } else {
        // Fallback: REST send, then append the returned message.
        void chatApi.sendMessage(chatId, trimmed).then(upsert);
      }
    },
    [chatId, upsert],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const socket = connectSocket();
      socket.emit('typing', { chatId, isTyping });
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (isTyping) {
        typingTimer.current = setTimeout(
          () => socket.emit('typing', { chatId, isTyping: false }),
          3000,
        );
      }
    },
    [chatId],
  );

  return { messages, loading, otherTyping, send, setTyping };
}
