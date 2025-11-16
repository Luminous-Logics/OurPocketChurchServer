import express from 'express';
import { TemplateController } from '../controllers/template.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { validate } from '../middleware/validate';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdSchema,
  templatesByParishSchema,
  searchTemplatesSchema,
  templateCategoriesSchema,
} from '../validators/template.validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: HTML Template management endpoints
 */

/**
 * @swagger
 * /api/templates/parish/{parishId}:
 *   get:
 *     summary: Get all templates for a parish
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parish ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully
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
 *                     $ref: '#/components/schemas/Template'
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 * /api/templates/parish/{parishId}/search:
 *   get:
 *     summary: Search templates by name, code, or description
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parish ID
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
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
 *                     $ref: '#/components/schemas/Template'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/parish/:parishId/search',
  authenticate,
  requirePermission('VIEW_TEMPLATES'),
  validate(searchTemplatesSchema),
  TemplateController.search
);

/**
 * @swagger
 * /api/templates/parish/{parishId}/categories:
 *   get:
 *     summary: Get all unique template categories for a parish
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/parish/:parishId/categories',
  authenticate,
  requirePermission('VIEW_TEMPLATES'),
  validate(templateCategoriesSchema),
  TemplateController.getCategories
);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get a template by ID
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 * /api/templates:
 *   post:
 *     summary: Create a new template
 *     tags: [Templates]
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
 *                 example: "Weekly Bulletin Template"
 *               template_code:
 *                 type: string
 *                 pattern: "^[A-Z0-9_]+$"
 *                 example: "WEEKLY_BULLETIN"
 *               description:
 *                 type: string
 *                 example: "Template for weekly parish bulletin"
 *               html_content:
 *                 type: string
 *                 example: "<html><body><h1>{{title}}</h1><p>{{content}}</p></body></html>"
 *               category:
 *                 type: string
 *                 example: "bulletin"
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Template created successfully
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
 *                   example: "Template created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Template code already exists
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
 * /api/templates/{id}:
 *   put:
 *     summary: Update a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_name:
 *                 type: string
 *                 example: "Updated Bulletin Template"
 *               template_code:
 *                 type: string
 *                 pattern: "^[A-Z0-9_]+$"
 *                 example: "UPDATED_BULLETIN"
 *               description:
 *                 type: string
 *                 example: "Updated template for weekly parish bulletin"
 *               html_content:
 *                 type: string
 *                 example: "<html><body><h1>{{title}}</h1><p>{{content}}</p></body></html>"
 *               category:
 *                 type: string
 *                 example: "bulletin"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Template updated successfully
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
 *                   example: "Template updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Template not found
 *       409:
 *         description: Template code already exists
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('EDIT_TEMPLATE'),
  validate(updateTemplateSchema),
  TemplateController.update
);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Soft delete a template (sets is_active to false)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
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
 *                   example: "Template deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
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

/**
 * @swagger
 * /api/templates/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a template (hard delete)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template permanently deleted
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
 *                   example: "Template permanently deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Template not found
 */
router.delete(
  '/:id/permanent',
  authenticate,
  requirePermission('MANAGE_TEMPLATES'),
  validate(templateIdSchema),
  TemplateController.hardDelete
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       properties:
 *         template_id:
 *           type: integer
 *           example: 1
 *         parish_id:
 *           type: integer
 *           example: 1
 *         template_name:
 *           type: string
 *           example: "Weekly Bulletin Template"
 *         template_code:
 *           type: string
 *           example: "WEEKLY_BULLETIN"
 *         description:
 *           type: string
 *           example: "Template for weekly parish bulletin"
 *         html_content:
 *           type: string
 *           example: "<html><body><h1>{{title}}</h1></body></html>"
 *         category:
 *           type: string
 *           example: "bulletin"
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_by:
 *           type: integer
 *           example: 1
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-11-16T10:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2025-11-16T10:00:00Z"
 */

export default router;
