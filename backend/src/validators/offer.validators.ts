import { z } from 'zod';

/**
 * Price is provider-entered. We only sanity-bound it (non-negative, not absurd)
 * — there is deliberately no calculation, estimate, or suggested value.
 */
export const createOfferSchema = z.object({
  price: z
    .number({ invalid_type_error: 'Enter a price' })
    .min(0, 'Price cannot be negative')
    .max(10_000_000, 'Price is unrealistically high'),
  message: z.string().trim().max(500).optional(),
  vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle id').optional(),
});

export const offerIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});

export const requestOfferParams = z.object({
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request id'),
  offerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid offer id'),
});

export const requestIdOnlyParams = z.object({
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request id'),
});
