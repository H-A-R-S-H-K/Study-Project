import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offerApi, type CreateOfferInput } from '../api/offerApi';

/** Offers on a customer's request (their inbox). */
export function useRequestOffers(requestId: string) {
  return useQuery({
    queryKey: ['offers', 'request', requestId],
    queryFn: () => offerApi.listForRequest(requestId),
  });
}

/** A provider's own sent offers. */
export function useMyOffers() {
  return useQuery({ queryKey: ['offers', 'mine'], queryFn: offerApi.listMine });
}

export function useCreateOffer(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => offerApi.create(requestId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers', 'mine'] });
      qc.invalidateQueries({ queryKey: ['requests', 'feed'] });
    },
  });
}

export function useAcceptOffer(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offerApi.accept(requestId, offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers', 'request', requestId] });
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useWithdrawOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offerApi.withdraw(offerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers', 'mine'] }),
  });
}

export function useCompleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => offerApi.complete(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['rating-status'] }); // enables "Rate"
    },
  });
}
