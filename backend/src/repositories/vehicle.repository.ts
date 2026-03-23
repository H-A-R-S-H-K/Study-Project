import { Vehicle, type IVehicle } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class VehicleRepository extends BaseRepository<IVehicle> {
  constructor() {
    super(Vehicle);
  }

  /** A single active vehicle scoped to its owner (ownership-safe fetch). */
  findOwnedById(id: string, ownerId: string): Promise<IVehicle | null> {
    return this.findOne({ _id: id, owner: ownerId, isActive: true });
  }

  listByOwner(
    ownerId: string,
    opts: { skip: number; limit: number; sort: Record<string, 1 | -1> },
  ): Promise<{ items: IVehicle[]; total: number }> {
    return this.paginate({ owner: ownerId, isActive: true }, opts);
  }

  pushImages(id: string, urls: string[]): Promise<IVehicle | null> {
    return this.model
      .findByIdAndUpdate(id, { $push: { images: { $each: urls } } }, { new: true })
      .exec();
  }
}

export const vehicleRepository = new VehicleRepository();
