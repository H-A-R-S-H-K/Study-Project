import { useQuery } from '@tanstack/react-query';
import { discoveryApi, type NearbyParams } from '../api/discoveryApi';

/**
 * Nearby providers for a coordinate. Disabled until we have a location, so the
 * query never fires with (0,0). Kept fresh for 15s since availability changes.
 */
export function useNearbyProviders(params: NearbyParams | null) {
  return useQuery({
    queryKey: ['nearby', 'providers', params],
    queryFn: () => discoveryApi.nearbyProviders(params as NearbyParams),
    enabled: params !== null,
    staleTime: 15_000,
  });
}
