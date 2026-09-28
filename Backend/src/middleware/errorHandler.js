import { AppError } from '../common/errors.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';
  const details = err.details || [];
  const requestId = req.id || null;

  if (statusCode >= 500) {
    console.error(`💥 [${requestId}] Server Error:`, err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId
    }
  });
};
