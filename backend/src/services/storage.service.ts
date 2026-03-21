import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomToken } from '../utils/crypto.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { logger } from '../config/logger.js';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface StoredAsset {
  url: string;
  publicId: string;
}

/**
 * Abstracts file storage behind one interface with two backends chosen at
 * runtime: Cloudinary in production, local disk in dev (so the whole
 * upload flow is exercisable without cloud credentials). Callers — the vehicle,
 * driver and document services — never know which backend is active.
 */
class StorageService {
  private readonly localDir = path.resolve(process.cwd(), 'uploads');

  async upload(file: UploadedFile, folder: string): Promise<StoredAsset> {
    return isCloudinaryConfigured
      ? this.uploadToCloudinary(file, folder)
      : this.uploadToDisk(file, folder);
  }

  async remove(publicId: string): Promise<void> {
    try {
      if (isCloudinaryConfigured) {
        await cloudinary.uploader.destroy(publicId);
      } else {
        await fs.rm(path.resolve(this.localDir, publicId), { force: true });
      }
    } catch (err) {
      // Deleting an asset must never fail the request that triggered it.
      logger.warn({ err, publicId }, 'Failed to remove stored asset');
    }
  }

  private uploadToCloudinary(file: UploadedFile, folder: string): Promise<StoredAsset> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `vtc/${folder}`, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  private async uploadToDisk(file: UploadedFile, folder: string): Promise<StoredAsset> {
    const dir = path.resolve(this.localDir, folder);
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${randomToken(8)}${ext}`;
    const relative = path.join(folder, name);
    await fs.writeFile(path.resolve(this.localDir, relative), file.buffer);
    // Served statically at /uploads (see app.ts). publicId is the relative path.
    return { url: `/uploads/${relative}`, publicId: relative };
  }
}

export const storageService = new StorageService();
