import { Types } from 'mongoose';
import { documentRepository } from '../repositories/document.repository.js';
import { storageService, type UploadedFile } from './storage.service.js';
import { toDocumentDto, type DocumentDto } from '../dtos/document.dto.js';
import { DocumentType, VerificationStatus } from '../types/enums.js';
import type { IDocument } from '../models/index.js';

/**
 * Uploads a verification file and records a Document in "pending" state. Admins
 * verify it later (Phase 10). Returns the raw doc for callers that need the id
 * (vehicle/driver services link it), and a DTO helper for HTTP responses.
 */
class DocumentService {
  async createFromUpload(
    ownerId: string,
    type: DocumentType,
    file: UploadedFile,
    number?: string,
  ): Promise<IDocument> {
    const folder = type === DocumentType.DRIVING_LICENSE ? 'licenses' : 'registrations';
    const asset = await storageService.upload(file, folder);

    return documentRepository.create({
      owner: new Types.ObjectId(ownerId),
      type,
      fileUrl: asset.url,
      publicId: asset.publicId,
      number,
      status: VerificationStatus.PENDING,
    });
  }

  async listMine(ownerId: string): Promise<DocumentDto[]> {
    const docs = await documentRepository.listByOwner(ownerId);
    return docs.map(toDocumentDto);
  }
}

export const documentService = new DocumentService();
