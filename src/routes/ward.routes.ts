import { Router } from 'express';
import { WardController } from '../controllers/ward.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createWardSchema,
  updateWardSchema,
  wardIdSchema,
  wardsByParishSchema,
  searchWardSchema,
  updateWardCountsSchema,
} from '../validators/ward.validator';

const router = Router();

// =====================================================
// WARD ROLES ROUTES (Must be before /:id routes!)
// =====================================================

/**
 * @swagger
 * /wards/role-types:
 *   get:
 *     summary: Get available ward role types
 *     tags: [Ward Roles]
 *     description: Retrieve all available role types that can be assigned to ward members
 *     parameters:
 *       - in: query
 *         name: parishId
 *         schema:
 *           type: integer
 *         description: Filter roles by parish (includes parish-specific + global roles)
 *     responses:
 *       200:
 *         description: Ward role types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role_id:
 *                         type: integer
 *                       role_name:
 *                         type: string
 *                       role_code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       priority:
 *                         type: integer
 */
router.get('/role-types', authenticate, requirePermission('VIEW_WARDS'), WardController.getWardRoleTypes);

/**
 * @swagger
 * /wards/role-types:
 *   post:
 *     summary: Create a custom ward role type for a parish
 *     tags: [Ward Roles]
 *     description: Allow parishes to create their own custom ward roles (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parish_id
 *               - role_name
 *               - role_code
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 description: Parish ID that owns this custom role
 *                 example: 1
 *               role_name:
 *                 type: string
 *                 description: Display name for the role
 *                 example: "Ward Media Coordinator"
 *               role_code:
 *                 type: string
 *                 description: Unique code for the role (uppercase, no spaces)
 *                 example: "WARD_MEDIA_COORD"
 *               description:
 *                 type: string
 *                 description: Description of the role's responsibilities
 *                 example: "Manages social media and communications for the ward"
 *               priority:
 *                 type: integer
 *                 description: Priority for ordering (higher = more important)
 *                 default: 25
 *                 example: 30
 *     responses:
 *       201:
 *         description: Custom ward role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Custom ward role created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Missing required fields
 *       404:
 *         description: Parish not found
 *       409:
 *         description: Role code already exists for this parish
 */
router.post('/role-types', authenticate, requirePermission('CREATE_WARD'), WardController.createWardRoleType);

/**
 * @swagger
 * /wards/roles/{wardRoleId}:
 *   put:
 *     summary: Update a ward role assignment
 *     tags: [Ward Roles]
 *     description: Update an existing ward role assignment (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wardRoleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward Role Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               is_primary:
 *                 type: boolean
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ward role updated successfully
 *       404:
 *         description: Ward role assignment not found
 */
router.put('/roles/:wardRoleId', authenticate, requirePermission('EDIT_WARD'), WardController.updateWardRole);

/**
 * @swagger
 * /wards/roles/{wardRoleId}:
 *   delete:
 *     summary: Remove a ward role assignment
 *     tags: [Ward Roles]
 *     description: Remove a role assignment from a ward member (soft delete) (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wardRoleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward Role Assignment ID
 *     responses:
 *       200:
 *         description: Ward role removed successfully
 *       404:
 *         description: Ward role assignment not found
 */
router.delete('/roles/:wardRoleId', authenticate, requirePermission('DELETE_WARD'), WardController.removeWardRole);

/**
 * @swagger
 * /wards/parish/{parishId}:
 *   get:
 *     summary: Get all wards for a parish
 *     tags: [Wards]
 *     description: Retrieve a paginated list of all active wards in a specific parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of wards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedWardResponse'
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId', authenticate, requirePermission('VIEW_WARDS'), validate(wardsByParishSchema), WardController.getByParishId);

/**
 * @swagger
 * /wards/parish/{parishId}/all:
 *   get:
 *     summary: Get all wards for a parish (no pagination)
 *     tags: [Wards]
 *     description: Retrieve all active wards in a specific parish without pagination
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: List of all wards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ward'
 */
router.get('/parish/:parishId/all', authenticate, requirePermission('VIEW_WARDS'), WardController.getAllByParish);

/**
 * @swagger
 * /wards/parish/{parishId}/search:
 *   get:
 *     summary: Search wards in a parish
 *     tags: [Wards]
 *     description: Search for wards by name, number, or area coverage within a parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ward'
 */
router.get('/parish/:parishId/search', authenticate, requirePermission('VIEW_WARDS'), validate(searchWardSchema), WardController.search);

/**
 * @swagger
 * /wards/{id}:
 *   get:
 *     summary: Get ward by ID
 *     tags: [Wards]
 *     description: Retrieve a specific ward by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
 *     responses:
 *       200:
 *         description: Ward retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Ward'
 *       404:
 *         description: Ward not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, requirePermission('VIEW_WARDS'), validate(wardIdSchema), WardController.getById);

/**
 * @swagger
 * /wards:
 *   post:
 *     summary: Create a new ward
 *     tags: [Wards]
 *     description: Create a new ward within a parish (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWard'
 *     responses:
 *       201:
 *         description: Ward created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ward created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Ward'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Ward number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, requirePermission('CREATE_WARD'), validate(createWardSchema), WardController.create);

/**
 * @swagger
 * /wards/{id}:
 *   put:
 *     summary: Update a ward
 *     tags: [Wards]
 *     description: Update ward information (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWard'
 *     responses:
 *       200:
 *         description: Ward updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ward updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Ward'
 *       404:
 *         description: Ward not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, requirePermission('EDIT_WARD'), validate(wardIdSchema), validate(updateWardSchema), WardController.update);

/**
 * @swagger
 * /wards/{id}:
 *   delete:
 *     summary: Delete a ward
 *     tags: [Wards]
 *     description: Soft delete a ward (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
 *     responses:
 *       200:
 *         description: Ward deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ward deleted successfully
 *       404:
 *         description: Ward not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, requirePermission('DELETE_WARD'), validate(wardIdSchema), WardController.delete);

/**
 * @swagger
 * /wards/{id}/counts:
 *   patch:
 *     summary: Update ward member and family counts
 *     tags: [Wards]
 *     description: Update the total families and members count for a ward (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - total_families
 *               - total_members
 *             properties:
 *               total_families:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *               total_members:
 *                 type: integer
 *                 minimum: 0
 *                 example: 200
 *     responses:
 *       200:
 *         description: Ward counts updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch('/:id/counts', authenticate, requirePermission('EDIT_WARD'), validate(updateWardCountsSchema), WardController.updateCounts);

// Ward role routes for /:wardId/roles (these must come after /:id routes)
/**
 * @swagger
 * /wards/{wardId}/roles:
 *   get:
 *     summary: Get all roles assigned in a ward
 *     tags: [Ward Roles]
 *     description: Retrieve all role assignments for a specific ward with parishioner details
 *     parameters:
 *       - in: path
 *         name: wardId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
 *     responses:
 *       200:
 *         description: Ward roles retrieved successfully
 */
router.get('/:wardId/roles', authenticate, requirePermission('VIEW_WARDS'), WardController.getWardRoles);

/**
 * @swagger
 * /wards/{wardId}/roles:
 *   post:
 *     summary: Assign a role to a ward member
 *     tags: [Ward Roles]
 *     description: Assign a specific role to a parishioner in a ward (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wardId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parishioner_id
 *               - role_id
 *             properties:
 *               parishioner_id:
 *                 type: integer
 *               role_id:
 *                 type: integer
 *               role_name:
 *                 type: string
 *               is_primary:
 *                 type: boolean
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ward role assigned successfully
 */
router.post('/:wardId/roles', authenticate, requirePermission('MANAGE_WARDS'), WardController.assignWardRole);

/**
 * @swagger
 * /wards/{wardId}/roles/{roleId}/members:
 *   get:
 *     summary: Get all members with a specific role in a ward
 *     tags: [Ward Roles]
 *     description: Retrieve all parishioners who have a specific role in a ward
 *     parameters:
 *       - in: path
 *         name: wardId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: roleId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Ward role members retrieved successfully
 */
router.get('/:wardId/roles/:roleId/members', authenticate, requirePermission('VIEW_WARDS'), WardController.getWardRoleMembers);

export default router;
