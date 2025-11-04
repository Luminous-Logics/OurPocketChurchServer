export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  public static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  public static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  public static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  public static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  public static unprocessableEntity(message: string): ApiError {
    return new ApiError(422, message);
  }

  public static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }
}

export default ApiError;
