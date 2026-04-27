import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, Offer, OfferDetail, TransportRequest } from '../../types/domain';

export interface CreateOfferInput {
  price: number;
  message?: string;
  vehicleId?: string;
}

export interface AcceptResult {
  request: TransportRequest;
  chatId: string;
}

export const offerApi = {
  // ── Provider ──────────────────────────────────────────
  async create(requestId: string, input: CreateOfferInput): Promise<Offer> {
    const { data } = await apiClient.post<ApiEnvelope<Offer>>(
      `/requests/${requestId}/offers`,
      input,
    );
    return data.data;
  },

  async listMine(): Promise<Offer[]> {
    const { data } = await apiClient.get<ApiEnvelope<Offer[]>>('/offers/mine?limit=50');
    return data.data;
  },

  async withdraw(offerId: string): Promise<Offer> {
    const { data } = await apiClient.post<ApiEnvelope<Offer>>(`/offers/${offerId}/withdraw`);
    return data.data;
  },

  // ── Customer ──────────────────────────────────────────
  async listForRequest(requestId: string): Promise<OfferDetail[]> {
    const { data } = await apiClient.get<ApiEnvelope<OfferDetail[]>>(
      `/requests/${requestId}/offers`,
    );
    return data.data;
  },

  async accept(requestId: string, offerId: string): Promise<AcceptResult> {
    const { data } = await apiClient.post<ApiEnvelope<AcceptResult>>(
      `/requests/${requestId}/offers/${offerId}/accept`,
    );
    return data.data;
  },

  // ── Either party ──────────────────────────────────────
  async complete(requestId: string): Promise<TransportRequest> {
    const { data } = await apiClient.post<ApiEnvelope<TransportRequest>>(
      `/requests/${requestId}/complete`,
    );
    return data.data;
  },
};
