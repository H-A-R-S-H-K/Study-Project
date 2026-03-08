import { Schema, model, type Document, type Types } from 'mongoose';
import { RatingDirection, values } from '../types/enums.js';

/**
 * A rating left after a completed request. Both sides rate each other, so
 * `direction` distinguishes customer→provider from provider→customer. A pair of
 * (request, rater) is unique — you can rate a given job once. Writing a rating
 * updates the ratee's denormalised `ratingSummary` on the User document.
 */
export interface IRating extends Document {
  _id: Types.ObjectId;
  request: Types.ObjectId; // ref Request
  rater: Types.ObjectId; // ref User (who is rating)
  ratee: Types.ObjectId; // ref User (being rated)
  direction: RatingDirection;
  score: number; // 1..5
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    request: { type: Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
    rater: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ratee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    direction: { type: String, enum: values(RatingDirection), required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

// One rating per rater per request.
RatingSchema.index({ request: 1, rater: 1 }, { unique: true });
// A user's received ratings, newest first.
RatingSchema.index({ ratee: 1, createdAt: -1 });

export const Rating = model<IRating>('Rating', RatingSchema);
