import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { PermissionModel } from '../models/Role';
import { ApiError } from '../utils/apiError';

/**
 * Middleware to check if user has required permission
 * @param permissionCode - The permission code to check (e.g., 'events.create')
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      // Church admins always have all permissions
      if (req.user.is_church_admin) {
        return next();
      }

      const hasPermission = await PermissionModel.userHasPermission(
        req.user.user_id,
        permissionCode
      );

      if (!hasPermission) {
        throw ApiError.forbidden(`Permission denied: ${permissionCode}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ANY of the required permissions
 * @param permissionCodes - Array of permission codes
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      // Church admins always have all permissions
      if (req.user.is_church_admin) {
        return next();
      }

      // Check if user has at least one of the permissions
      for (const permissionCode of permissionCodes) {
        const hasPermission = await PermissionModel.userHasPermission(
          req.user.user_id,
          permissionCode
        );

        if (hasPermission) {
          return next();
        }
      }

      throw ApiError.forbidden(`Permission denied. Required one of: ${permissionCodes.join(', ')}`);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ALL of the required permissions
 * @param permissionCodes - Array of permission codes
 */
export const requireAllPermissions = (permissionCodes: string[]) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      // Church admins always have all permissions
      if (req.user.is_church_admin) {
        return next();
      }

      // Check if user has all permissions
      for (const permissionCode of permissionCodes) {
        const hasPermission = await PermissionModel.userHasPermission(
          req.user.user_id,
          permissionCode
        );

        if (!hasPermission) {
          throw ApiError.forbidden(`Permission denied: ${permissionCode}`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Attach user's permissions to request object
 * Useful for checking permissions in controllers
 */
export const attachUserPermissions = async (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      // Church admins have all permissions
      if (req.user.is_church_admin) {
        req.user.permissions = await PermissionModel.getAllPermissions();
      } else {
        req.user.permissions = await PermissionModel.getUserPermissions(req.user.user_id);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to check permission in controllers
 * Can be used when you need to check permission conditionally
 */
export const checkPermission = async (userId: number, permissionCode: string): Promise<boolean> => {
  return await PermissionModel.userHasPermission(userId, permissionCode);
};

/**
 * Helper function to check multiple permissions
 */
export const checkPermissions = async (
  userId: number,
  permissionCodes: string[]
): Promise<Record<string, boolean>> => {
  const results: Record<string, boolean> = {};

  for (const code of permissionCodes) {
    results[code] = await PermissionModel.userHasPermission(userId, code);
  }

  return results;
};

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  attachUserPermissions,
  checkPermission,
  checkPermissions,
};
