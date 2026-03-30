import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, DriverProfile, VehicleType } from '../../types/domain';

export interface DriverProfileInput {
  licenseNumber: string;
  experienceYears: number;
  vehicleCategories: VehicleType[];
  bio?: string;
}

export const driverApi = {
  async getMine(): Promise<DriverProfile | null> {
    const { data } = await apiClient.get<ApiEnvelope<DriverProfile | null>>('/drivers/me');
    return data.data;
  },

  async upsert(input: DriverProfileInput): Promise<DriverProfile> {
    const { data } = await apiClient.put<ApiEnvelope<DriverProfile>>('/drivers/me', input);
    return data.data;
  },

  async setAvailability(isAvailable: boolean): Promise<DriverProfile> {
    const { data } = await apiClient.patch<ApiEnvelope<DriverProfile>>(
      '/drivers/me/availability',
      { isAvailable },
    );
    return data.data;
  },
};
