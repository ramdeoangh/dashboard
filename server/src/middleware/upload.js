import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env.js';

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Multer storage: uploads/projects/{folderKey}/before|after/
 * req.projectPhotoFolderKey must be set by middleware (see projects routes).
 */
export function createProjectImageUploader() {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const key = req.projectPhotoFolderKey;
        if (!key) {
          cb(new Error('Missing project upload folder context'));
          return;
        }
        const slot = file.fieldname === 'oldPhoto' ? 'before' : 'after';
        const dest = path.join(env.uploadDir, 'projects', String(key), slot);
        ensureDir(dest);
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.bin';
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safe}`);
      },
    }),
    limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 2 },
    fileFilter: (req, file, cb) => {
      if (allowedMime.has(file.mimetype)) cb(null, true);
      else cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'));
    },
  });
}

export const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(env.uploadDir, 'branding');
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `logo${ext}`);
    },
  }),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMime.has(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid image type'));
  },
});
