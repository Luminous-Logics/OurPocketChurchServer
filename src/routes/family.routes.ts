import { Router } from 'express';
import { FamilyController } from '../controllers/family.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createFamilySchema,
  updateFamilySchema,
  familyIdSchema,
  familiesByParishSchema,
  familiesByWardSchema,
  searchFamilySchema,
  bulkCreateSchema,
} from '../validators/family.validator';
import { uploadCSV } from '../config/multer';

const router = Router();

/**
 * @swagger
 * /families/parish/{parishId}:
 *   get:
 *     summary: Get all families for a parish
 *     tags: [Families]
 *     description: Retrieve a paginated list of all active families in a specific parish
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
 *         description: List of families retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedFamilyResponse'
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId', authenticate, requirePermission('VIEW_FAMILIES'), validate(familiesByParishSchema), FamilyController.getByParishId);

/**
 * @swagger
 * /families/parish/{parishId}/all:
 *   get:
 *     summary: Get all families for a parish (no pagination)
 *     tags: [Families]
 *     description: Retrieve all active families in a specific parish without pagination
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: List of all families retrieved successfully
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
 *                     $ref: '#/components/schemas/Family'
 */
router.get('/parish/:parishId/all', authenticate, requirePermission('VIEW_FAMILIES'), FamilyController.getAllByParish);

/**
 * @swagger
 * /families/parish/{parishId}/search:
 *   get:
 *     summary: Search families in a parish
 *     tags: [Families]
 *     description: Search for families by name within a parish
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
 *                     $ref: '#/components/schemas/Family'
 */
router.get('/parish/:parishId/search', authenticate, requirePermission('VIEW_FAMILIES'), validate(searchFamilySchema), FamilyController.search);

/**
 * @swagger
 * /families/ward/{wardId}:
 *   get:
 *     summary: Get all families for a ward
 *     tags: [Families]
 *     description: Retrieve a paginated list of all active families in a specific ward
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
 *         description: List of families retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedFamilyResponse'
 *       404:
 *         description: Ward not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/ward/:wardId', authenticate, requirePermission('VIEW_FAMILIES'), validate(familiesByWardSchema), FamilyController.getByWardId);

/**
 * @swagger
 * /families/{id}:
 *   get:
 *     summary: Get family by ID
 *     tags: [Families]
 *     description: Retrieve a specific family by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Family ID
 *     responses:
 *       200:
 *         description: Family retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Family'
 *       404:
 *         description: Family not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, requirePermission('VIEW_FAMILIES'), validate(familyIdSchema), FamilyController.getById);

/**
 * @swagger
 * /families/bulk-create:
 *   post:
 *     summary: Bulk create/update family with members and ward
 *     tags: [Families]
 *     description: Create or use existing family and ward, then add members in a single transaction (Church Admin only)
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
 *               - family
 *               - members
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 description: ID of the parish
 *                 example: 1
 *               ward:
 *                 type: object
 *                 description: Ward information (optional - can create new or use existing). Provide EITHER ward_id OR ward_name, not both
 *                 properties:
 *                   ward_id:
 *                     type: integer
 *                     description: Existing ward ID (use this to assign to existing ward)
 *                     example: 5
 *                   ward_name:
 *                     type: string
 *                     description: Name for new ward (use this to create new ward)
 *                     example: "St. Mary Ward"
 *                   ward_number:
 *                     type: string
 *                     description: Ward number (for new ward)
 *                     example: "W001"
 *                   description:
 *                     type: string
 *                     description: Ward description (for new ward)
 *                   coordinator_id:
 *                     type: integer
 *                     description: Coordinator parishioner ID (for new ward)
 *                   area_coverage:
 *                     type: string
 *                     description: Geographic area coverage (for new ward)
 *               family:
 *                 type: object
 *                 description: Family information. Provide EITHER family_id (existing) OR family_name (new), not both
 *                 properties:
 *                   family_id:
 *                     type: integer
 *                     description: Existing family ID (use this to add members to existing family)
 *                     example: 10
 *                   family_name:
 *                     type: string
 *                     description: Name of new family (use this to create new family)
 *                     example: "The Smith Family"
 *                   home_phone:
 *                     type: string
 *                     description: Family home phone (for new family)
 *                     example: "+1-555-0100"
 *                   registration_date:
 *                     type: string
 *                     format: date
 *                     description: Registration date (for new family)
 *                   update_ward:
 *                     type: boolean
 *                     description: Set to true to update existing family's ward (only when using family_id)
 *                     example: true
 *                   update_primary_contact:
 *                     type: boolean
 *                     description: Set to true to update existing family's primary contact (only when using family_id)
 *                     example: false
 *               members:
 *                 type: array
 *                 description: Array of family members to add (at least one required)
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - first_name
 *                     - last_name
 *                     - email
 *                   properties:
 *                     first_name:
 *                       type: string
 *                       example: "John"
 *                     last_name:
 *                       type: string
 *                       example: "Smith"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.smith@example.com"
 *                     password:
 *                       type: string
 *                       description: Password (defaults to Parish@123 if not provided)
 *                       example: "SecurePass@123"
 *                     phone:
 *                       type: string
 *                       example: "+1-555-0101"
 *                     middle_name:
 *                       type: string
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other]
 *                     marital_status:
 *                       type: string
 *                       enum: [single, married, widowed, divorced, separated]
 *                     occupation:
 *                       type: string
 *                     is_primary_contact:
 *                       type: boolean
 *                       description: Set to true to make this member the primary contact
 *     responses:
 *       201:
 *         description: Successfully added members and/or created family/ward
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
 *                   example: Successfully added 2 member(s), created ward, created family
 *                 data:
 *                   type: object
 *                   properties:
 *                     ward_id:
 *                       type: integer
 *                     ward_created:
 *                       type: boolean
 *                       description: True if ward was created, false if existing
 *                     family:
 *                       $ref: '#/components/schemas/Family'
 *                     family_created:
 *                       type: boolean
 *                       description: True if family was created, false if existing
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total_members_created:
 *                       type: integer
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/bulk-create', authenticate, requirePermission('MANAGE_FAMILIES'), validate(bulkCreateSchema), FamilyController.bulkCreate);

/**
 * @swagger
 * /families/bulk-upload-csv:
 *   post:
 *     summary: Bulk upload families and members from CSV file
 *     tags: [Families]
 *     description: Upload a CSV file to create multiple families and members in a single operation (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - parish_id
 *               - file
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 description: ID of the parish
 *                 example: 1
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file (max 5MB)
 *     responses:
 *       201:
 *         description: Bulk upload completed successfully
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
 *                   example: Bulk upload completed. Created 10 families and 25 members.
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalFamilies:
 *                           type: integer
 *                         totalMembers:
 *                           type: integer
 *                         totalErrors:
 *                           type: integer
 *                     createdFamilies:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdMembers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - Invalid CSV or missing data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/bulk-upload-csv', authenticate, requirePermission('MANAGE_FAMILIES'), uploadCSV.single('file'), FamilyController.bulkUploadCSV);

/**
 * @swagger
 * /families:
 *   post:
 *     summary: Create a new family
 *     tags: [Families]
 *     description: Create a new family within a parish (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFamily'
 *     responses:
 *       201:
 *         description: Family created successfully
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
 *                   example: Family created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Family'
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
router.post('/', authenticate, requirePermission('MANAGE_FAMILIES'), validate(createFamilySchema), FamilyController.create);

/**
 * @swagger
 * /families/{id}:
 *   put:
 *     summary: Update a family
 *     tags: [Families]
 *     description: Update family information (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Family ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFamily'
 *     responses:
 *       200:
 *         description: Family updated successfully
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
 *                   example: Family updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Family'
 *       404:
 *         description: Family not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, requirePermission('MANAGE_FAMILIES'), validate(familyIdSchema), validate(updateFamilySchema), FamilyController.update);

/**
 * @swagger
 * /families/{id}:
 *   delete:
 *     summary: Delete a family
 *     tags: [Families]
 *     description: Soft delete a family (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Family ID
 *     responses:
 *       200:
 *         description: Family deleted successfully
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
 *                   example: Family deleted successfully
 *       404:
 *         description: Family not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, requirePermission('MANAGE_FAMILIES'), validate(familyIdSchema), FamilyController.delete);

export default router;
