/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { ParishionerModel } from '../models/Parishioner';
import { ParishModel } from '../models/Parish';
import { WardModel } from '../models/Ward';
import { FamilyModel } from '../models/Family';
import { UserModel } from '../models/User';
import { RoleModel, UserRoleModel } from '../models/Role';
import { ApiError } from '../utils/apiError';
import { IAuthRequest, UserType } from '../types';
import { SYSTEM_ROLES } from '../constants/roles';
import { PasswordUtil } from '../utils/password';
import logger from '../utils/logger';

export class ParishionerController {
  /**
   * Get all parishioners for a specific parish with pagination
   */
  public static async getByParishId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      const parishioners = await ParishionerModel.findByParishId(parishId, page, limit);
      const totalRecords = await ParishionerModel.countByParishId(parishId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: parishioners,
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
   * Get all parishioners for a specific ward with pagination
   */
  public static async getByWardId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wardId = parseInt(req.params.wardId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(wardId)) {
        throw ApiError.badRequest('Invalid ward ID');
      }

      // Verify ward exists
      const ward = await WardModel.findById(wardId);
      if (!ward) {
        throw ApiError.notFound('Ward not found');
      }

      const parishioners = await ParishionerModel.findByWardId(wardId, page, limit);
      const totalRecords = await ParishionerModel.countByWardId(wardId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: parishioners,
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
   * Get all parishioners for a specific family
   */
  public static async getByFamilyId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const familyId = parseInt(req.params.familyId);

      if (isNaN(familyId)) {
        throw ApiError.badRequest('Invalid family ID');
      }

      // Verify family exists
      const family = await FamilyModel.findById(familyId);
      if (!family) {
        throw ApiError.notFound('Family not found');
      }

      const parishioners = await ParishionerModel.findByFamilyId(familyId);

      res.json({
        success: true,
        data: parishioners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get parishioner by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishionerId = parseInt(req.params.id);

      if (isNaN(parishionerId)) {
        throw ApiError.badRequest('Invalid parishioner ID');
      }

      const parishioner = await ParishionerModel.findById(parishionerId);

      if (!parishioner) {
        throw ApiError.notFound('Parishioner not found');
      }

      res.json({
        success: true,
        data: parishioner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search parishioners by name within a parish
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

      const parishioners = await ParishionerModel.search(parishId, searchTerm);

      res.json({
        success: true,
        data: parishioners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new parishioner (Church Admin only)
   * Automatically creates user account and parishioner record
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        phone,
        profile_image_url,
        parish_id,
        ward_id,
        family_id,
        ...parishionerFields
      } = req.body;
      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw ApiError.conflict('Email is already registered');
      }

      // Verify parish exists
      const parish = await ParishModel.findById(parish_id);
      if (!parish) {
        throw ApiError.badRequest('Parish not found');
      }

      // If ward_id is provided, verify it exists and belongs to the same parish
      if (ward_id) {
        const ward = await WardModel.findById(ward_id);
        if (!ward) {
          throw ApiError.badRequest('Ward not found');
        }
        if (ward.parish_id != parish_id) {
          throw ApiError.badRequest('Ward must belong to the same parish');
        }
      }

      // If family_id is provided, verify it exists and belongs to the same parish
      if (family_id) {
        const family = await FamilyModel.findById(family_id);
        if (!family) {
          throw ApiError.badRequest('Family not found');
        }
        if (family.parish_id != parish_id) {
          throw ApiError.badRequest('Family must belong to the same parish');
        }
      }

      // ✅ STEP 1: Verify FAMILY_MEMBER role exists BEFORE creating user
      const familyMemberRole = await RoleModel.getRoleByCode(SYSTEM_ROLES.FAMILY_MEMBER);
      if (!familyMemberRole) {
        logger.error('FAMILY_MEMBER role not found during parishioner creation');
        throw ApiError.internal('Unable to create parishioner. Role not found.');
      }

      // ✅ STEP 2: Create user account (with or without password)
      let password_hash: string;
      if (password) {
        password_hash = await PasswordUtil.hash(password);
      } else {
        // Generate a temporary random password if not provided
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        password_hash = await PasswordUtil.hash(tempPassword);
      }

      const user = await UserModel.create({
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        profile_image_url,
        user_type: UserType.PARISHIONER,
      });

      // ✅ STEP 3: Assign FAMILY_MEMBER role
      try {
        await UserRoleModel.assignRoleToUser(user.user_id, familyMemberRole.role_id);
        logger.info(`FAMILY_MEMBER role assigned to parishioner ${user.email}`, {
          user_id: user.user_id,
          role_id: familyMemberRole.role_id,
        });
      } catch (roleAssignError) {
        logger.error('Failed to assign FAMILY_MEMBER role during parishioner creation', {
          user_id: user.user_id,
          email: user.email,
          error: roleAssignError,
        });
        // Delete the user and throw error
        await UserModel.delete(user.user_id);
        throw ApiError.internal('Failed to assign family member role');
      }

      // ✅ STEP 4: Create parishioner record
      let parishioner;
      try {
        parishioner = await ParishionerModel.create({
          user_id: user.user_id,
          parish_id,
          ward_id,
          family_id,
          phone, // Added phone to parishioner creation
          ...parishionerFields,
        });
      } catch (parishionerError) {
        // Rollback: delete the user if parishioner creation fails
        await UserModel.delete(user.user_id);
        throw parishionerError;
      }

      // Update ward counts if ward is assigned
      if (ward_id) {
        const totalFamilies = await FamilyModel.countByWardId(ward_id);
        const totalMembers = await ParishionerModel.countByWardId(ward_id);
        await WardModel.updateCounts(ward_id, totalFamilies, totalMembers);
      }

      res.status(201).json({
        success: true,
        message: password
          ? 'Parishioner created successfully with login credentials'
          : 'Parishioner created successfully. User can set password later.',
        data: parishioner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update parishioner (Church Admin only)
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishionerId = parseInt(req.params.id);

      if (isNaN(parishionerId)) {
        throw ApiError.badRequest('Invalid parishioner ID');
      }

      const {
        email,
        first_name,
        last_name,
        phone,
        ...parishionerUpdates
      } = req.body;

      // Get existing parishioner to check parish_id and user_id
      const existingParishioner = await ParishionerModel.findById(parishionerId);
      if (!existingParishioner) {
        throw ApiError.notFound('Parishioner not found');
      }

      // Get the associated user
      const existingUser = await UserModel.findById(existingParishioner.user_id);
      if (!existingUser) {
        throw ApiError.notFound('Associated user not found');
      }

      // Prepare user updates
      const userUpdates: { [key: string]: any } = {};
      if (email !== undefined) userUpdates.email = email;
      if (first_name !== undefined) userUpdates.first_name = first_name;
      if (last_name !== undefined) userUpdates.last_name = last_name;
      if (phone !== undefined) userUpdates.phone = phone;

      // If email is being updated, check for conflicts
      if (email && email !== existingUser.email) {
        const emailConflict = await UserModel.findByEmail(email);
        if (emailConflict && emailConflict.user_id !== existingUser.user_id) {
          throw ApiError.conflict('Email is already registered by another user');
        }
      }

      // Update user record if there are changes
      if (Object.keys(userUpdates).length > 0) {
        await UserModel.update(existingUser.user_id, userUpdates);
      }

      // Use parishionerUpdates for parishioner model
      const updates = parishionerUpdates;
      // If phone is updated, it should also be updated in parishioner model
      if (phone !== undefined) {
        updates.phone = phone;
      }

      // If ward_id is being updated, verify it
      if (updates.ward_id) {
        const ward = await WardModel.findById(updates.ward_id);
        if (!ward) {
          throw ApiError.badRequest('Ward not found');
        }
        if (ward.parish_id != existingParishioner.parish_id) {
          throw ApiError.badRequest('Ward must belong to the same parish');
        }
      }

      // If family_id is being updated, verify it
      if (updates.family_id) {
        const family = await FamilyModel.findById(updates.family_id);
        if (!family) {
          throw ApiError.badRequest('Family not found');
        }
        if (family.parish_id != existingParishioner.parish_id) {
          throw ApiError.badRequest('Family must belong to the same parish');
        }
      }

      const parishioner = await ParishionerModel.update(parishionerId, updates);

      // Update ward counts if ward was changed
      if (updates.ward_id !== undefined) {
        // Update new ward counts
        if (parishioner.ward_id) {
          const totalFamilies = await FamilyModel.countByWardId(parishioner.ward_id);
          const totalMembers = await ParishionerModel.countByWardId(parishioner.ward_id);
          await WardModel.updateCounts(parishioner.ward_id, totalFamilies, totalMembers);
        }

        // Update old ward counts if it was changed from a previous ward
        if (existingParishioner.ward_id && existingParishioner.ward_id !== parishioner.ward_id) {
          const oldTotalFamilies = await FamilyModel.countByWardId(existingParishioner.ward_id);
          const oldTotalMembers = await ParishionerModel.countByWardId(existingParishioner.ward_id);
          await WardModel.updateCounts(
            existingParishioner.ward_id,
            oldTotalFamilies,
            oldTotalMembers
          );
        }
      }

      res.json({
        success: true,
        message: 'Parishioner updated successfully',
        data: parishioner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete parishioner (soft delete - Church Admin only)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishionerId = parseInt(req.params.id);

      if (isNaN(parishionerId)) {
        throw ApiError.badRequest('Invalid parishioner ID');
      }

      // Get parishioner before deletion to update ward counts
      const parishioner = await ParishionerModel.findById(parishionerId);
      const wardId = parishioner?.ward_id;

      await ParishionerModel.delete(parishionerId);

      // Update ward counts if parishioner was in a ward
      if (wardId) {
        const totalFamilies = await FamilyModel.countByWardId(wardId);
        const totalMembers = await ParishionerModel.countByWardId(wardId);
        await WardModel.updateCounts(wardId, totalFamilies, totalMembers);
      }

      res.json({
        success: true,
        message: 'Parishioner deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all parishioners for a parish (no pagination)
   */
  public static async getAllByParish(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const parishioners = await ParishionerModel.getAllByParish(parishId);

      res.json({
        success: true,
        data: parishioners,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ParishionerController;
