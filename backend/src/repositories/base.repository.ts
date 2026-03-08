import type {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  Types,
} from 'mongoose';

/**
 * Generic data-access base. Every concrete repository extends this so that all
 * Mongoose calls live behind a narrow, testable interface. Services depend on
 * repositories, never on Mongoose directly — swapping the persistence layer or
 * faking it in tests requires no change above this line.
 */
export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  create(data: Partial<T>): Promise<T> {
    return this.model.create(data) as unknown as Promise<T>;
  }

  findById(id: string | Types.ObjectId, projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findById(id, projection).exec();
  }

  findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findOne(filter, projection).exec();
  }

  find(
    filter: FilterQuery<T>,
    options?: QueryOptions<T>,
    projection?: ProjectionType<T>,
  ): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  updateById(id: string | Types.ObjectId, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }

  deleteById(id: string | Types.ObjectId): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /** Cursor-friendly paginated fetch returning items + total for meta. */
  async paginate(
    filter: FilterQuery<T>,
    { skip, limit, sort }: { skip: number; limit: number; sort: Record<string, 1 | -1> },
    projection?: ProjectionType<T>,
  ): Promise<{ items: T[]; total: number }> {
    const [items, total] = await Promise.all([
      this.model.find(filter, projection).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}
