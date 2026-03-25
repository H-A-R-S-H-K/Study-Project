import type { IDriver } from '../models/index.js';
import type { VehicleType } from '../types/enums.js';

export interface DriverProfileDto {
  id: string;
  user: string;
  licenseNumber: string;
  licenseVerified: boolean;
  experienceYears: number;
  vehicleCategories: VehicleType[];
  bio?: string;
  isAvailable: boolean;
  createdAt: Date;
}

export function toDriverProfileDto(d: IDriver): DriverProfileDto {
  return {
    id: d._id.toString(),
    user: d.user.toString(),
    licenseNumber: d.licenseNumber,
    licenseVerified: d.licenseVerified,
    experienceYears: d.experienceYears,
    vehicleCategories: d.vehicleCategories,
    bio: d.bio,
    isAvailable: d.isAvailable,
    createdAt: d.createdAt,
  };
}
