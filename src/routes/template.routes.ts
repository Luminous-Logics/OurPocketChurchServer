import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdSchema,
  templatesByParishSchema,
  templatesByCategorySchema,
} from '../validators/template.validator';

const router = Router();

// =====================================================
// TEMPLATE ROUTES
// =====================================================

/**
 * @swagger
 * /templates/parish/{parishId}:
 *   get:
 *     summary: Get all templates for a parish
 *     tags: [Templates]
 *     description: Retrieve a paginated list of all certificate templates in a specific parish
 *     security:
 *       - bearerAuth: []
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
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Show only active templates
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully
 *       404:
 *         description: Parish not found
 */
router.get(
  '/parish/:parishId',
  authenticate,
  requirePermission('VIEW_TEMPLATES'),
  validate(templatesByParishSchema),
  TemplateController.getByParishId
);

/**
 * @swagger
 * /templates/parish/{parishId}/category/{category}:
 *   get:
 *     summary: Get templates by category
 *     tags: [Templates]
 *     description: Retrieve all templates in a specific category for a parish
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get(
  '/parish/:parishId/category/:category',
  authenticate,
  requirePermission('VIEW_TEMPLATES'),
  validate(templatesByCategorySchema),
  TemplateController.getByCategory
);

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Templates]
 *     description: Retrieve a specific certificate template by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('VIEW_TEMPLATES'),
  validate(templateIdSchema),
  TemplateController.getById
);

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Create a new template
 *     tags: [Templates]
 *     description: Create a new certificate template with HTML content. Placeholders like {{name}}, {{date}} will be automatically extracted.
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
 *               - template_name
 *               - template_code
 *               - html_content
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 example: 1
 *               template_name:
 *                 type: string
 *                 example: "Marriage Certificate"
 *               template_code:
 *                 type: string
 *                 example: "MARRIAGE_CERT"
 *               description:
 *                 type: string
 *               html_content:
 *                 type: string
 *                 example: "<div><h1>Certificate</h1><p>{{name}} on {{date}}</p></div>"
 *               category:
 *                 type: string
 *                 example: "Sacraments"
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  authenticate,
  requirePermission('CREATE_TEMPLATE'),
  validate(createTemplateSchema),
  TemplateController.create
);

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     summary: Update template
 *     tags: [Templates]
 *     description: Update an existing certificate template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_name:
 *                 type: string
 *               html_content:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('EDIT_TEMPLATE'),
  validate(templateIdSchema),
  validate(updateTemplateSchema),
  TemplateController.update
);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     summary: Delete template
 *     tags: [Templates]
 *     description: Soft delete a certificate template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('DELETE_TEMPLATE'),
  validate(templateIdSchema),
  TemplateController.delete
);

export default router;
