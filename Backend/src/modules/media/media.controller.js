import multer from 'multer';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import * as mediaService from './media.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';
import { BadRequestError } from '../../common/errors.js';
import { env } from '../../config/env.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPEG, PNG, and WebP images are allowed (max 5 MB)'), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter
}).single('file');

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No image file uploaded');
  }
  const { ownerType = 'asset', ownerId } = req.body;
  const media = await mediaService.saveMediaRecord(req.user, req.file, { ownerType, ownerId: ownerId || req.user?._id });
  res.status(201).json({ data: media });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await mediaService.deleteMediaRecord(req.user, req.params.id, req.scope);
  res.json({ data: result });
});
