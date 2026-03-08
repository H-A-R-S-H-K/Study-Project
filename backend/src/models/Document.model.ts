import { Schema, model, type Document as MongoDocument, type Types } from 'mongoose';
import { DocumentType, VerificationStatus, values } from '../types/enums.js';

/**
 * A KYC / verification artefact uploaded by a provider — a driving licence or a
 * vehicle registration certificate. Stored on Cloudinary (`fileUrl`); admins
 * verify it from the dashboard (Phase 10), which flips `status` and cascades to
 * the owning Driver/Vehicle's `*Verified` flag.
 */
export interface IDocument extends MongoDocument {
  _id: Types.ObjectId;
  owner: Types.ObjectId; // ref User
  type: DocumentType;
  fileUrl: string;
  publicId?: string; // Cloudinary public_id, for deletion
  number?: string; // licence/registration number as printed
  status: VerificationStatus;
  reviewedBy?: Types.ObjectId; // ref User (admin)
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: values(DocumentType), required: true },
    fileUrl: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    number: { type: String, trim: true, uppercase: true, maxlength: 40 },
    status: {
      type: String,
      enum: values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

// Admin verification queue: pending documents oldest-first.
DocumentSchema.index({ status: 1, createdAt: 1 });

export const DocumentModel = model<IDocument>('Document', DocumentSchema);
