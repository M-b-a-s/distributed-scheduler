/**
 * Custom error classes for different error types
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = null) {
    super(message, 401, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = null) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details = null) {
    super(message, 409, details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, details);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details = null) {
    super(message, 500, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable', details = null) {
    super(message, 503, details);
  }
}

/**
 * Error handler middleware
 * Handles 400 (client) and 500 (server) errors appropriately
 */
function errorHandler(err, req, res, next) {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, err.stack || err.message);

  // Determine if this is an operational error (expected) or programming error (unexpected)
  const isOperational = err.isOperational !== undefined ? err.isOperational : false;

  // Get status code
  const statusCode = err.statusCode || err.status || 500;

  // Determine error type for response formatting
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;

  // Base response object
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      statusCode: statusCode,
    }
  };

  // Handle client errors (4xx)
  if (isClientError) {
    // For client errors, we can provide more details
    if (err.details) {
      errorResponse.error.details = err.details;
    }

    // Include error type if available
    if (err.name && err.name !== 'Error') {
      errorResponse.error.type = err.name;
    }

    // Handle specific client error types
    if (statusCode === 400) {
      errorResponse.error.message = err.message || 'Bad Request - Invalid input data';
    } else if (statusCode === 401) {
      errorResponse.error.message = err.message || 'Unauthorized - Authentication required';
    } else if (statusCode === 403) {
      errorResponse.error.message = err.message || 'Forbidden - Insufficient permissions';
    } else if (statusCode === 404) {
      errorResponse.error.message = err.message || 'Not Found - Resource does not exist';
    } else if (statusCode === 409) {
      errorResponse.error.message = err.message || 'Conflict - Resource already exists';
    } else if (statusCode === 422) {
      errorResponse.error.message = err.message || 'Validation Failed - Invalid data provided';
    }
  }

  // Handle server errors (5xx)
  if (isServerError) {
    // For server errors, hide internal details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // Include stack trace and details in development
      errorResponse.error.stack = err.stack;
      if (err.details) {
        errorResponse.error.details = err.details;
      }
    } else {
      // In production, hide internal error details
      errorResponse.error.message = 'Internal Server Error - Please try again later';
      delete errorResponse.error.details;
    }

    // Log additional server error information
    console.error(`Server Error [${statusCode}]:`, {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  }

  // Handle specific error types
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    // JSON parsing error
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid JSON in request body',
        statusCode: 400,
        type: 'SyntaxError'
      }
    });
  }

  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation error
    const validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: validationErrors
      }
    });
  }

  if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid ${err.path}: ${err.value}`,
        statusCode: 400,
        type: 'CastError'
      }
    });
  }

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        message: `Duplicate value for ${field}. This ${field} already exists.`,
        statusCode: 409,
        type: 'DuplicateKeyError'
      }
    });
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Cannot find ${req.method} ${req.originalUrl} on this server`);
  next(error);
}

/**
 * Async handler wrapper to catch async errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
  notFoundHandler,
  asyncHandler
};
