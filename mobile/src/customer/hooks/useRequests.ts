import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  requestApi,
  type CreateRequestInput,
  type FeedParams,
} from '../api/requestApi';
import type { RequestStatus } from '../../types/domain';

const MINE = ['requests', 'mine'] as const;

export function useMyRequests(status?: RequestStatus) {
  return useQuery({
    queryKey: [...MINE, status ?? 'all'],
    queryFn: () => requestApi.listMine(status),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRequestInput) => requestApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MINE }),
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      requestApi.cancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}

/** Provider-side nearby-request feed; disabled until a location is known. */
export function useRequestFeed(params: FeedParams | null) {
  return useQuery({
    queryKey: ['requests', 'feed', params],
    queryFn: () => requestApi.feed(params as FeedParams),
    enabled: params !== null,
    staleTime: 15_000,
  });
}
