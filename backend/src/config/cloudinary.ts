import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * Cloudinary is configured only when credentials are present. When they're
 * absent (local dev), the storage service falls back to disk — see
 * storage.service.ts. This flag lets the rest of the code ask "is Cloudinary
 * available?" without inspecting env vars everywhere.
 */
export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };
