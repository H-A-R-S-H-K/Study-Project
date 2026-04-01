import type { Types } from 'mongoose';

export type { GeoPoint } from '../models/geo.schema.js';

/** The provider (owner/driver) fields joined into a nearby-search result. */
export interface NearbyProviderUser {
  _id: Types.ObjectId;
  name: string;
  avatarUrl?: string;
  phone: string;
  ratingSummary: { average: number; count: number };
}
