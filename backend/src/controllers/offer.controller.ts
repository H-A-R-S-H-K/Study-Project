import type { Request, Response } from 'express';
import { offerService } from '../services/offer.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';

const principal = (req: Request): { id: string; role: string } => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id, role } = principal(req);
  const offer = await offerService.create(id, role, req.params.requestId, req.body);
  ApiResponse.created(res, offer, 'Offer sent');
});

export const listRequestOffers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const offers = await offerService.listForRequest(id, req.params.requestId);
  ApiResponse.ok(res, offers, `${offers.length} offers`);
});

export const acceptOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const result = await offerService.accept(id, req.params.requestId, req.params.offerId);
  ApiResponse.ok(res, result, 'Offer accepted — chat opened');
});

export const completeRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const request = await offerService.complete(id, req.params.requestId);
  ApiResponse.ok(res, request, 'Job completed');
});

export const listMyOffers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const { items, meta } = await offerService.listMine(id, parsePagination(req.query));
  ApiResponse.ok(res, items, 'OK', meta);
});

export const withdrawOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = principal(req);
  const offer = await offerService.withdraw(id, req.params.id);
  ApiResponse.ok(res, offer, 'Offer withdrawn');
});
