/**
 * Centralized error handler middleware.
 * Formats errors uniformly according to the API contract:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable message"
 *   }
 * }
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (
    statusCode === 404 ? 'NOT_FOUND' :
    statusCode === 400 ? 'VALIDATION_ERROR' :
    statusCode === 413 ? 'PAYLOAD_TOO_LARGE' :
    statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' :
    'INTERNAL_SERVER_ERROR'
  );
  const message = err.message || 'An unexpected error occurred';

  // Log error details server-side only (never expose stack trace to client)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${errorCode} (${statusCode}):`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message
    }
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}
