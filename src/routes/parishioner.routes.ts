import { Router } from 'express';
import { ParishionerController } from '../controllers/parishioner.controller';
import { WardController } from '../controllers/ward.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createParishionerSchema,
  updateParishionerSchema,
  parishionerIdSchema,
  parishionersByParishSchema,
  parishionersByWardSchema,
  parishionersByFamilySchema,
  searchParishionerSchema,
} from '../validators/parishioner.validator';

const router = Router();

/**
 * @swagger
 * /parishioners/parish/{parishId}:
 *   get:
 *     summary: Get all parishioners for a parish
 *     tags: [Parishioners]
 *     description: Retrieve a paginated list of all active parishioners in a specific parish
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
 *         description: List of parishioners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedParishionerResponse'
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId', authenticate, requirePermission('VIEW_PARISHIONERS'), validate(parishionersByParishSchema), ParishionerController.getByParishId);

/**
 * @swagger
 * /parishioners/parish/{parishId}/all:
 *   get:
 *     summary: Get all parishioners for a parish (no pagination)
 *     tags: [Parishioners]
 *     description: Retrieve all active parishioners in a specific parish without pagination
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: List of all parishioners retrieved successfully
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
 *                     $ref: '#/components/schemas/Parishioner'
 */
router.get('/parish/:parishId/all', authenticate, requirePermission('VIEW_PARISHIONERS'), ParishionerController.getAllByParish);

/**
 * @swagger
 * /parishioners/parish/{parishId}/search:
 *   get:
 *     summary: Search parishioners in a parish
 *     tags: [Parishioners]
 *     description: Search for parishioners by name or email within a parish
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
 *                     $ref: '#/components/schemas/Parishioner'
 */
router.get('/parish/:parishId/search', authenticate, requirePermission('VIEW_PARISHIONERS'), validate(searchParishionerSchema), ParishionerController.search);

/**
 * @swagger
 * /parishioners/ward/{wardId}:
 *   get:
 *     summary: Get all parishioners for a ward
 *     tags: [Parishioners]
 *     description: Retrieve a paginated list of all active parishioners in a specific ward
 *     parameters:
 *       - in: path
 *         name: wardId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ward ID
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
 *         description: List of parishioners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedParishionerResponse'
 *       404:
 *         description: Ward not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/ward/:wardId', authenticate, requirePermission('VIEW_PARISHIONERS'), validate(parishionersByWardSchema), ParishionerController.getByWardId);

/**
 * @swagger
 * /parishioners/family/{familyId}:
 *   get:
 *     summary: Get all parishioners for a family
 *     tags: [Parishioners]
 *     description: Retrieve all active parishioners in a specific family
 *     parameters:
 *       - in: path
 *         name: familyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Family ID
 *     responses:
 *       200:
 *         description: List of parishioners retrieved successfully
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
 *                     $ref: '#/components/schemas/Parishioner'
 *       404:
 *         description: Family not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/family/:familyId', authenticate, requirePermission('VIEW_PARISHIONERS'), validate(parishionersByFamilySchema), ParishionerController.getByFamilyId);

/**
 * @swagger
 * /parishioners/{id}:
 *   get:
 *     summary: Get parishioner by ID
 *     tags: [Parishioners]
 *     description: Retrieve a specific parishioner by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parishioner ID
 *     responses:
 *       200:
 *         description: Parishioner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Parishioner'
 *       404:
 *         description: Parishioner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, requirePermission('VIEW_PARISHIONERS'), validate(parishionerIdSchema), ParishionerController.getById);

/**
 * @swagger
 * /parishioners:
 *   post:
 *     summary: Create a new parishioner
 *     tags: [Parishioners]
 *     description: Create a new parishioner record within a parish (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateParishioner'
 *     responses:
 *       201:
 *         description: Parishioner created successfully
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
 *                   example: Parishioner created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Parishioner'
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
 */
router.post('/', authenticate, requirePermission('CREATE_PARISHIONER'), validate(createParishionerSchema), ParishionerController.create);

/**
 * @swagger
 * /parishioners/{id}:
 *   put:
 *     summary: Update a parishioner
 *     tags: [Parishioners]
 *     description: Update parishioner information (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parishioner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParishioner'
 *     responses:
 *       200:
 *         description: Parishioner updated successfully
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
 *                   example: Parishioner updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Parishioner'
 *       404:
 *         description: Parishioner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, requirePermission('EDIT_PARISHIONER'), validate(parishionerIdSchema), validate(updateParishionerSchema), ParishionerController.update);

/**
 * @swagger
 * /parishioners/{id}:
 *   delete:
 *     summary: Delete a parishioner
 *     tags: [Parishioners]
 *     description: Soft delete a parishioner (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parishioner ID
 *     responses:
 *       200:
 *         description: Parishioner deleted successfully
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
 *                   example: Parishioner deleted successfully
 *       404:
 *         description: Parishioner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, requirePermission('DELETE_PARISHIONER'), validate(parishionerIdSchema), ParishionerController.delete);

/**
 * @swagger
 * /parishioners/{parishionerId}/ward-roles:
 *   get:
 *     summary: Get all ward roles for a parishioner
 *     tags: [Parishioners]
 *     description: Retrieve all ward role assignments for a specific parishioner across all wards
 *     parameters:
 *       - in: path
 *         name: parishionerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parishioner ID
 *     responses:
 *       200:
 *         description: Parishioner ward roles retrieved successfully
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
 */
router.get('/:parishionerId/ward-roles', authenticate, requirePermission('VIEW_PARISHIONERS'), WardController.getParishionerWardRoles);

export default router;
