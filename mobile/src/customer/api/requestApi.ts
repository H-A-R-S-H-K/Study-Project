import { apiClient } from '../../services/apiClient';
import type {
  ApiEnvelope,
  TransportRequest,
  FeedRequest,
  ServiceType,
  VehicleType,
  RequestStatus,
} from '../../types/domain';

export interface CreateRequestInput {
  pickup: { address: string; location: { type: 'Point'; coordinates: [number, number] } };
  destination: { address: string; location: { type: 'Point'; coordinates: [number, number] } };
  serviceType: ServiceType;
  vehicleType?: VehicleType;
  scheduledAt: string; // ISO
  description?: string;
}

export interface FeedParams {
  lng: number;
  lat: number;
  radius?: number;
  vehicleType?: VehicleType;
}

export const requestApi = {
  async create(input: CreateRequestInput): Promise<TransportRequest> {
    const { data } = await apiClient.post<ApiEnvelope<TransportRequest>>('/requests', input);
    return data.data;
  },

  async listMine(status?: RequestStatus): Promise<TransportRequest[]> {
    const q = status ? `?status=${status}&limit=50` : '?limit=50';
    const { data } = await apiClient.get<ApiEnvelope<TransportRequest[]>>(`/requests${q}`);
    return data.data;
  },

  async getById(id: string): Promise<TransportRequest> {
    const { data } = await apiClient.get<ApiEnvelope<TransportRequest>>(`/requests/${id}`);
    return data.data;
  },

  async cancel(id: string, reason?: string): Promise<TransportRequest> {
    const { data } = await apiClient.post<ApiEnvelope<TransportRequest>>(
      `/requests/${id}/cancel`,
      { reason },
    );
    return data.data;
  },

  async feed(params: FeedParams): Promise<FeedRequest[]> {
    // Plain-string query (Hermes lacks reliable URLSearchParams support).
    const parts = [`lng=${params.lng}`, `lat=${params.lat}`];
    if (params.radius) parts.push(`radius=${params.radius}`);
    if (params.vehicleType) parts.push(`vehicleType=${params.vehicleType}`);
    const { data } = await apiClient.get<ApiEnvelope<FeedRequest[]>>(
      `/requests/feed?${parts.join('&')}`,
    );
    return data.data;
  },
};
