import type { IRating } from '../models/index.js';
import type { RatingRow } from '../repositories/rating.repository.js';
import type { RatingDirection } from '../types/enums.js';

export interface RatingDto {
  id: string;
  request: string;
  score: number;
  review?: string;
  direction: RatingDirection;
  createdAt: Date;
}

export function toRatingDto(r: IRating): RatingDto {
  return {
    id: r._id.toString(),
    request: r.request.toString(),
    score: r.score,
    review: r.review,
    direction: r.direction,
    createdAt: r.createdAt,
  };
}

/** A received rating shown on a profile (who rated + what they said). */
export interface ReceivedRatingDto {
  id: string;
  score: number;
  review?: string;
  createdAt: Date;
  rater: { id: string; name: string; avatarUrl?: string };
}

export function toReceivedRatingDto(row: RatingRow): ReceivedRatingDto {
  return {
    id: String(row._id),
    score: row.score,
    review: row.review,
    createdAt: row.createdAt,
    rater: {
      id: row.rater._id.toString(),
      name: row.rater.name,
      avatarUrl: row.rater.avatarUrl,
    },
  };
}

export interface RatingStatusDto {
  canRate: boolean;
  alreadyRated: boolean;
  requestCompleted: boolean;
  ratee?: { id: string; name: string };
}
