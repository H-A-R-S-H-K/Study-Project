import type { IDocument, IUser } from '../models/index.js';
import type { DocumentType, VerificationStatus } from '../types/enums.js';

export interface AdminStatsDto {
  users: { total: number; customers: number; vehicleOwners: number; drivers: number; suspended: number };
  requests: { total: number; open: number; matched: number; completed: number; cancelled: number };
  offers: { total: number };
  vehicles: { total: number };
  documents: { pending: number };
}

/** A verification-queue row: the document plus who submitted it. */
export interface AdminDocumentDto {
  id: string;
  type: DocumentType;
  fileUrl: string;
  number?: string;
  status: VerificationStatus;
  createdAt: Date;
  owner: { id: string; name: string; phone: string; role: string };
}

export function toAdminDocumentDto(
  doc: IDocument,
  owner: Pick<IUser, '_id' | 'name' | 'phone' | 'role'> | undefined,
): AdminDocumentDto {
  return {
    id: doc._id.toString(),
    type: doc.type,
    fileUrl: doc.fileUrl,
    number: doc.number,
    status: doc.status,
    createdAt: doc.createdAt,
    owner: owner
      ? { id: owner._id.toString(), name: owner.name, phone: owner.phone, role: owner.role }
      : { id: doc.owner.toString(), name: 'Unknown', phone: '', role: '' },
  };
}
