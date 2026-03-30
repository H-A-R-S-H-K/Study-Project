import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driverApi, type DriverProfileInput } from '../api/driverApi';

const KEY = ['driver', 'me'] as const;

export function useDriverProfile() {
  return useQuery({ queryKey: KEY, queryFn: driverApi.getMine });
}

export function useUpsertDriverProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DriverProfileInput) => driverApi.upsert(input),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}

export function useSetDriverAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => driverApi.setAvailability(isAvailable),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}
