/**
 * Cloudinary SDK configuration placeholder — /src/config/cloudinary.js
 *
 * Initialises the Cloudinary v2 SDK with credentials from environment variables.
 * Upload helpers and transformations will be added in a later phase.
 *
 * Usage (once upload helpers are added):
 *   import { cloudinary } from '../config/cloudinary.js';
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

export { cloudinary };
