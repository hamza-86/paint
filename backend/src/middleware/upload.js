import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'), false);
  }
};

const billFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents (and JPEG/PNG/WebP images) are allowed for bill uploads.'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
});

export const uploadBillFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for PDF bills
  },
  fileFilter: billFileFilter,
});

/**
 * Upload a memory buffer to Cloudinary using upload_stream.
 * Returns the secure_url string.
 */
export const uploadToCloudinary = (buffer, folder = 'paint_shop', resourceType = 'auto', mimetype = 'image/png') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is unconfigured or in placeholder mode in dev/test, return placeholder data URI
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === 'placeholder' || cloudName === 'test') {
      const base64 = buffer.toString('base64');
      return resolve(`data:${mimetype};base64,${base64}`);
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result?.secure_url || result?.url || '');
      }
    );

    stream.end(buffer);
  });
};
