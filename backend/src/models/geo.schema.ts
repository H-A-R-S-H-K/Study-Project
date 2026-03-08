import { Schema } from 'mongoose';

/**
 * GeoJSON Point, stored so MongoDB `2dsphere` indexes can answer
 * "$near" / "$geoWithin" queries directly — that is how the app finds
 * nearby providers and nearby requests without any client-side distance math.
 *
 * IMPORTANT: GeoJSON coordinate order is [longitude, latitude].
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export const PointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]): boolean =>
          Array.isArray(v) &&
          v.length === 2 &&
          v[0] >= -180 &&
          v[0] <= 180 && // lng
          v[1] >= -90 &&
          v[1] <= 90, // lat
        message: 'coordinates must be [longitude, latitude] within valid ranges',
      },
    },
  },
  { _id: false },
);

/** Human-readable address attached to a coordinate. */
export interface Place {
  address: string;
  location: GeoPoint;
}

export const PlaceSchema = new Schema<Place>(
  {
    address: { type: String, required: true, trim: true, maxlength: 300 },
    location: { type: PointSchema, required: true },
  },
  { _id: false },
);
