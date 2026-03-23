import type { IVehicle } from '../models/index.js';
import type { VehicleType } from '../types/enums.js';
import type { GeoPoint } from '../models/geo.schema.js';

export interface VehicleDto {
  id: string;
  owner: string;
  type: VehicleType;
  title: string;
  make?: string;
  modelName?: string;
  year?: number;
  color?: string;
  registrationNumber: string;
  capacity?: number;
  images: string[];
  verifiedRegistration: boolean;
  isAvailable: boolean;
  location?: GeoPoint;
  createdAt: Date;
}

export function toVehicleDto(v: IVehicle): VehicleDto {
  return {
    id: v._id.toString(),
    owner: v.owner.toString(),
    type: v.type,
    title: v.title,
    make: v.make,
    modelName: v.modelName,
    year: v.year,
    color: v.color,
    registrationNumber: v.registrationNumber,
    capacity: v.capacity,
    images: v.images,
    verifiedRegistration: v.verifiedRegistration,
    isAvailable: v.isAvailable,
    location: v.location,
    createdAt: v.createdAt,
  };
}
