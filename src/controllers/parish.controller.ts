import { Request, Response, NextFunction } from 'express';
import { ParishModel } from '../models/Parish';
import { UserModel } from '../models/User';
import { ChurchAdminModel } from '../models/ChurchAdmin';
import { RoleModel, UserRoleModel } from '../models/Role';
import { ApiError } from '../utils/apiError';
import { IAuthRequest, UserType } from '../types';
import { SYSTEM_ROLES } from '../constants/roles';
import { PasswordUtil } from '../utils/password';
import logger from '../utils/logger';
import subscriptionService from '../services/subscription.service';

export class ParishController {
  /**
   * Get all parishes with pagination
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const parishes = await ParishModel.findAll(page, limit);
      const totalRecords = await ParishModel.count();
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: parishes,
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
   * Get parish by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.id);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const parish = await ParishModel.findById(parishId);

      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      res.json({
        success: true,
        data: parish,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search parishes by name
   */
  public static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchTerm = req.query.q as string;

      if (!searchTerm) {
        throw ApiError.badRequest('Search term is required');
      }

      const parishes = await ParishModel.search(searchTerm);

      res.json({
        success: true,
        data: parishes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new parish (Super Admin only)
   * Optionally creates a Church Admin user for the parish
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        admin_email,
        admin_password,
        admin_first_name,
        admin_last_name,
        admin_phone,
        admin_role,
        admin_department,
        ...parishData
      } = req.body;

      // Create the parish first
      const parish = await ParishModel.create(parishData);

      let adminUser = null;
      let churchAdmin = null;

      // If admin user details are provided, create a Church Admin account
      if (admin_email && admin_password && admin_first_name && admin_last_name) {
        try {
          // Validate password strength
          const passwordValidation = PasswordUtil.validateStrength(admin_password);
          if (!passwordValidation.isValid) {
            throw ApiError.badRequest(
              `Admin password validation failed: ${passwordValidation.errors.join(', ')}`
            );
          }

          // Hash password
          const password_hash = await PasswordUtil.hash(admin_password);

          // ✅ STEP 1: Verify CHURCH_ADMIN role exists BEFORE creating user
          const churchAdminRole = await RoleModel.getRoleByCode(SYSTEM_ROLES.CHURCH_ADMIN);
          if (!churchAdminRole) {
            logger.error(
              'System configuration error: CHURCH_ADMIN role not found during parish creation',
              {
                parishId: parish.parish_id,
                adminEmail: admin_email,
              }
            );
            throw ApiError.internal(
              'System configuration error: Unable to create admin user. CHURCH_ADMIN role not found. Please contact support.'
            );
          }

          // ✅ STEP 2: Create Church Admin user in users table
          adminUser = await UserModel.create({
            email: admin_email,
            password_hash,
            first_name: admin_first_name,
            last_name: admin_last_name,
            phone: admin_phone,
            user_type: UserType.CHURCH_ADMIN,
            profile_image_url: undefined,
          });

          logger.info('Church admin user created for parish', {
            userId: adminUser.user_id,
            email: adminUser.email,
            parishId: parish.parish_id,
          });

          // ✅ STEP 3: Assign CHURCH_ADMIN role to the user
          try {
            await UserRoleModel.assignRoleToUser(adminUser.user_id, churchAdminRole.role_id);

            logger.info('CHURCH_ADMIN role assigned to parish admin', {
              userId: adminUser.user_id,
              roleId: churchAdminRole.role_id,
              parishId: parish.parish_id,
            });
          } catch (roleAssignError) {
            logger.error('Failed to assign CHURCH_ADMIN role to parish admin', {
              userId: adminUser.user_id,
              roleId: churchAdminRole.role_id,
              error:
                roleAssignError instanceof Error
                  ? roleAssignError.message
                  : String(roleAssignError),
            });
            throw ApiError.internal('Failed to assign admin role. Please contact support.');
          }

          // ✅ STEP 4: Create church_admins record to link user to parish
          churchAdmin = await ChurchAdminModel.create({
            user_id: adminUser.user_id,
            parish_id: parish.parish_id,
            role: admin_role || 'Administrator',
            department: admin_department,
            is_primary_admin: true, // First admin is primary admin
            hire_date: new Date(),
          });

          logger.info('Church admin record created successfully', {
            userId: adminUser.user_id,
            parishId: parish.parish_id,
            isPrimaryAdmin: true,
          });
        } catch (adminError) {
          logger.error('Failed to create parish admin, rolling back parish creation', {
            parishId: parish.parish_id,
            error: adminError instanceof Error ? adminError.message : String(adminError),
          });

          // If admin creation fails, delete the parish we just created
          await ParishModel.delete(parish.parish_id);
          throw adminError;
        }
      }

      // Check if subscription details are provided in the request
      const {
        plan_id,
        payment_method,
        billing_cycle,
        billing_name,
        billing_email,
        billing_phone,
        billing_address,
        billing_city,
        billing_state,
        billing_pincode,
        billing_country,
      } = req.body;

      let subscriptionData = null;

      // If subscription details provided, create subscription automatically
      if (plan_id && billing_cycle && billing_name && billing_email && billing_phone) {
        try {
          logger.info('Creating subscription during parish registration', {
            parishId: parish.parish_id,
            planId: plan_id,
            paymentMethod: payment_method || 'online',
          });

          const subscription = await subscriptionService.createParishSubscription(
            {
              parish_id: parish.parish_id,
              plan_id,
              payment_method: payment_method || 'online',
              billing_cycle,
              billing_name,
              billing_email,
              billing_phone,
              billing_address,
              billing_city,
              billing_state,
              billing_pincode,
              billing_country,
            },
            adminUser?.user_id || 1 // Use admin user_id or default to 1 (super admin)
          );

          subscriptionData = subscription;

          logger.info('Subscription created successfully during parish registration', {
            parishId: parish.parish_id,
            subscriptionId: subscription.subscription.subscription_id,
          });
        } catch (subscriptionError) {
          logger.error('Failed to create subscription during parish registration', {
            parishId: parish.parish_id,
            error: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError),
            stack: subscriptionError instanceof Error ? subscriptionError.stack : undefined,
            subscriptionData: {
              plan_id,
              billing_cycle,
              billing_name,
              billing_email,
              billing_phone,
            },
          });
          // Don't fail parish creation if subscription fails
          // User can create subscription later
        }
      }

      // Determine message based on payment method
      let responseMessage = 'Parish created successfully.';
      if (subscriptionData) {
        responseMessage = subscriptionData.payment_method === 'cash'
          ? 'Parish registered successfully! Please complete cash payment to activate your subscription.'
          : 'Parish registered successfully! Complete online payment to activate your account.';
      } else if (adminUser) {
        responseMessage = 'Parish registration successful! Please complete payment to activate your subscription.';
      }

      res.status(201).json({
        success: true,
        message: responseMessage,
        data: {
          parish: {
            parish_id: parish.parish_id,
            parish_name: parish.parish_name,
            email: parish.email,
            subscription_status: parish.subscription_status, // Will be 'PENDING'
            is_subscription_managed: parish.is_subscription_managed,
          },
          admin: adminUser
            ? {
                user_id: adminUser.user_id,
                email: adminUser.email,
                first_name: adminUser.first_name,
                last_name: adminUser.last_name,
                user_type: adminUser.user_type,
                role: churchAdmin?.role,
                is_primary_admin: churchAdmin?.is_primary_admin,
              }
            : null,
          // Include subscription and checkout data if subscription was created
          ...(subscriptionData && {
            subscription: {
              subscription_id: subscriptionData.subscription.subscription_id,
              payment_method: subscriptionData.payment_method,
              razorpay_subscription_id: subscriptionData.razorpay_subscription_id,
              plan_name: subscriptionData.plan.plan_name,
              amount: subscriptionData.plan.amount,
              billing_cycle: subscriptionData.plan.billing_cycle,
            },
            // Include Razorpay data only for online payments
            ...(subscriptionData.payment_method === 'online' && {
              razorpay_subscription_id: subscriptionData.razorpay_subscription_id,
              razorpay_key_id: subscriptionData.razorpay_key_id,
              razorpay_subscription: subscriptionData.razorpay_subscription,
            }),

            // Checkout instructions
            checkout_info: subscriptionData.checkout_info,
          }),
          next_steps: subscriptionData
            ? subscriptionData.payment_method === 'cash'
              ? {
                  message: 'Cash payment selected',
                  steps: subscriptionData.checkout_info.next_steps,
                }
              : {
                  message: 'Complete online payment to activate your account',
                  steps: [
                    '1. Use razorpay_subscription_id and razorpay_key_id to open Razorpay checkout',
                    '2. Complete payment using your preferred method',
                    '3. Verify payment by calling POST /subscriptions/verify-payment',
                    '4. Your account will be activated automatically',
                    '5. Login and start managing your parish',
                  ],
                }
            : {
                message: 'To activate your parish account, please:',
                steps: [
                  '1. View available subscription plans at GET /subscriptions/plans',
                  '2. Create a subscription for your parish at POST /subscriptions',
                  '3. Complete payment via online or cash payment',
                  '4. Your account will be activated upon payment confirmation',
                ],
                subscription_plans_endpoint: '/subscriptions/plans',
                create_subscription_endpoint: '/subscriptions',
              },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update parish (Super Admin or Church Admin of that parish)
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.id);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const updates = req.body;

      const parish = await ParishModel.update(parishId, updates);

      res.json({
        success: true,
        message: 'Parish updated successfully',
        data: parish,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete parish (soft delete - Super Admin only)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.id);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }
      await ParishModel.delete(parishId, req.user?.user_id);

      res.json({
        success: true,
        message: 'Parish deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get parish statistics
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.id);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const parish = await ParishModel.findById(parishId);

      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      // Return basic stats from parish record
      res.json({
        success: true,
        data: {
          parish_id: parish.parish_id,
          parish_name: parish.parish_name,
          is_active: parish.is_active,
          is_subscription_managed: parish.is_subscription_managed,
          current_plan_id: parish.current_plan_id,
          created_at: parish.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ParishController;
