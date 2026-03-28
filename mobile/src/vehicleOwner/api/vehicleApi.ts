import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, Vehicle, VehicleType } from '../../types/domain';

export interface VehicleInput {
  type: VehicleType;
  title: string;
  registrationNumber: string;
  make?: string;
  modelName?: string;
  year?: number;
  color?: string;
  capacity?: number;
}

export interface LocalImage {
  uri: string;
  name: string;
  type: string;
}

export const vehicleApi = {
  async list(): Promise<Vehicle[]> {
    const { data } = await apiClient.get<ApiEnvelope<Vehicle[]>>('/vehicles?limit=50');
    return data.data;
  },

  async create(input: VehicleInput): Promise<Vehicle> {
    const { data } = await apiClient.post<ApiEnvelope<Vehicle>>('/vehicles', input);
    return data.data;
  },

  async update(id: string, patch: Partial<VehicleInput>): Promise<Vehicle> {
    const { data } = await apiClient.patch<ApiEnvelope<Vehicle>>(`/vehicles/${id}`, patch);
    return data.data;
  },

  async setAvailability(id: string, isAvailable: boolean): Promise<Vehicle> {
    const { data } = await apiClient.patch<ApiEnvelope<Vehicle>>(`/vehicles/${id}/availability`, {
      isAvailable,
    });
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  },

  async uploadImages(id: string, images: LocalImage[]): Promise<Vehicle> {
    const form = new FormData();
    images.forEach((img) =>
      // React Native FormData accepts { uri, name, type } file parts.
      form.append('images', { uri: img.uri, name: img.name, type: img.type } as unknown as Blob),
    );
    const { data } = await apiClient.post<ApiEnvelope<Vehicle>>(`/vehicles/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
