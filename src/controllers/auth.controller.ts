/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { ParishModel } from '../models/Parish';
import { RoleModel, UserRoleModel, PermissionModel } from '../models/Role';
import { PasswordUtil } from '../utils/password';
import { JwtUtil } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { IAuthRequest, IAuthResponse, UserType } from '../types';
import { getDefaultRoleForUserType } from '../constants/roles';
import logger from '../utils/logger';
import database from '../config/database';

export class AuthController {
  /**
   * Register a new user
   *
   * IMPROVED VERSION: Uses proper error handling to ensure role assignment
   * If role assignment fails, the entire registration is rolled back
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, first_name, last_name, phone, user_type, parish_id, profile_image_url } = req.body;

      // Validate parish_id if user_type is parishioner
      if (user_type === UserType.PARISHIONER) {
        if (!parish_id) {
          throw ApiError.badRequest('parish_id is required for parishioner registration');
        }

        // Check if parish_id is valid
        const parish = await ParishModel.findById(parish_id);
        if (!parish) {
          throw ApiError.badRequest('Invalid parish_id: Parish not found');
        }

        // Check if parish is active
        if (!parish.is_active) {
          throw ApiError.badRequest('The selected parish is not active');
        }
      }

      // Validate password strength
      const passwordValidation = PasswordUtil.validateStrength(password);
      if (!passwordValidation.isValid) {
        throw ApiError.badRequest(passwordValidation.errors.join(', '));
      }

      // Hash password
      const password_hash = await PasswordUtil.hash(password);

      // Determine default role code BEFORE creating user (using centralized constants)
      const defaultRoleCode = getDefaultRoleForUserType(user_type);

      // ✅ CRITICAL: Verify role exists BEFORE creating user
      const role = await RoleModel.getRoleByCode(defaultRoleCode);
      if (!role) {
        logger.error('System configuration error: Role not found during registration', {
          roleCode: defaultRoleCode,
          userType: user_type,
          email: email,
        });
        throw ApiError.internal(
          `System configuration error: Unable to complete registration. Please contact support. (Role '${defaultRoleCode}' not found)`
        );
      }

      // Log role verification success
      logger.info('Role verified for new user registration', {
        email: email,
        userType: user_type,
        roleCode: defaultRoleCode,
        roleId: role.role_id,
      });

      // Create user
      let user;
      try {
        user = await UserModel.create({
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          user_type,
          profile_image_url,
        });

        logger.info('User created successfully', {
          userId: user.user_id,
          email: user.email,
          userType: user.user_type,
        });
      } catch (userCreateError) {
        logger.error('Failed to create user', {
          email: email,
          error: userCreateError instanceof Error ? userCreateError.message : String(userCreateError),
        });
        throw userCreateError;
      }

      // ✅ Assign role to user (with proper error handling)
      try {
        await UserRoleModel.assignRoleToUser(user.user_id, role.role_id);

        logger.info('Role assigned successfully to new user', {
          userId: user.user_id,
          email: user.email,
          roleId: role.role_id,
          roleCode: defaultRoleCode,
        });
      } catch (roleAssignError) {
        // ⚠️ CRITICAL ERROR: Role assignment failed
        logger.error('CRITICAL: Failed to assign role to newly created user', {
          userId: user.user_id,
          email: user.email,
          roleId: role.role_id,
          roleCode: defaultRoleCode,
          error: roleAssignError instanceof Error ? roleAssignError.message : String(roleAssignError),
          stack: roleAssignError instanceof Error ? roleAssignError.stack : undefined,
        });

        // ✅ Clean up: Delete the user since role assignment failed
        try {
          await UserModel.delete(user.user_id);
          logger.info('Rolled back user creation after role assignment failure', {
            userId: user.user_id,
            email: user.email,
          });
        } catch (deleteError) {
          logger.error('Failed to rollback user creation', {
            userId: user.user_id,
            error: deleteError instanceof Error ? deleteError.message : String(deleteError),
          });
        }

        // Throw error to inform user
        throw ApiError.internal(
          'Failed to complete user registration. Please try again or contact support.'
        );
      }

      // Generate token
      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type,
        parish_id,
      };

const { token, expires_in, expires_at } = JwtUtil.generateAccessToken(tokenPayload);

      const response: IAuthResponse = {
        success: true,
        data: {
          token,
          expires_in,
          expires_at,
          user: {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
          },
        },
      };

      logger.info('User registration completed successfully', {
        userId: user.user_id,
        email: user.email,
        userType: user.user_type,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw ApiError.unauthorized('Account is disabled');
      }

      // Verify password
      const isValidPassword = await PasswordUtil.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Update last login
      await UserModel.updateLastLogin(user.user_id);

      // Generate token
      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type,
      };

    const { token, expires_in, expires_at } = JwtUtil.generateAccessToken(tokenPayload);

      const response: IAuthResponse = {
        success: true,
        data: {
          token,
          expires_in,
          expires_at,
          user: {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile with complete details
   * Returns: user info, roles, permissions, parish, parishioner/church_admin details
   */
  public static async getProfile(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const userId = req.user.user_id;

      // Get user basic info
      const user = await UserModel.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Remove sensitive data
      const { password_hash, ...userProfile } = user;

      // Get user's roles
      const roles = await UserRoleModel.getUserRoles(userId);

      // Get user's permissions (from roles + direct grants/revokes)
      const permissions = await PermissionModel.getUserPermissions(userId);

      // Get parish and specific details based on user type
      let parishDetails = null;
      let parishionerDetails = null;
      let churchAdminDetails = null;
      let wardDetails = null;
      let familyDetails = null;

      if (user.user_type === UserType.PARISHIONER || user.user_type === UserType.CHURCH_ADMIN) {
        // Get parishioner details
        const parishionerResult = await database.executeQuery(`
            SELECT
              p.*,
              w.ward_name,
              w.ward_number,
              f.family_name,
              f.home_phone as family_phone,
              par.parish_name,
              par.diocese,
              par.city,
              par.state
            FROM parishioners p
            LEFT JOIN wards w ON p.ward_id = w.ward_id
            LEFT JOIN families f ON p.family_id = f.family_id
            LEFT JOIN parishes par ON p.parish_id = par.parish_id
            WHERE p.user_id = @userId AND p.is_active = TRUE
          `, { userId });

        if (parishionerResult.rows.length > 0) {
          const parishionerData = parishionerResult.rows[0];

          parishionerDetails = {
            parishioner_id: parishionerData.parishioner_id,
            middle_name: parishionerData.middle_name,
            date_of_birth: parishionerData.date_of_birth,
            gender: parishionerData.gender,
            marital_status: parishionerData.marital_status,
            occupation: parishionerData.occupation,
            baptism_date: parishionerData.baptism_date,
            first_communion_date: parishionerData.first_communion_date,
            confirmation_date: parishionerData.confirmation_date,
            marriage_date: parishionerData.marriage_date,
            member_status: parishionerData.member_status,
            photo_url: parishionerData.photo_url,
            address_line1: parishionerData.address_line1,
            address_line2: parishionerData.address_line2,
            city: parishionerData.city,
            state: parishionerData.state,
            country: parishionerData.country,
            postal_code: parishionerData.postal_code,
            emergency_contact_name: parishionerData.emergency_contact_name,
            emergency_contact_phone: parishionerData.emergency_contact_phone,
            registration_date: parishionerData.registration_date,
          };

          // Parish details
          parishDetails = {
            parish_id: parishionerData.parish_id,
            parish_name: parishionerData.parish_name,
            diocese: parishionerData.diocese,
            city: parishionerData.city,
            state: parishionerData.state,
          };

          // Ward details
          if (parishionerData.ward_id) {
            wardDetails = {
              ward_id: parishionerData.ward_id,
              ward_name: parishionerData.ward_name,
              ward_number: parishionerData.ward_number,
            };
          }

          // Family details
          if (parishionerData.family_id) {
            familyDetails = {
              family_id: parishionerData.family_id,
              family_name: parishionerData.family_name,
              family_phone: parishionerData.family_phone,
            };
          }
        }

        // Get church admin details if user is church admin
        if (user.user_type === UserType.CHURCH_ADMIN) {
          const churchAdminResult = await database.executeQuery(`
              SELECT
                ca.*,
                par.parish_name,
                par.diocese,
                par.city,
                par.state
              FROM church_admins ca
              LEFT JOIN parishes par ON ca.parish_id = par.parish_id
              WHERE ca.user_id = @userId AND ca.is_active = TRUE
            `, { userId });

          if (churchAdminResult.rows.length > 0) {
            const adminData = churchAdminResult.rows[0];

            churchAdminDetails = {
              church_admin_id: adminData.church_admin_id,
              role: adminData.role,
              department: adminData.department,
              permissions: adminData.permissions,
              hire_date: adminData.hire_date,
              is_primary_admin: adminData.is_primary_admin,
            };

            // Override parish details with church admin's parish
            parishDetails = {
              parish_id: adminData.parish_id,
              parish_name: adminData.parish_name,
              diocese: adminData.diocese,
              city: adminData.city,
              state: adminData.state,
            };
          }
        }
      }

      res.json({
        success: true,
        data: {
          user: userProfile,
          roles: roles,
          permissions: permissions,
          parish: parishDetails,
          parishioner: parishionerDetails,
          church_admin: churchAdminDetails,
          ward: wardDetails,
          family: familyDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  public static async changePassword(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const { currentPassword, newPassword } = req.body;

      // Get user
      const user = await UserModel.findById(req.user.user_id);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Verify current password
      const isValidPassword = await PasswordUtil.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw ApiError.unauthorized('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = PasswordUtil.validateStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw ApiError.badRequest(passwordValidation.errors.join(', '));
      }

      // Hash new password
      const password_hash = await PasswordUtil.hash(newPassword);

      // Update password
      await UserModel.update(user.user_id, { password_hash });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
