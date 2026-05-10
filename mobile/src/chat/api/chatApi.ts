import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, Conversation, ChatMessage } from '../../types/domain';

export const chatApi = {
  async listConversations(): Promise<Conversation[]> {
    const { data } = await apiClient.get<ApiEnvelope<Conversation[]>>('/chats');
    return data.data;
  },

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const { data } = await apiClient.get<ApiEnvelope<ChatMessage[]>>(
      `/chats/${chatId}/messages?limit=50`,
    );
    return data.data; // oldest → newest within the page
  },

  /** REST fallback for sending when the socket is momentarily down. */
  async sendMessage(chatId: string, text: string): Promise<ChatMessage> {
    const { data } = await apiClient.post<ApiEnvelope<ChatMessage>>(
      `/chats/${chatId}/messages`,
      { text },
    );
    return data.data;
  },

  async markRead(chatId: string): Promise<void> {
    await apiClient.post(`/chats/${chatId}/read`);
  },
};
