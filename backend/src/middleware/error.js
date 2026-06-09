import { logger } from '../lib/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
}
