import { Response, NextFunction } from 'express';
import { IAuthRequest, UserType } from '../types';
import { JwtUtil } from '../utils/jwt';
import { ApiError } from '../utils/apiError';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = (req: IAuthRequest, _res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JwtUtil.verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

/**
 * Middleware to check if user has specific user type
 */
export const authorize = (...allowedUserTypes: UserType[]) => {
  return (req: IAuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!allowedUserTypes.includes(req.user.user_type)) {
        throw ApiError.forbidden('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  authorize(UserType.SUPER_ADMIN)(req, _res, next);
};

/**
 * Middleware to check if user is church admin or super admin
 */
export const requireChurchAdmin = (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  authorize(UserType.SUPER_ADMIN, UserType.CHURCH_ADMIN)(req, _res, next);
};

/**
 * Middleware to check if user belongs to the same parish
 */
export const requireSameParish = (req: IAuthRequest, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Super admins can access all parishes
    if (req.user.user_type === UserType.SUPER_ADMIN) {
      return next();
    }

    const parishId = parseInt(req.params.parish_id || req.body.parish_id, 10);

    if (!parishId) {
      throw ApiError.badRequest('Parish ID is required');
    }

    if (req.user.parish_id !== parishId) {
      throw ApiError.forbidden('You can only access data from your own parish');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req: IAuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JwtUtil.verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};
