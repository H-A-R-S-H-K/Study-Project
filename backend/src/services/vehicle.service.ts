import { Types } from 'mongoose';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { documentService } from './document.service.js';
import { storageService, type UploadedFile } from './storage.service.js';
import { toVehicleDto, type VehicleDto } from '../dtos/vehicle.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta } from '../utils/pagination.js';
import type { PaginationOptions } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import { DocumentType, type VehicleType } from '../types/enums.js';
import type { GeoPoint } from '../models/geo.schema.js';

export interface CreateVehicleInput {
  type: VehicleType;
  title: string;
  registrationNumber: string;
  make?: string;
  modelName?: string;
  year?: number;
  color?: string;
  capacity?: number;
  location?: GeoPoint;
}

const MAX_IMAGES = 8;

/**
 * Owns vehicle lifecycle for a vehicle-owner. Every mutating method is
 * ownership-scoped: a vehicle is only ever fetched via `findOwnedById`, so one
 * owner can never read or mutate another's vehicle.
 */
class VehicleService {
  async create(ownerId: string, input: CreateVehicleInput): Promise<VehicleDto> {
    const vehicle = await vehicleRepository.create({
      owner: new Types.ObjectId(ownerId),
      ...input,
    });
    return toVehicleDto(vehicle);
  }

  async listMine(
    ownerId: string,
    page: PaginationOptions,
  ): Promise<{ items: VehicleDto[]; meta: PaginationMeta }> {
    const { items, total } = await vehicleRepository.listByOwner(ownerId, page);
    return {
      items: items.map(toVehicleDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  async getOwned(ownerId: string, vehicleId: string): Promise<VehicleDto> {
    return toVehicleDto(await this.requireOwned(ownerId, vehicleId));
  }

  async update(
    ownerId: string,
    vehicleId: string,
    patch: Partial<CreateVehicleInput>,
  ): Promise<VehicleDto> {
    await this.requireOwned(ownerId, vehicleId);
    const updated = await vehicleRepository.updateById(vehicleId, patch);
    return toVehicleDto(updated!);
  }

  async setAvailability(
    ownerId: string,
    vehicleId: string,
    isAvailable: boolean,
  ): Promise<VehicleDto> {
    await this.requireOwned(ownerId, vehicleId);
    const updated = await vehicleRepository.updateById(vehicleId, { isAvailable });
    return toVehicleDto(updated!);
  }

  /** Soft delete — keeps history/offers intact. */
  async remove(ownerId: string, vehicleId: string): Promise<void> {
    await this.requireOwned(ownerId, vehicleId);
    await vehicleRepository.updateById(vehicleId, { isActive: false, isAvailable: false });
  }

  async addImages(
    ownerId: string,
    vehicleId: string,
    files: UploadedFile[],
  ): Promise<VehicleDto> {
    const vehicle = await this.requireOwned(ownerId, vehicleId);
    if (vehicle.images.length + files.length > MAX_IMAGES) {
      throw ApiError.badRequest(`A vehicle can have at most ${MAX_IMAGES} images`);
    }
    const uploaded = await Promise.all(files.map((f) => storageService.upload(f, 'vehicles')));
    const updated = await vehicleRepository.pushImages(
      vehicleId,
      uploaded.map((a) => a.url),
    );
    return toVehicleDto(updated!);
  }

  async uploadRegistration(
    ownerId: string,
    vehicleId: string,
    file: UploadedFile,
    number?: string,
  ): Promise<VehicleDto> {
    const vehicle = await this.requireOwned(ownerId, vehicleId);
    const doc = await documentService.createFromUpload(
      ownerId,
      DocumentType.VEHICLE_REGISTRATION,
      file,
      number ?? vehicle.registrationNumber,
    );
    const updated = await vehicleRepository.updateById(vehicleId, {
      registrationDocument: doc._id,
      verifiedRegistration: false, // reset — awaits admin re-verification
    });
    return toVehicleDto(updated!);
  }

  private async requireOwned(ownerId: string, vehicleId: string) {
    const vehicle = await vehicleRepository.findOwnedById(vehicleId, ownerId);
    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    return vehicle;
  }
}

export const vehicleService = new VehicleService();
