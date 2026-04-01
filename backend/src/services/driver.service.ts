import { driverRepository } from '../repositories/driver.repository.js';
import { documentService } from './document.service.js';
import { toDriverProfileDto, type DriverProfileDto } from '../dtos/driver.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { DocumentType, type VehicleType } from '../types/enums.js';
import type { UploadedFile } from './storage.service.js';
import type { GeoPoint } from '../models/geo.schema.js';

export interface UpsertDriverInput {
  licenseNumber: string;
  experienceYears: number;
  vehicleCategories: VehicleType[];
  bio?: string;
  location?: GeoPoint;
}

/**
 * Manages the driver-role profile (1:1 with the User). The profile is created
 * lazily via upsert the first time a driver saves it, then patched thereafter.
 */
class DriverService {
  async getMine(userId: string): Promise<DriverProfileDto | null> {
    const profile = await driverRepository.findByUser(userId);
    return profile ? toDriverProfileDto(profile) : null;
  }

  async upsertMine(userId: string, input: UpsertDriverInput): Promise<DriverProfileDto> {
    const profile = await driverRepository.upsertByUser(userId, input);
    return toDriverProfileDto(profile!);
  }

  async setAvailability(userId: string, isAvailable: boolean): Promise<DriverProfileDto> {
    const profile = await this.requireProfile(userId);
    const updated = await driverRepository.updateById(profile.id, { isAvailable });
    return toDriverProfileDto(updated!);
  }

  async updateLocation(userId: string, location: GeoPoint): Promise<DriverProfileDto> {
    const profile = await this.requireProfile(userId);
    const updated = await driverRepository.updateById(profile.id, { location });
    return toDriverProfileDto(updated!);
  }

  async uploadLicense(
    userId: string,
    file: UploadedFile,
    licenseNumber?: string,
  ): Promise<DriverProfileDto> {
    const profile = await this.requireProfile(userId);
    const doc = await documentService.createFromUpload(
      userId,
      DocumentType.DRIVING_LICENSE,
      file,
      licenseNumber ?? profile.licenseNumber,
    );
    const updated = await driverRepository.updateById(profile.id, {
      licenseDocument: doc._id,
      licenseVerified: false, // awaits admin re-verification
    });
    return toDriverProfileDto(updated!);
  }

  private async requireProfile(userId: string): Promise<DriverProfileDto> {
    const profile = await this.getMine(userId);
    if (!profile) throw ApiError.badRequest('Create your driver profile first');
    return profile;
  }
}

export const driverService = new DriverService();
