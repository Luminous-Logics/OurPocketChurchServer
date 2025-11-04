import { Request, Response, NextFunction } from 'express';
import { WardModel } from '../models/Ward';
import { ParishModel } from '../models/Parish';
import { ParishionerModel } from '../models/Parishioner';
import { WardRoleModel } from '../models/WardRole';
import { RoleModel } from '../models/Role';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class WardController {
  /**
   * Get all wards for a specific parish with pagination
   */
  public static async getByParishId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Verify parish exists
      const parish = await ParishModel.findById(parishId);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      const wards = await WardModel.findByParishId(parishId, page, limit);
      const totalRecords = await WardModel.countByParishId(parishId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: wards,
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

  /**
   * Get ward by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.id);

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      const ward = await WardModel.findById(wardId);

      if (!ward) {
        throw ApiError.notFound('Ward not found');
      }

      res.json({
        success: true,
        data: ward,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search wards by name within a parish
   */
  public static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const searchTerm = req.query.q as string;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      if (!searchTerm) {
        throw ApiError.badRequest('Search term is required');
      }

      const wards = await WardModel.search(parishId, searchTerm);

      res.json({
        success: true,
        data: wards,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new ward (Church Admin only)
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardData = req.body;

      // Verify parish exists
      const parish = await ParishModel.findById(wardData.parish_id);
      if (!parish) {
        throw ApiError.badRequest('Parish not found');
      }

      // If coordinator_id is provided, verify it exists and belongs to the same parish
      if (wardData.coordinator_id) {
        const coordinator = await ParishionerModel.findById(wardData.coordinator_id);
        if (!coordinator) {
          throw ApiError.badRequest('Coordinator (parishioner) not found');
        }
        if (!coordinator.is_active) {
          throw ApiError.badRequest('Coordinator must be an active parishioner');
        }
        if (coordinator.parish_id !== wardData.parish_id) {
          throw ApiError.badRequest('Coordinator must belong to the same parish');
        }
      }

      const ward = await WardModel.create(wardData);

      res.status(201).json({
        success: true,
        message: 'Ward created successfully',
        data: ward,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ward (Church Admin only)
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.id);

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      const updates = req.body;

      // Get existing ward to check parish_id
      const existingWard = await WardModel.findById(wardId);
      if (!existingWard) {
        throw ApiError.notFound('Ward not found');
      }

      // If coordinator_id is being updated, verify it
      if (updates.coordinator_id) {
        const coordinator = await ParishionerModel.findById(updates.coordinator_id);
        if (!coordinator) {
          throw ApiError.badRequest('Coordinator (parishioner) not found');
        }
        if (!coordinator.is_active) {
          throw ApiError.badRequest('Coordinator must be an active parishioner');
        }
        if (coordinator.parish_id !== existingWard.parish_id) {
          throw ApiError.badRequest('Coordinator must belong to the same parish');
        }
      }

      const ward = await WardModel.update(wardId, updates);

      res.json({
        success: true,
        message: 'Ward updated successfully',
        data: ward,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ward (soft delete - Church Admin only)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.id);

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      await WardModel.delete(wardId);

      res.json({
        success: true,
        message: 'Ward deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ward member and family counts (Church Admin only)
   */
  public static async updateCounts(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.id);
      const { total_families, total_members } = req.body;

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      // Verify ward exists
      const ward = await WardModel.findById(wardId);
      if (!ward) {
        throw ApiError.notFound('Ward not found');
      }

      await WardModel.updateCounts(wardId, total_families, total_members);

      res.json({
        success: true,
        message: 'Ward counts updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all wards for a parish (no pagination)
   */
  public static async getAllByParish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const wards = await WardModel.getAllByParish(parishId);

      res.json({
        success: true,
        data: wards,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // WARD ROLES MANAGEMENT
  // =====================================================

  /**
   * Get all roles assigned in a ward
   */
  public static async getWardRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.wardId);

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      // Verify ward exists
      const ward = await WardModel.findById(wardId);
      if (!ward) {
        throw ApiError.notFound('Ward not found');
      }

      const roles = await WardRoleModel.getWardRoles(wardId);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available ward role types
   */
  public static async getWardRoleTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = req.query.parishId ? parseInt(req.query.parishId as string) : undefined;

      const roleTypes = await WardRoleModel.getWardRoleTypes(parishId);

      res.json({
        success: true,
        data: roleTypes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a custom ward role for a parish
   */
  public static async createWardRoleType(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parish_id, role_name, role_code, description, priority } = req.body;

      // Validate required fields
      if (!parish_id || !role_name || !role_code) {
        throw ApiError.badRequest('parish_id, role_name, and role_code are required');
      }

      // Verify parish exists
      const parish = await ParishModel.findById(parish_id);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      // Check if role_code already exists for this parish
      const existingRole = await RoleModel.getRoleByCode(role_code, parish_id);
      if (existingRole) {
        throw ApiError.conflict('A role with this code already exists for this parish');
      }

      // Create the ward role
      const roleData = {
        parish_id,
        role_name,
        role_code,
        description,
        is_system_role: false,
        is_ward_role: true,
        role_scope: 'WARD',
        priority: priority || 25, // Default priority for custom roles
        created_by: req.user?.user_id,
      };

      const role = await RoleModel.createRole(roleData);

      res.status(201).json({
        success: true,
        message: 'Custom ward role created successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign a role to a parishioner in a ward
   */
  public static async assignWardRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.wardId);
      const { parishioner_id, role_id, role_name, expires_at, is_primary, notes } = req.body;

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      if (!parishioner_id || !role_id) {
        throw ApiError.badRequest('parishioner_id and role_id are required');
      }

      // Verify ward exists
      const ward = await WardModel.findById(wardId);
      if (!ward) {
        throw ApiError.notFound('Ward not found');
      }

      // Verify parishioner exists and belongs to the same parish
      const parishioner = await ParishionerModel.findById(parishioner_id);
      if (!parishioner) {
        throw ApiError.notFound('Parishioner not found');
      }

      if (parishioner.parish_id !== ward.parish_id) {
        throw ApiError.badRequest('Parishioner must belong to the same parish as the ward');
      }

      if (!parishioner.is_active) {
        throw ApiError.badRequest('Cannot assign role to inactive parishioner');
      }

      // Verify role exists and is a ward role
      const role = await RoleModel.getRoleById(role_id);
      if (!role) {
        throw ApiError.notFound('Role not found');
      }

      // Optionally verify it's a ward role (if is_ward_role column exists)
      // This is a soft check - parishes can assign any role they want

      const wardRole = await WardRoleModel.assignRole({
        ward_id: wardId,
        parishioner_id,
        role_id,
        role_name: role_name || role.role_name,
        assigned_by: req.user?.user_id,
        expires_at: expires_at ? new Date(expires_at) : undefined,
        is_primary,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Ward role assigned successfully',
        data: wardRole,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a ward role assignment
   */
  public static async updateWardRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardRoleId = parseInt(req.params.wardRoleId);
      const { role_name, is_primary, expires_at, notes, is_active } = req.body;

      if (isNaN(wardRoleId)) {
        throw ApiError.badRequest('Invalid ward role ID');
      }

      const updatedRole = await WardRoleModel.updateWardRole(wardRoleId, {
        role_name,
        is_primary,
        expires_at: expires_at ? new Date(expires_at) : undefined,
        notes,
        is_active,
      });

      res.json({
        success: true,
        message: 'Ward role updated successfully',
        data: updatedRole,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a ward role assignment (soft delete)
   */
  public static async removeWardRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardRoleId = parseInt(req.params.wardRoleId);

      if (isNaN(wardRoleId)) {
        throw ApiError.badRequest('Invalid ward role ID');
      }

      await WardRoleModel.removeRole(wardRoleId);

      res.json({
        success: true,
        message: 'Ward role removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all parishioners with a specific role in a ward
   */
  public static async getWardRoleMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.wardId);
      const roleId = parseInt(req.params.roleId);

      if (isNaN(wardId) || isNaN(roleId)) {
        throw ApiError.badRequest('Invalid ward ID or role ID');
      }

      const members = await WardRoleModel.getByRole(wardId, roleId);

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all ward roles for a specific parishioner
   */
  public static async getParishionerWardRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishionerId = parseInt(req.params.parishionerId);

      if (isNaN(parishionerId)) {
        throw ApiError.badRequest('Invalid parishioner ID');
      }

      const roles = await WardRoleModel.getParishionerWardRoles(parishionerId);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WardController;
