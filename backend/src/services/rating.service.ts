import { Types } from 'mongoose';
import { ratingRepository } from '../repositories/rating.repository.js';
import { requestRepository } from '../repositories/request.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import {
  toRatingDto,
  toReceivedRatingDto,
  type RatingDto,
  type ReceivedRatingDto,
  type RatingStatusDto,
} from '../dtos/rating.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, type PaginationOptions } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import { RatingDirection, RequestStatus } from '../types/enums.js';
import type { IRequest } from '../models/index.js';

export interface RateInput {
  score: number;
  review?: string;
}

interface Counterpart {
  rateeId: string;
  direction: RatingDirection;
}

/**
 * Post-completion ratings, both directions. A completed request has exactly two
 * parties (customer + matched provider); each may rate the other once. Writing a
 * rating folds it into the ratee's denormalised summary so list/profile screens
 * never aggregate on read.
 */
class RatingService {
  async rate(raterId: string, requestId: string, input: RateInput): Promise<RatingDto> {
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.status !== RequestStatus.COMPLETED) {
      throw ApiError.conflict('You can only rate a completed job');
    }

    const { rateeId, direction } = this.resolveCounterpart(request, raterId);

    const existing = await ratingRepository.findByRequestAndRater(requestId, raterId);
    if (existing) throw ApiError.conflict('You have already rated this job');

    const rating = await ratingRepository.create({
      request: new Types.ObjectId(requestId),
      rater: new Types.ObjectId(raterId),
      ratee: new Types.ObjectId(rateeId),
      direction,
      score: input.score,
      review: input.review,
    });

    // Fold into the ratee's summary (atomic pipeline update).
    await userRepository.applyRating(rateeId, input.score);
    return toRatingDto(rating);
  }

  async status(raterId: string, requestId: string): Promise<RatingStatusDto> {
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');

    const requestCompleted = request.status === RequestStatus.COMPLETED;
    let ratee: { id: string; name: string } | undefined;
    let isParty = false;
    try {
      const { rateeId } = this.resolveCounterpart(request, raterId);
      isParty = true;
      const user = await userRepository.findById(rateeId, { name: 1 });
      if (user) ratee = { id: rateeId, name: user.name };
    } catch {
      isParty = false;
    }

    const already = isParty
      ? Boolean(await ratingRepository.findByRequestAndRater(requestId, raterId))
      : false;

    return {
      requestCompleted,
      alreadyRated: already,
      canRate: requestCompleted && isParty && !already,
      ratee,
    };
  }

  async listReceived(
    userId: string,
    page: PaginationOptions,
  ): Promise<{ items: ReceivedRatingDto[]; meta: PaginationMeta }> {
    const [rows, total] = await Promise.all([
      ratingRepository.listForRatee(userId, page),
      ratingRepository.countForRatee(userId),
    ]);
    return {
      items: rows.map(toReceivedRatingDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  /** Given a rater, find the other party and the rating direction. */
  private resolveCounterpart(request: IRequest, raterId: string): Counterpart {
    const customerId = request.customer.toString();
    const providerId = request.selectedProvider?.toString();
    if (!providerId) throw ApiError.conflict('This request has no matched provider');

    if (raterId === customerId) {
      return { rateeId: providerId, direction: RatingDirection.CUSTOMER_TO_PROVIDER };
    }
    if (raterId === providerId) {
      return { rateeId: customerId, direction: RatingDirection.PROVIDER_TO_CUSTOMER };
    }
    throw ApiError.forbidden('Only the two parties of this job can rate it');
  }
}

export const ratingService = new RatingService();
