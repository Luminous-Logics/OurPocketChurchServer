/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { FamilyModel } from '../models/Family';
import { ParishModel } from '../models/Parish';
import { WardModel } from '../models/Ward';
import { ParishionerModel } from '../models/Parishioner';
import { UserModel } from '../models/User';
import { RoleModel, UserRoleModel } from '../models/Role';
import { ApiError } from '../utils/apiError';
import { IAuthRequest, UserType } from '../types';
import { SYSTEM_ROLES } from '../constants/roles';
import PasswordUtil from '../utils/password';
import database from '../config/database';
import Papa from 'papaparse';
import fs from 'fs';
import logger from '../utils/logger';
import { emailService } from '../services/email/email.service';

export class FamilyController {
  /**
   * Get all families for a specific parish with pagination
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

      const families = await FamilyModel.findByParishId(parishId, page, limit);
      const totalRecords = await FamilyModel.countByParishId(parishId);
      const totalPages = Math.ceil(totalRecords / limit);
      
      res.json({
        success: true,
        data: families,
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
   * Get all families for a specific ward with pagination
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

      const families = await FamilyModel.findByWardId(wardId, page, limit);
      const totalRecords = await FamilyModel.countByWardId(wardId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: families,
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
   * Get family by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = parseInt(req.params.id);

      if (isNaN(familyId)) {
        throw ApiError.badRequest('Invalid family ID');
      }

      const family = await FamilyModel.findById(familyId);

      if (!family) {
        throw ApiError.notFound('Family not found');
      }

      res.json({
        success: true,
        data: family,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search families by name within a parish
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

      const families = await FamilyModel.search(parishId, searchTerm);

      res.json({
        success: true,
        data: families,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new family (Church Admin only)
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyData = req.body;
      // Verify parish exists
      const parish = await ParishModel.findById(familyData.parish_id);
      if (!parish) {
        throw ApiError.badRequest('Parish not found');
      }

      // If ward_id is provided, verify it exists and belongs to the same parish
      if (familyData.ward_id) {
        const ward = await WardModel.findById(familyData.ward_id);
        if (!ward) {
          throw ApiError.badRequest('Ward not found');
        }

        if (ward.parish_id != familyData.parish_id) {
          throw ApiError.badRequest('Ward must belong to the same parish');
        }
      }

      // If primary_contact_id is provided, verify it exists and belongs to the same parish
      if (familyData.primary_contact_id) {
        const contact = await ParishionerModel.findById(familyData.primary_contact_id);
        if (!contact) {
          throw ApiError.badRequest('Primary contact (parishioner) not found');
        }
        if (!contact.is_active) {
          throw ApiError.badRequest('Primary contact must be an active parishioner');
        }
        if (contact.parish_id !== familyData.parish_id) {
          throw ApiError.badRequest('Primary contact must belong to the same parish');
        }
      }

      const family = await FamilyModel.create(familyData);

      // Update ward counts if ward is assigned
      if (family.ward_id) {
        const totalFamilies = await FamilyModel.countByWardId(family.ward_id);
        const totalMembers = await ParishionerModel.countByWardId(family.ward_id);
        await WardModel.updateCounts(family.ward_id, totalFamilies, totalMembers);
      }

      res.status(201).json({
        success: true,
        message: 'Family created successfully',
        data: family,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update family (Church Admin only)
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = parseInt(req.params.id);

      if (isNaN(familyId)) {
        throw ApiError.badRequest('Invalid family ID');
      }

      const updates = req.body;

      // Get existing family to check parish_id
      const existingFamily = await FamilyModel.findById(familyId);
      if (!existingFamily) {
        throw ApiError.notFound('Family not found');
      }

      // If ward_id is being updated, verify it
      if (updates.ward_id) {
        const ward = await WardModel.findById(updates.ward_id);
        if (!ward) {
          throw ApiError.badRequest('Ward not found');
        }

        if (ward.parish_id != existingFamily.parish_id) {
          throw ApiError.badRequest('Ward must belong to the same parish');
        }
      }

      // If primary_contact_id is being updated, verify it
      if (updates.primary_contact_id) {
        const contact = await ParishionerModel.findById(updates.primary_contact_id);
        if (!contact) {
          throw ApiError.badRequest('Primary contact (parishioner) not found');
        }
        if (!contact.is_active) {
          throw ApiError.badRequest('Primary contact must be an active parishioner');
        }
        if (contact.parish_id !== existingFamily.parish_id) {
          throw ApiError.badRequest('Primary contact must belong to the same parish');
        }
      }

      const family = await FamilyModel.update(familyId, updates);

      // Update ward counts if ward was changed
      if (updates.ward_id !== undefined) {
        // Update new ward counts
        if (family.ward_id) {
          const totalFamilies = await FamilyModel.countByWardId(family.ward_id);
          const totalMembers = await ParishionerModel.countByWardId(family.ward_id);
          await WardModel.updateCounts(family.ward_id, totalFamilies, totalMembers);
        }

        // Update old ward counts if it was changed from a previous ward
        if (existingFamily.ward_id && existingFamily.ward_id !== family.ward_id) {
          const oldTotalFamilies = await FamilyModel.countByWardId(existingFamily.ward_id);
          const oldTotalMembers = await ParishionerModel.countByWardId(existingFamily.ward_id);
          await WardModel.updateCounts(existingFamily.ward_id, oldTotalFamilies, oldTotalMembers);
        }
      }

      res.json({
        success: true,
        message: 'Family updated successfully',
        data: family,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete family (soft delete - Church Admin only)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = parseInt(req.params.id);

      if (isNaN(familyId)) {
        throw ApiError.badRequest('Invalid family ID');
      }

      // Get family before deletion to update ward counts
      const family = await FamilyModel.findById(familyId);
      const wardId = family?.ward_id;

      await FamilyModel.delete(familyId);

      // Update ward counts if family was in a ward
      if (wardId) {
        const totalFamilies = await FamilyModel.countByWardId(wardId);
        const totalMembers = await ParishionerModel.countByWardId(wardId);
        await WardModel.updateCounts(wardId, totalFamilies, totalMembers);
      }

      res.json({
        success: true,
        message: 'Family deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all families for a parish (no pagination)
   */
  public static async getAllByParish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const families = await FamilyModel.getAllByParish(parishId);

      res.json({
        success: true,
        data: families,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create: Family + Members + Ward (Church Admin only)
   * This endpoint allows creating/using existing ward and family, and adding members in a single transaction
   */
  public static async bulkCreate(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    const client = await database.beginTransaction();

    try {
      const { parish_id, ward, family, members } = req.body;

      // Validate required fields
      if (!parish_id) {
        throw ApiError.badRequest('parish_id is required');
      }
      if (!members || !Array.isArray(members) || members.length === 0) {
        throw ApiError.badRequest('At least one member is required');
      }

      // Verify parish exists
      const parish = await ParishModel.findById(parish_id);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      // Transaction already begun in client

      let wardId: number | undefined;
      let wardCreated = false;

      // Step 1: Create or use existing ward if provided
      if (ward) {
        if (ward.ward_id) {
          // Use existing ward
          const existingWard = await WardModel.findById(ward.ward_id);
          if (!existingWard) {
            throw ApiError.badRequest('Specified ward not found');
          }
          if (existingWard.parish_id != parish_id) {
            throw ApiError.badRequest('Ward must belong to the same parish');
          }
          wardId = ward.ward_id;
        } else if (ward.ward_name) {
          // Create new ward
          const newWard = await WardModel.create({
            parish_id,
            ward_name: ward.ward_name,
            ward_number: ward.ward_number,
            description: ward.description,
            coordinator_id: ward.coordinator_id,
            area_coverage: ward.area_coverage,
          });
          wardId = newWard.ward_id;
          wardCreated = true;
        }
      }

      let familyId: number;
      let familyCreated = false;

      // Step 2: Create or use existing family
      if (family) {
        if (family.family_id) {
          // Use existing family
          const existingFamily = await FamilyModel.findById(family.family_id);
          if (!existingFamily) {
            throw ApiError.badRequest('Specified family not found');
          }
          if (existingFamily.parish_id != parish_id) {
            throw ApiError.badRequest('Family must belong to the same parish');
          }
          // If ward is specified, optionally update the family's ward
          if (wardId && family.update_ward) {
            await FamilyModel.update(family.family_id, { ward_id: wardId });
          }
          familyId = family.family_id;
        } else if (family.family_name) {
          // Create new family
          const createdFamily = await FamilyModel.create({
            parish_id,
            ward_id: wardId,
            family_name: family.family_name,
            head_of_family: family.head_of_family,
            home_phone: family.home_phone,
            registration_date: family.registration_date ? new Date(family.registration_date) : undefined,
          });
          familyId = createdFamily.family_id;
          familyCreated = true;
        } else {
          throw ApiError.badRequest('Either family_id (existing) or family_name (new) is required');
        }
      } else {
        throw ApiError.badRequest('family data is required');
      }

      const createdMembers = [];
      let primaryContactId: number | undefined;

      // Step 3: Create members (users + parishioners)
      for (let i = 0; i < members.length; i++) {
        const member = members[i];

        // Validate member data
        if (!member.first_name || !member.last_name || !member.email) {
          throw ApiError.badRequest(`Member at index ${i} must have first_name, last_name, and email`);
        }

        // Check if email already exists
        const existingUser = await UserModel.findByEmail(member.email);
        if (existingUser) {
          throw ApiError.conflict(`Email ${member.email} already exists`);
        }

        // Generate default password if not provided
        const password = member.password || 'Parish@123';
        const password_hash = await PasswordUtil.hash(password);

        // ✅ STEP 1: Verify FAMILY_MEMBER role exists BEFORE creating user
        const familyMemberRole = await RoleModel.getRoleByCode(SYSTEM_ROLES.FAMILY_MEMBER);
        if (!familyMemberRole) {
          logger.error('FAMILY_MEMBER role not found during family member creation');
          throw ApiError.internal('Unable to create family member. Role not found.');
        }

        // ✅ STEP 2: Create user
        const newUser = await UserModel.create({
          email: member.email,
          password_hash,
          first_name: member.first_name,
          last_name: member.last_name,
          phone: member.phone,
          profile_image_url: member.profile_image_url,
          user_type: UserType.PARISHIONER,
        });

        // ✅ STEP 3: Assign FAMILY_MEMBER role
        try {
          await UserRoleModel.assignRoleToUser(newUser.user_id, familyMemberRole.role_id);
          logger.info(`FAMILY_MEMBER role assigned to user ${newUser.email}`, {
            user_id: newUser.user_id,
            role_id: familyMemberRole.role_id,
          });
        } catch (roleAssignError) {
          logger.error('Failed to assign FAMILY_MEMBER role during family creation', {
            user_id: newUser.user_id,
            email: newUser.email,
            error: roleAssignError,
          });
          // Delete the user and throw error
          await UserModel.delete(newUser.user_id);
          throw ApiError.internal('Failed to assign family member role');
        }

        // ✅ STEP 4: Create parishioner
        const newParishioner = await ParishionerModel.create({
          user_id: newUser.user_id,
          parish_id,
          ward_id: wardId,
          family_id: familyId,
          middle_name: member.middle_name,
          date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : undefined,
          gender: member.gender,
          marital_status: member.marital_status,
          occupation: member.occupation,
          baptism_date: member.baptism_date ? new Date(member.baptism_date) : undefined,
          first_communion_date: member.first_communion_date ? new Date(member.first_communion_date) : undefined,
          confirmation_date: member.confirmation_date ? new Date(member.confirmation_date) : undefined,
          marriage_date: member.marriage_date ? new Date(member.marriage_date) : undefined,
          member_status: member.member_status || 'active',
          photo_url: member.photo_url,
          address_line1: member.address_line1,
          address_line2: member.address_line2,
          city: member.city,
          state: member.state,
          country: member.country,
          postal_code: member.postal_code,
          emergency_contact_name: member.emergency_contact_name,
          emergency_contact_phone: member.emergency_contact_phone,
          notes: member.notes,
          registration_date: member.registration_date ? new Date(member.registration_date) : undefined,
        });

        createdMembers.push({
          user: newUser,
          parishioner: newParishioner,
        });

        // Set first member as primary contact if marked or if it's the first member and family was created
        if ((member.is_primary_contact === true || (i === 0 && familyCreated)) && !primaryContactId) {
          primaryContactId = newParishioner.parishioner_id;
        }

        // ✅ STEP 5: Send welcome email (async, don't wait for it)
        // Get family name for email
        FamilyModel.findById(familyId).then((familyData) => {
          emailService
            .sendTemplateEmail({
              to: newUser.email,
              templateCode: 'welcome_parishioner',
              variables: {
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                email: newUser.email,
                recipientName: `${newUser.first_name} ${newUser.last_name}`,
                parishName: parish.parish_name,
                parishAddress: '',
                familyName: familyData?.family_name || 'Parish Family',
                wardName: '',
                loginUrl: `${process.env.FRONTEND_URL || 'https://parishnexus.com'}/login`,
              },
            })
            .then(() => {
              logger.info(`Welcome email sent to ${newUser.email}`);
            })
            .catch((emailError) => {
              logger.error(`Failed to send welcome email to ${newUser.email}`, { emailError });
              // Don't throw error - email failure shouldn't block user creation
            });
        });
      }

      // Step 4: Update family with primary contact (only if family was newly created or update_primary_contact is true)
      if (primaryContactId && (familyCreated || family.update_primary_contact)) {
        await FamilyModel.update(familyId, {
          primary_contact_id: primaryContactId,
        });
      }

      // Step 5: Update ward counts if ward is assigned
      if (wardId) {
        // Count total families in this ward
        const totalFamilies = await FamilyModel.countByWardId(wardId);

        // Count total members (parishioners) in this ward
        const totalMembers = await ParishionerModel.countByWardId(wardId);

        // Update the ward with new counts
        await WardModel.updateCounts(wardId, totalFamilies, totalMembers);
      }

      // Commit transaction
      await database.commitTransaction(client);

      // Fetch updated family
      const finalFamily = await FamilyModel.findById(familyId);

      res.status(201).json({
        success: true,
        message: `Successfully added ${createdMembers.length} member(s)${wardCreated ? ', created ward' : ''}${familyCreated ? ', created family' : ' to existing family'}`,
        data: {
          ward_id: wardId,
          ward_created: wardCreated,
          family: finalFamily,
          family_created: familyCreated,
          members: createdMembers,
          total_members_created: createdMembers.length,
        },
      });
    } catch (error) {
      // Rollback transaction on error
      try {
        await database.rollbackTransaction(client);
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      next(error);
    }
  }

  /**
   * Bulk upload families and members from CSV file (Church Admin only)
   */
  public static async bulkUploadCSV(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    let filePath: string | undefined;

    try {
      // Check if file is uploaded
      if (!req.file) {
        throw ApiError.badRequest('No CSV file uploaded');
      }

      filePath = req.file.path;
      const { parish_id } = req.body;

      if (!parish_id) {
        throw ApiError.badRequest('parish_id is required');
      }

      const parishIdNum = parseInt(parish_id);

      // Verify parish exists
      const parish = await ParishModel.findById(parishIdNum);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      // Read and parse CSV file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        throw ApiError.badRequest(`CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(', ')}`);
      }

      const rows = parseResult.data as any[];

      if (rows.length === 0) {
        throw ApiError.badRequest('CSV file is empty');
      }

      // Group rows by family
      const familiesMap = new Map<string, any[]>();

      rows.forEach((row, index) => {
        const familyName = row.family_name?.trim();
        if (!familyName) {
          throw ApiError.badRequest(`Row ${index + 2}: family_name is required`);
        }

        if (!familiesMap.has(familyName)) {
          familiesMap.set(familyName, []);
        }
        familiesMap.get(familyName)!.push({ ...row, rowIndex: index + 2 });
      });

      const client = await database.beginTransaction();

      const results = {
        totalFamilies: 0,
        totalMembers: 0,
        createdFamilies: [] as any[],
        createdMembers: [] as any[],
        errors: [] as any[],
      };

      try {
        // Process each family
        for (const [familyName, members] of familiesMap) {
          try {
            const firstMember = members[0];

            // Get or create ward
            let wardId: number | undefined;
            if (firstMember.ward_name?.trim()) {
              const wardNumber = firstMember.ward_number?.trim();

              // Check if ward exists by ward_number
              if (wardNumber) {
                const existingWard = await WardModel.findByWardNumber(parishIdNum, wardNumber);
                if (existingWard) {
                  wardId = existingWard.ward_id;
                } else {
                  // Create new ward
                  const newWard = await WardModel.create({
                    parish_id: parishIdNum,
                    ward_name: firstMember.ward_name.trim(),
                    ward_number: wardNumber,
                    description: firstMember.ward_description?.trim(),
                    area_coverage: firstMember.ward_area?.trim(),
                  });
                  wardId = newWard.ward_id;
                }
              }
            }

            // Create family
            const family = await FamilyModel.create({
              parish_id: parishIdNum,
              ward_id: wardId,
              family_name: familyName,
              head_of_family: firstMember.head_of_family?.trim(),
              home_phone: firstMember.family_phone?.trim(),
              registration_date: firstMember.family_registration_date
                ? new Date(firstMember.family_registration_date)
                : undefined,
            });

            results.totalFamilies++;
            results.createdFamilies.push({
              family_id: family.family_id,
              family_name: familyName,
              head_of_family: family.head_of_family,
            });

            let primaryContactId: number | undefined;

            // Create members for this family
            for (let i = 0; i < members.length; i++) {
              const member = members[i];

              try {
                // Validate required fields
                if (!member.first_name?.trim() || !member.last_name?.trim() || !member.email?.trim()) {
                  results.errors.push({
                    row: member.rowIndex,
                    family: familyName,
                    error: 'Missing required fields: first_name, last_name, or email',
                  });
                  continue;
                }

                // Check if email already exists
                const existingUser = await UserModel.findByEmail(member.email.trim());
                if (existingUser) {
                  results.errors.push({
                    row: member.rowIndex,
                    family: familyName,
                    error: `Email ${member.email} already exists`,
                  });
                  continue;
                }

                // ✅ STEP 1: Verify FAMILY_MEMBER role exists
                const familyMemberRole = await RoleModel.getRoleByCode(SYSTEM_ROLES.FAMILY_MEMBER);
                if (!familyMemberRole) {
                  results.errors.push({
                    row: member.rowIndex,
                    family: familyName,
                    error: 'FAMILY_MEMBER role not found in system',
                  });
                  continue;
                }

                // ✅ STEP 2: Create user
                const password = member.password?.trim() || 'Parish@123';
                const password_hash = await PasswordUtil.hash(password);

                const newUser = await UserModel.create({
                  email: member.email.trim(),
                  password_hash,
                  first_name: member.first_name.trim(),
                  last_name: member.last_name.trim(),
                  phone: member.phone?.trim(),
                  profile_image_url: member.profile_image_url?.trim(),
                  user_type: UserType.PARISHIONER,
                });

                // ✅ STEP 3: Assign FAMILY_MEMBER role
                try {
                  await UserRoleModel.assignRoleToUser(newUser.user_id, familyMemberRole.role_id);
                  logger.info(`FAMILY_MEMBER role assigned to user ${newUser.email}`, {
                    user_id: newUser.user_id,
                    role_id: familyMemberRole.role_id,
                  });
                } catch (roleAssignError: any) {
                  logger.error('Failed to assign FAMILY_MEMBER role during CSV upload', {
                    user_id: newUser.user_id,
                    email: newUser.email,
                    error: roleAssignError,
                  });
                  // Delete the user
                  await UserModel.delete(newUser.user_id);
                  results.errors.push({
                    row: member.rowIndex,
                    family: familyName,
                    error: `Failed to assign role: ${roleAssignError.message}`,
                  });
                  continue;
                }

                // ✅ STEP 4: Create parishioner
                const newParishioner = await ParishionerModel.create({
                  user_id: newUser.user_id,
                  parish_id: parishIdNum,
                  ward_id: wardId,
                  family_id: family.family_id,
                  middle_name: member.middle_name?.trim(),
                  date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : undefined,
                  gender: member.gender?.trim(),
                  marital_status: member.marital_status?.trim(),
                  occupation: member.occupation?.trim(),
                  baptism_date: member.baptism_date ? new Date(member.baptism_date) : undefined,
                  first_communion_date: member.first_communion_date
                    ? new Date(member.first_communion_date)
                    : undefined,
                  confirmation_date: member.confirmation_date ? new Date(member.confirmation_date) : undefined,
                  marriage_date: member.marriage_date ? new Date(member.marriage_date) : undefined,
                  member_status: member.member_status?.trim() || 'active',
                  photo_url: member.photo_url?.trim(),
                  address_line1: member.address_line1?.trim(),
                  address_line2: member.address_line2?.trim(),
                  city: member.city?.trim(),
                  state: member.state?.trim(),
                  country: member.country?.trim(),
                  postal_code: member.postal_code?.trim(),
                  emergency_contact_name: member.emergency_contact_name?.trim(),
                  emergency_contact_phone: member.emergency_contact_phone?.trim(),
                  notes: member.notes?.trim(),
                  registration_date: member.member_registration_date
                    ? new Date(member.member_registration_date)
                    : undefined,
                });

                results.totalMembers++;
                results.createdMembers.push({
                  parishioner_id: newParishioner.parishioner_id,
                  name: `${member.first_name} ${member.last_name}`,
                  email: member.email,
                  family: familyName,
                });

                // Set first member as primary contact
                if (i === 0 || member.is_primary_contact?.toLowerCase() === 'true') {
                  primaryContactId = newParishioner.parishioner_id;
                }
              } catch (memberError: any) {
                results.errors.push({
                  row: member.rowIndex,
                  family: familyName,
                  member: `${member.first_name} ${member.last_name}`,
                  error: memberError.message,
                });
              }
            }

            // Update family with primary contact
            if (primaryContactId) {
              await FamilyModel.update(family.family_id, {
                primary_contact_id: primaryContactId,
              });
            }

            // Update ward counts if ward exists
            if (wardId) {
              const totalFamilies = await FamilyModel.countByWardId(wardId);
              const totalMembers = await ParishionerModel.countByWardId(wardId);
              await WardModel.updateCounts(wardId, totalFamilies, totalMembers);
            }
          } catch (familyError: any) {
            results.errors.push({
              family: familyName,
              error: familyError.message,
            });
          }
        }

        // Commit transaction
        await database.commitTransaction(client);

        // Clean up uploaded file
        if (filePath) {
          fs.unlinkSync(filePath);
        }

        res.status(201).json({
          success: true,
          message: `Bulk upload completed. Created ${results.totalFamilies} families and ${results.totalMembers} members.`,
          data: {
            summary: {
              totalFamilies: results.totalFamilies,
              totalMembers: results.totalMembers,
              totalErrors: results.errors.length,
            },
            createdFamilies: results.createdFamilies,
            createdMembers: results.createdMembers,
            errors: results.errors,
          },
        });
      } catch (error) {
        // Rollback transaction on error
        await database.rollbackTransaction(client);
        throw error;
      }
    } catch (error) {
      // Clean up uploaded file on error
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      next(error);
    }
  }
}

export default FamilyController;