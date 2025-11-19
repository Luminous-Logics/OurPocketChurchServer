import { Router } from 'express';
import { CertificateTypeController } from '../controllers/certificateType.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createCertificateTypeSchema,
  updateCertificateTypeSchema,
  certificateTypeIdSchema,
  certificateTypesByParishSchema,
} from '../validators/certificateType.validator';

const router = Router();

// =====================================================
// CERTIFICATE TYPE ROUTES
// =====================================================

/**
 * @swagger
 * /certificate-types/parish/{parishId}:
 *   get:
 *     summary: Get all certificate types for a parish
 *     tags: [Certificate Types]
 *     description: Retrieve a paginated list of all certificate types in a specific parish
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
 *         description: Show only active certificate types
 *     responses:
 *       200:
 *         description: List of certificate types retrieved successfully
 *       404:
 *         description: Parish not found
 */
router.get(
  '/parish/:parishId',
  authenticate,
  requirePermission('VIEW_CERTIFICATE_TYPES'),
  validate(certificateTypesByParishSchema),
  CertificateTypeController.getByParishId
);

/**
 * @swagger
 * /certificate-types/{id}:
 *   get:
 *     summary: Get certificate type by ID
 *     tags: [Certificate Types]
 *     description: Retrieve a specific certificate type by its ID with linked template details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Certificate Type ID
 *     responses:
 *       200:
 *         description: Certificate type retrieved successfully
 *       404:
 *         description: Certificate type not found
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('VIEW_CERTIFICATE_TYPES'),
  validate(certificateTypeIdSchema),
  CertificateTypeController.getById
);

/**
 * @swagger
 * /certificate-types:
 *   post:
 *     summary: Create a new certificate type
 *     tags: [Certificate Types]
 *     description: Create a new certificate type and link it to a template
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
 *               - template_id
 *               - type_name
 *               - type_code
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 example: 1
 *               template_id:
 *                 type: integer
 *                 example: 1
 *               type_name:
 *                 type: string
 *                 example: "Marriage Certificate"
 *               type_code:
 *                 type: string
 *                 example: "MARRIAGE"
 *               description:
 *                 type: string
 *               prefix:
 *                 type: string
 *                 example: "MAR"
 *     responses:
 *       201:
 *         description: Certificate type created successfully
 *       400:
 *         description: Invalid input or template not found
 */
router.post(
  '/',
  authenticate,
  requirePermission('CREATE_CERTIFICATE_TYPE'),
  validate(createCertificateTypeSchema),
  CertificateTypeController.create
);

/**
 * @swagger
 * /certificate-types/{id}:
 *   put:
 *     summary: Update certificate type
 *     tags: [Certificate Types]
 *     description: Update an existing certificate type
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
 *               template_id:
 *                 type: integer
 *               type_name:
 *                 type: string
 *               prefix:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Certificate type updated successfully
 *       404:
 *         description: Certificate type not found
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('EDIT_CERTIFICATE_TYPE'),
  validate(certificateTypeIdSchema),
  validate(updateCertificateTypeSchema),
  CertificateTypeController.update
);

/**
 * @swagger
 * /certificate-types/{id}:
 *   delete:
 *     summary: Delete certificate type
 *     tags: [Certificate Types]
 *     description: Soft delete a certificate type
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
 *         description: Certificate type deleted successfully
 *       404:
 *         description: Certificate type not found
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('DELETE_CERTIFICATE_TYPE'),
  validate(certificateTypeIdSchema),
  CertificateTypeController.delete
);

export default router;
