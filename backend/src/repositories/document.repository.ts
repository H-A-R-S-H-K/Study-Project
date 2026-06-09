import { DocumentModel, type IDocument } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class DocumentRepository extends BaseRepository<IDocument> {
  constructor() {
    super(DocumentModel);
  }

  listByOwner(ownerId: string): Promise<IDocument[]> {
    return this.find({ owner: ownerId }, { sort: { createdAt: -1 } });
  }

  /** Admin verification queue: filter by status, oldest first. */
  queue(
    status: string | undefined,
    opts: { skip: number; limit: number },
  ): Promise<{ items: IDocument[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.paginate(filter, { ...opts, sort: { createdAt: 1 } });
  }
}

export const documentRepository = new DocumentRepository();
