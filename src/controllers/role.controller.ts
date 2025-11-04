import { Request, Response, NextFunction } from 'express';
import { RoleModel, PermissionModel, UserRoleModel } from '../models/Role';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class RoleController {
  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================

  /**
   * Get all roles
   */
  public static async getAllRoles(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = req.query.parishId ? parseInt(req.query.parishId as string) : req.user?.parish_id;

      const roles = await RoleModel.getAllRoles(parishId);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   */
  public static async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);

      if (isNaN(roleId)) {
        throw ApiError.badRequest('Invalid role ID');
      }

      const role = await RoleModel.getRoleById(roleId);

      if (!role) {
        throw ApiError.notFound('Role not found');
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions for a role
   */
  public static async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);

      if (isNaN(roleId)) {
        throw ApiError.badRequest('Invalid role ID');
      }

      const permissions = await RoleModel.getRolePermissions(roleId);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new role
   */
  public static async createRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleData = {
        ...req.body,
        created_by: req.user?.user_id,
        parish_id: req.body.parish_id || req.user?.parish_id,
      };

      const role = await RoleModel.createRole(roleData);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role
   */
  public static async updateRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);

      if (isNaN(roleId)) {
        throw ApiError.badRequest('Invalid role ID');
      }

      const existingRole = await RoleModel.getRoleById(roleId);

      if (!existingRole) {
        throw ApiError.notFound('Role not found');
      }

      if (existingRole.is_system_role) {
        throw ApiError.forbidden('Cannot update system roles');
      }

      const updatedRole = await RoleModel.updateRole(roleId, req.body);

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: updatedRole,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete role
   */
  public static async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);

      if (isNaN(roleId)) {
        throw ApiError.badRequest('Invalid role ID');
      }

      const role = await RoleModel.getRoleById(roleId);

      if (!role) {
        throw ApiError.notFound('Role not found');
      }

      if (role.is_system_role) {
        throw ApiError.forbidden('Cannot delete system roles');
      }

      await RoleModel.deleteRole(roleId);

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign permission to role
   */
  public static async assignPermissionToRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);
      const { permission_id } = req.body;

      if (isNaN(roleId) || !permission_id) {
        throw ApiError.badRequest('Invalid role ID or permission ID');
      }

      const rolePermission = await RoleModel.assignPermissionToRole(
        roleId,
        permission_id,
        req.user?.user_id
      );

      res.status(201).json({
        success: true,
        message: 'Permission assigned to role successfully',
        data: rolePermission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove permission from role
   */
  public static async removePermissionFromRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);

      if (isNaN(roleId) || isNaN(permissionId)) {
        throw ApiError.badRequest('Invalid role ID or permission ID');
      }

      await RoleModel.removePermissionFromRole(roleId, permissionId);

      res.json({
        success: true,
        message: 'Permission removed from role successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users with a specific role
   */
  public static async getUsersByRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);

      if (isNaN(roleId)) {
        throw ApiError.badRequest('Invalid role ID');
      }

      const users = await RoleModel.getUsersByRole(roleId);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // PERMISSION MANAGEMENT
  // =====================================================

  /**
   * Get all permissions
   */
  public static async getAllPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await PermissionModel.getAllPermissions();

      // Group by module
      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
      }, {} as Record<string, typeof permissions>);

      res.json({
        success: true,
        data: {
          all: permissions,
          grouped,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions by module
   */
  public static async getPermissionsByModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { module } = req.params;

      const permissions = await PermissionModel.getPermissionsByModule(module);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // USER ROLE MANAGEMENT
  // =====================================================

  /**
   * Get user's roles
   */
  public static async getUserRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        throw ApiError.badRequest('Invalid user ID');
      }

      const roles = await UserRoleModel.getUserRoles(userId);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's roles
   */
  public static async getMyRoles(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const roles = await UserRoleModel.getUserRoles(req.user.user_id);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's permissions
   */
  public static async getUserPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        throw ApiError.badRequest('Invalid user ID');
      }

      const permissions = await PermissionModel.getUserPermissions(userId);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's permissions
   */
  public static async getMyPermissions(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const permissions = await PermissionModel.getUserPermissions(req.user.user_id);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to user
   */
  public static async assignRoleToUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { role_id, expires_at } = req.body;

      if (isNaN(userId) || !role_id) {
        throw ApiError.badRequest('Invalid user ID or role ID');
      }

      // assigned_by should be the user_id of the current user
      const assignedBy = req.user?.user_id;

      const userRole = await UserRoleModel.assignRoleToUser(
        userId,
        role_id,
        assignedBy,
        expires_at ? new Date(expires_at) : undefined
      );

      res.status(201).json({
        success: true,
        message: 'Role assigned to user successfully',
        data: userRole,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove role from user
   */
  public static async removeRoleFromUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);

      if (isNaN(userId) || isNaN(roleId)) {
        throw ApiError.badRequest('Invalid user ID or role ID');
      }

      await UserRoleModel.removeRoleFromUser(userId, roleId);

      res.json({
        success: true,
        message: 'Role removed from user successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Grant direct permission to user
   */
  public static async grantPermissionToUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { permission_id, reason, expires_at } = req.body;

      if (isNaN(userId) || !permission_id) {
        throw ApiError.badRequest('Invalid user ID or permission ID');
      }

      const userPermission = await UserRoleModel.grantPermissionToUser(
        userId,
        permission_id,
        req.user?.user_id,
        reason,
        expires_at ? new Date(expires_at) : undefined
      );

      res.status(201).json({
        success: true,
        message: 'Permission granted to user successfully',
        data: userPermission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke permission from user
   */
  public static async revokePermissionFromUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { permission_id, reason } = req.body;

      if (isNaN(userId) || !permission_id) {
        throw ApiError.badRequest('Invalid user ID or permission ID');
      }

      await UserRoleModel.revokePermissionFromUser(
        userId,
        permission_id,
        req.user?.user_id,
        reason
      );

      res.json({
        success: true,
        message: 'Permission revoked from user successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has specific permission
   */
  public static async checkUserPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { permission_code } = req.query;

      if (isNaN(userId) || !permission_code) {
        throw ApiError.badRequest('Invalid user ID or permission code');
      }

      const hasPermission = await PermissionModel.userHasPermission(userId, permission_code as string);

      res.json({
        success: true,
        data: {
          user_id: userId,
          permission_code,
          has_permission: hasPermission,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // USER MANAGEMENT BY PARISH
  // =====================================================

  /**
   * Get all users under a specific parish
   * Includes both church admins and parishioners
   */
  public static async getUsersByParish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const users = await UserModel.findByParishId(parishId, page, limit);
      const totalRecords = await UserModel.countByParishId(parishId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalRecords,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RoleController;
