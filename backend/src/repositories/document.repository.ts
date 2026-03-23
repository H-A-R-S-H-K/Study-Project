import { DocumentModel, type IDocument } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class DocumentRepository extends BaseRepository<IDocument> {
  constructor() {
    super(DocumentModel);
  }

  listByOwner(ownerId: string): Promise<IDocument[]> {
    return this.find({ owner: ownerId }, { sort: { createdAt: -1 } });
  }
}

export const documentRepository = new DocumentRepository();
