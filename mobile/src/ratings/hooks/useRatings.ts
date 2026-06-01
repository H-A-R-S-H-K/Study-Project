import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ratingApi } from '../api/ratingApi';

export function useRatingStatus(requestId: string) {
  return useQuery({
    queryKey: ['rating-status', requestId],
    queryFn: () => ratingApi.status(requestId),
  });
}

export function useReceivedRatings(userId: string) {
  return useQuery({
    queryKey: ['ratings', 'received', userId],
    queryFn: () => ratingApi.listReceived(userId),
    enabled: Boolean(userId),
  });
}

export function useSubmitRating(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ score, review }: { score: number; review?: string }) =>
      ratingApi.rate(requestId, score, review),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rating-status', requestId] });
      qc.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}
