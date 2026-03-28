import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleApi, type VehicleInput } from '../api/vehicleApi';

const KEY = ['vehicles', 'mine'] as const;

/** Read + mutate the current owner's vehicles, invalidating the list on writes. */
export function useMyVehicles() {
  return useQuery({ queryKey: KEY, queryFn: vehicleApi.list });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInput) => vehicleApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<VehicleInput>) => vehicleApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetVehicleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      vehicleApi.setAvailability(id, isAvailable),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
