import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

// All role management routes require authentication
router.use(authenticate);

// =====================================================
// ROLE ROUTES
// =====================================================

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parishId
 *         schema:
 *           type: integer
 *         description: Filter by parish ID
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/', RoleController.getAllRoles);

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 */
router.get('/:roleId', RoleController.getRoleById);

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   get:
 *     summary: Get permissions for a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/:roleId/permissions', RoleController.getRolePermissions);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *               - role_code
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: Event Coordinator
 *               role_code:
 *                 type: string
 *                 example: EVENT_COORDINATOR
 *               description:
 *                 type: string
 *               parish_id:
 *                 type: integer
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Role created successfully
 */
router.post('/', requirePermission('MANAGE_ROLES'), RoleController.createRole);

/**
 * @swagger
 * /roles/{roleId}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.put('/:roleId', requirePermission('MANAGE_ROLES'), RoleController.updateRole);

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted successfully
 */
router.delete('/:roleId', requirePermission('MANAGE_ROLES'), RoleController.deleteRole);

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   post:
 *     summary: Assign permission to role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *             properties:
 *               permission_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Permission assigned successfully
 */
router.post('/:roleId/permissions', requirePermission('MANAGE_ROLES'), RoleController.assignPermissionToRole);

/**
 * @swagger
 * /roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove permission from role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission removed successfully
 */
router.delete('/:roleId/permissions/:permissionId', requirePermission('MANAGE_ROLES'), RoleController.removePermissionFromRole);

/**
 * @swagger
 * /roles/{roleId}/users:
 *   get:
 *     summary: Get users with specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/:roleId/users', requirePermission('MANAGE_ROLES'), RoleController.getUsersByRole);

// =====================================================
// PERMISSION ROUTES
// =====================================================

/**
 * @swagger
 * /roles/permissions/all:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/permissions/all', RoleController.getAllPermissions);

/**
 * @swagger
 * /roles/permissions/module/{module}:
 *   get:
 *     summary: Get permissions by module
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *         description: Module name (e.g., events, family, bible)
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/permissions/module/:module', RoleController.getPermissionsByModule);

// =====================================================
// USER ROLE ROUTES
// =====================================================

/**
 * @swagger
 * /roles/user/my-roles:
 *   get:
 *     summary: Get current user's roles
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/user/my-roles', RoleController.getMyRoles);

/**
 * @swagger
 * /roles/user/my-permissions:
 *   get:
 *     summary: Get current user's permissions
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/user/my-permissions', RoleController.getMyPermissions);

/**
 * @swagger
 * /roles/user/{userId}/roles:
 *   get:
 *     summary: Get user's roles
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/user/:userId/roles', RoleController.getUserRoles);

/**
 * @swagger
 * /roles/user/{userId}/permissions:
 *   get:
 *     summary: Get user's permissions
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/user/:userId/permissions', RoleController.getUserPermissions);

/**
 * @swagger
 * /roles/user/{userId}/roles:
 *   post:
 *     summary: Assign role to user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: integer
 *                 description: Role ID to assign
 *                 example: 21
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: (Optional) When the role expires. Leave empty for permanent role
 *                 example: "2025-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Role assigned successfully
 */
router.post('/user/:userId/roles', requirePermission('MANAGE_ROLES'), RoleController.assignRoleToUser);

/**
 * @swagger
 * /roles/user/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Remove role from user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role removed successfully
 */
router.delete('/user/:userId/roles/:roleId', requirePermission('MANAGE_ROLES'), RoleController.removeRoleFromUser);

/**
 * @swagger
 * /roles/user/{userId}/permissions/grant:
 *   post:
 *     summary: Grant direct permission to user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *             properties:
 *               permission_id:
 *                 type: integer
 *               reason:
 *                 type: string
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Permission granted successfully
 */
router.post('/user/:userId/permissions/grant', requirePermission('MANAGE_ROLES'), RoleController.grantPermissionToUser);

/**
 * @swagger
 * /roles/user/{userId}/permissions/revoke:
 *   post:
 *     summary: Revoke permission from user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *             properties:
 *               permission_id:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission revoked successfully
 */
router.post('/user/:userId/permissions/revoke', requirePermission('MANAGE_ROLES'), RoleController.revokePermissionFromUser);

/**
 * @swagger
 * /roles/user/{userId}/check-permission:
 *   get:
 *     summary: Check if user has specific permission
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: permission_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission check completed
 */
router.get('/user/:userId/check-permission', RoleController.checkUserPermission);

// =====================================================
// PARISH USER ROUTES
// =====================================================

/**
 * @swagger
 * /roles/users/parish/{parishId}:
 *   get:
 *     summary: Get all users under a parish
 *     tags: [User Management]
 *     description: Retrieve all users (church admins and parishioners) belonging to a specific parish with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parish ID to filter users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       user_type:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       church_admin_id:
 *                         type: integer
 *                         nullable: true
 *                       admin_role:
 *                         type: string
 *                         nullable: true
 *                         description: Role of the church admin (e.g., Pastor, Administrator, Secretary)
 *                       admin_department:
 *                         type: string
 *                         nullable: true
 *                         description: Department of the church admin
 *                       is_primary_admin:
 *                         type: boolean
 *                         nullable: true
 *                         description: Whether this is the primary admin for the parish
 *                       parishioner_id:
 *                         type: integer
 *                         nullable: true
 *                       ward_id:
 *                         type: integer
 *                         nullable: true
 *                       ward_name:
 *                         type: string
 *                         nullable: true
 *                       family_id:
 *                         type: integer
 *                         nullable: true
 *                       family_name:
 *                         type: string
 *                         nullable: true
 *                       roles:
 *                         type: array
 *                         description: Array of roles assigned to the user
 *                         items:
 *                           type: object
 *                           properties:
 *                             role_id:
 *                               type: integer
 *                             role_name:
 *                               type: string
 *                             role_code:
 *                               type: string
 *                             description:
 *                               type: string
 *                             assigned_at:
 *                               type: string
 *                               format: date-time
 *                             expires_at:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalRecords:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid parish ID
 *       401:
 *         description: Unauthorized
 */
router.get('/users/parish/:parishId', RoleController.getUsersByParish);

export default router;
