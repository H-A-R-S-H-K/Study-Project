import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, RatingStatus, ReceivedRating } from '../../types/domain';

export const ratingApi = {
  async status(requestId: string): Promise<RatingStatus> {
    const { data } = await apiClient.get<ApiEnvelope<RatingStatus>>(
      `/requests/${requestId}/rating-status`,
    );
    return data.data;
  },

  async rate(requestId: string, score: number, review?: string): Promise<void> {
    await apiClient.post(`/requests/${requestId}/ratings`, { score, review });
  },

  async listReceived(userId: string): Promise<ReceivedRating[]> {
    const { data } = await apiClient.get<ApiEnvelope<ReceivedRating[]>>(
      `/users/${userId}/ratings?limit=50`,
    );
    return data.data;
  },
};
