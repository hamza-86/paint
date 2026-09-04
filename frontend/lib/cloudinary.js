/**
 * Cloudinary configuration placeholder.
 *
 * This file sets up the Cloudinary SDK with credentials from environment variables.
 * Upload logic and helper functions will be added in a later phase.
 *
 * Usage (once populated):
 *   import { cloudinary } from '@/lib/cloudinary';
 *   const result = await cloudinary.uploader.upload(filePath, { ... });
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

export { cloudinary };
