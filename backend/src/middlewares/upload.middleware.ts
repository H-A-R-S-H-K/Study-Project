import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

/**
 * Multer configured for in-memory buffers (the storage service then streams them
 * to Cloudinary/disk). We cap size and whitelist mime types here so malformed or
 * oversized uploads are rejected before any handler runs — a secure-upload
 * requirement.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOC_TYPES = [...IMAGE_TYPES, 'application/pdf'];

function makeUploader(allowed: string[]) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (allowed.includes(file.mimetype)) return cb(null, true);
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    },
  });
}

/** Up to 8 vehicle images per request, field name "images". */
export const uploadImages = makeUploader(IMAGE_TYPES).array('images', 8);

/** A single verification document (image or PDF), field name "document". */
export const uploadDocument = makeUploader(DOC_TYPES).single('document');

/** A single avatar image, field name "avatar". */
export const uploadAvatar = makeUploader(IMAGE_TYPES).single('avatar');
