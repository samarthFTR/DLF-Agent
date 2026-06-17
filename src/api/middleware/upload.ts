import multer from 'multer';
import { AppError } from '../../utils/errors.js';

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new AppError(400, 'BAD_REQUEST', 'Unsupported image type'));
      return;
    }

    callback(null, true);
  },
});

