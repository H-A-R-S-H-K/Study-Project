import type { IDocument } from '../models/index.js';
import type { DocumentType, VerificationStatus } from '../types/enums.js';

export interface DocumentDto {
  id: string;
  owner: string;
  type: DocumentType;
  fileUrl: string;
  number?: string;
  status: VerificationStatus;
  rejectionReason?: string;
  createdAt: Date;
}

export function toDocumentDto(d: IDocument): DocumentDto {
  return {
    id: d._id.toString(),
    owner: d.owner.toString(),
    type: d.type,
    fileUrl: d.fileUrl,
    number: d.number,
    status: d.status,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt,
  };
}
