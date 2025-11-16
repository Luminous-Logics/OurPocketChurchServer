import express from 'express';
import { CertificateTypeController } from '../controllers/certificateType.controller';
import { CertificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { validate } from '../middleware/validate';
import {
  createCertificateTypeSchema,
  updateCertificateTypeSchema,
  certificateTypeIdSchema,
  certificateTypesByParishSchema,
  createCertificateSchema,
  updateCertificateSchema,
  certificateIdSchema,
  certificateNumberSchema,
  certificatesByParishSchema,
  approveCertificateSchema,
  revokeCertificateSchema,
} from '../validators/certificate.validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate management endpoints (types and certificates)
 */

/**
 * ============================================
 * CERTIFICATE TYPES ROUTES
 * ============================================
 */

/**
 * @swagger
 * /api/certificates/types/parish/{parishId}:
 *   get:
 *     summary: Get all certificate types for a parish
 *     tags: [Certificates]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Certificate types retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/types/parish/:parishId',
  authenticate,
  requirePermission('VIEW_CERTIFICATE_TYPES'),
  validate(certificateTypesByParishSchema),
  CertificateTypeController.getByParishId
);

/**
 * @swagger
 * /api/certificates/types/{id}:
 *   get:
 *     summary: Get a certificate type by ID
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate type retrieved successfully
 *       404:
 *         description: Certificate type not found
 */
router.get(
  '/types/:id',
  authenticate,
  requirePermission('VIEW_CERTIFICATE_TYPES'),
  validate(certificateTypeIdSchema),
  CertificateTypeController.getById
);

/**
 * @swagger
 * /api/certificates/types:
 *   post:
 *     summary: Create a new certificate type
 *     tags: [Certificates]
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
 *               - type_name
 *               - type_code
 *             properties:
 *               parish_id:
 *                 type: integer
 *               type_name:
 *                 type: string
 *                 example: "Death Certificate"
 *               type_code:
 *                 type: string
 *                 example: "DEATH"
 *               description:
 *                 type: string
 *               default_template_id:
 *                 type: integer
 *               requires_approval:
 *                 type: boolean
 *                 default: true
 *               auto_generate_number:
 *                 type: boolean
 *                 default: true
 *               number_prefix:
 *                 type: string
 *                 example: "DEATH-"
 *               number_format:
 *                 type: string
 *                 example: "{PREFIX}{YEAR}-{NUMBER:3}"
 *               available_placeholders:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["recipient_name", "date", "age", "priest_name"]
 *     responses:
 *       201:
 *         description: Certificate type created successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Certificate type code already exists
 */
router.post(
  '/types',
  authenticate,
  requirePermission('CREATE_CERTIFICATE_TYPE'),
  validate(createCertificateTypeSchema),
  CertificateTypeController.create
);

/**
 * @swagger
 * /api/certificates/types/{id}:
 *   put:
 *     summary: Update a certificate type
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               type_name:
 *                 type: string
 *               type_code:
 *                 type: string
 *               description:
 *                 type: string
 *               default_template_id:
 *                 type: integer
 *               requires_approval:
 *                 type: boolean
 *               auto_generate_number:
 *                 type: boolean
 *               number_prefix:
 *                 type: string
 *               number_format:
 *                 type: string
 *               available_placeholders:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Certificate type updated successfully
 *       404:
 *         description: Certificate type not found
 */
router.put(
  '/types/:id',
  authenticate,
  requirePermission('EDIT_CERTIFICATE_TYPE'),
  validate(updateCertificateTypeSchema),
  CertificateTypeController.update
);

/**
 * @swagger
 * /api/certificates/types/{id}:
 *   delete:
 *     summary: Deactivate a certificate type (soft delete)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate type deactivated successfully
 *       404:
 *         description: Certificate type not found
 */
router.delete(
  '/types/:id',
  authenticate,
  requirePermission('DELETE_CERTIFICATE_TYPE'),
  validate(certificateTypeIdSchema),
  CertificateTypeController.delete
);

/**
 * @swagger
 * /api/certificates/types/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a certificate type
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate type permanently deleted
 *       400:
 *         description: Cannot delete - certificates exist using this type
 *       404:
 *         description: Certificate type not found
 */
router.delete(
  '/types/:id/permanent',
  authenticate,
  requirePermission('MANAGE_CERTIFICATES'),
  validate(certificateTypeIdSchema),
  CertificateTypeController.hardDelete
);

/**
 * ============================================
 * CERTIFICATES ROUTES
 * ============================================
 */

/**
 * @swagger
 * /api/certificates/parish/{parishId}:
 *   get:
 *     summary: Get all certificates for a parish
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: certificateTypeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_approval, approved, issued, revoked, cancelled]
 *       - in: query
 *         name: recipientName
 *         schema:
 *           type: string
 *       - in: query
 *         name: issueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: issueDateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 */
router.get(
  '/parish/:parishId',
  authenticate,
  requirePermission('VIEW_CERTIFICATES'),
  validate(certificatesByParishSchema),
  CertificateController.getByParishId
);

/**
 * @swagger
 * /api/certificates/number/{certificateNumber}:
 *   get:
 *     summary: Get a certificate by certificate number
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificateNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate retrieved successfully
 *       404:
 *         description: Certificate not found
 */
router.get(
  '/number/:certificateNumber',
  authenticate,
  requirePermission('VIEW_CERTIFICATES'),
  validate(certificateNumberSchema),
  CertificateController.getByNumber
);

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get a certificate by ID
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate retrieved successfully
 *       404:
 *         description: Certificate not found
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('VIEW_CERTIFICATES'),
  validate(certificateIdSchema),
  CertificateController.getById
);

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Issue a new certificate
 *     tags: [Certificates]
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
 *               - certificate_type_id
 *               - recipient_name
 *               - certificate_data
 *               - issue_date
 *             properties:
 *               parish_id:
 *                 type: integer
 *               certificate_type_id:
 *                 type: integer
 *               certificate_number:
 *                 type: string
 *                 description: Optional - auto-generated if not provided
 *               recipient_parishioner_id:
 *                 type: integer
 *               recipient_name:
 *                 type: string
 *               template_id:
 *                 type: integer
 *               certificate_data:
 *                 type: object
 *                 example: {"date": "Jan 15, 2024", "age": "75", "priest_name": "Fr. John"}
 *               seal_image_url:
 *                 type: string
 *               signature_image_url:
 *                 type: string
 *               signed_by:
 *                 type: string
 *               signed_by_user_id:
 *                 type: integer
 *               issue_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, pending_approval, approved, issued]
 *               notes:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Certificate created successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  '/',
  authenticate,
  requirePermission('CREATE_CERTIFICATE'),
  validate(createCertificateSchema),
  CertificateController.create
);

/**
 * @swagger
 * /api/certificates/{id}:
 *   put:
 *     summary: Update a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               recipient_parishioner_id:
 *                 type: integer
 *               recipient_name:
 *                 type: string
 *               template_id:
 *                 type: integer
 *               certificate_data:
 *                 type: object
 *               seal_image_url:
 *                 type: string
 *               signature_image_url:
 *                 type: string
 *               signed_by:
 *                 type: string
 *               issue_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, pending_approval, approved, issued]
 *               notes:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Certificate updated successfully
 *       404:
 *         description: Certificate not found
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('EDIT_CERTIFICATE'),
  validate(updateCertificateSchema),
  CertificateController.update
);

/**
 * @swagger
 * /api/certificates/{id}/approve:
 *   post:
 *     summary: Approve a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate approved successfully
 *       400:
 *         description: Certificate not in pending_approval status
 *       404:
 *         description: Certificate not found
 */
router.post(
  '/:id/approve',
  authenticate,
  requirePermission('APPROVE_CERTIFICATE'),
  validate(approveCertificateSchema),
  CertificateController.approve
);

/**
 * @swagger
 * /api/certificates/{id}/revoke:
 *   post:
 *     summary: Revoke a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Certificate issued in error"
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *       404:
 *         description: Certificate not found
 */
router.post(
  '/:id/revoke',
  authenticate,
  requirePermission('REVOKE_CERTIFICATE'),
  validate(revokeCertificateSchema),
  CertificateController.revoke
);

/**
 * @swagger
 * /api/certificates/{id}/history:
 *   get:
 *     summary: Get certificate audit history
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate history retrieved successfully
 *       404:
 *         description: Certificate not found
 */
router.get(
  '/:id/history',
  authenticate,
  requirePermission('VIEW_CERTIFICATES'),
  validate(certificateIdSchema),
  CertificateController.getHistory
);

/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Delete a certificate (only drafts)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate deleted successfully
 *       400:
 *         description: Only draft certificates can be deleted
 *       404:
 *         description: Certificate not found
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('DELETE_CERTIFICATE'),
  validate(certificateIdSchema),
  CertificateController.delete
);

/**
 * @swagger
 * components:
 *   schemas:
 *     CertificateType:
 *       type: object
 *       properties:
 *         certificate_type_id:
 *           type: integer
 *         parish_id:
 *           type: integer
 *         type_name:
 *           type: string
 *         type_code:
 *           type: string
 *         description:
 *           type: string
 *         default_template_id:
 *           type: integer
 *         requires_approval:
 *           type: boolean
 *         auto_generate_number:
 *           type: boolean
 *         number_prefix:
 *           type: string
 *         number_format:
 *           type: string
 *         available_placeholders:
 *           type: array
 *           items:
 *             type: string
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Certificate:
 *       type: object
 *       properties:
 *         certificate_id:
 *           type: integer
 *         parish_id:
 *           type: integer
 *         certificate_type_id:
 *           type: integer
 *         certificate_number:
 *           type: string
 *         recipient_parishioner_id:
 *           type: integer
 *         recipient_name:
 *           type: string
 *         template_id:
 *           type: integer
 *         certificate_data:
 *           type: object
 *         generated_html:
 *           type: string
 *         seal_image_url:
 *           type: string
 *         signature_image_url:
 *           type: string
 *         signed_by:
 *           type: string
 *         signed_by_user_id:
 *           type: integer
 *         issue_date:
 *           type: string
 *           format: date
 *         issued_by:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [draft, pending_approval, approved, issued, revoked, cancelled]
 *         approved_by:
 *           type: integer
 *         approved_at:
 *           type: string
 *           format: date-time
 *         revoked_at:
 *           type: string
 *           format: date-time
 *         revoked_by:
 *           type: integer
 *         revocation_reason:
 *           type: string
 *         notes:
 *           type: string
 *         is_public:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

export default router;
