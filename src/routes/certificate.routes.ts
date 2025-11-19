import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  issueCertificateSchema,
  revokeCertificateSchema,
  certificateIdSchema,
  certificatesByParishSchema,
} from '../validators/certificate.validator';

const router = Router();

// =====================================================
// CERTIFICATE ROUTES
// =====================================================

/**
 * @swagger
 * /certificates/parish/{parishId}:
 *   get:
 *     summary: Get all certificates for a parish
 *     tags: [Certificates]
 *     description: Retrieve a paginated list of all issued certificates in a specific parish
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_approval, approved, issued, revoked, cancelled]
 *         description: Filter by certificate status
 *     responses:
 *       200:
 *         description: List of certificates retrieved successfully
 *       404:
 *         description: Parish not found
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
 * /certificates/{id}:
 *   get:
 *     summary: Get certificate by ID
 *     tags: [Certificates]
 *     description: Retrieve a specific certificate by its ID with all details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificate_id:
 *                       type: integer
 *                     certificate_number:
 *                       type: string
 *                       example: "MAR-2024-0001"
 *                     pdf_url:
 *                       type: string
 *                     status:
 *                       type: string
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
 * /certificates/{id}/history:
 *   get:
 *     summary: Get certificate history
 *     tags: [Certificates]
 *     description: Retrieve the complete audit trail for a certificate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate history retrieved successfully
 *       404:
 *         description: Certificate not found
 */
router.get(
  '/:id/history',
  authenticate,
  requirePermission('VIEW_CERTIFICATE_HISTORY'),
  validate(certificateIdSchema),
  CertificateController.getHistory
);

/**
 * @swagger
 * /certificates/{id}/download:
 *   get:
 *     summary: Download certificate PDF
 *     tags: [Certificates]
 *     description: Generate and download the certificate PDF on-demand
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Certificate not found
 */
router.get(
  '/:id/download',
  authenticate,
  requirePermission('DOWNLOAD_CERTIFICATE'),
  validate(certificateIdSchema),
  CertificateController.download
);

/**
 * @swagger
 * /certificates/issue:
 *   post:
 *     summary: Issue a new certificate
 *     tags: [Certificates]
 *     description: Issue a new certificate by providing placeholder values. PDF will be generated on-demand when downloaded.
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
 *               - placeholder_values
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 example: 1
 *               certificate_type_id:
 *                 type: integer
 *                 example: 1
 *                 description: The certificate type to issue (must have a linked template)
 *               parishioner_id:
 *                 type: integer
 *                 example: 123
 *                 description: Optional - Link to a parishioner record
 *               placeholder_values:
 *                 type: object
 *                 example: {"bride_name": "Jane Smith", "groom_name": "John Doe", "marriage_date": "January 15, 2024"}
 *                 description: Key-value pairs matching the template placeholders
 *     responses:
 *       201:
 *         description: Certificate issued successfully
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
 *                   example: "Certificate issued successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificate_id:
 *                       type: integer
 *                       example: 1
 *                     certificate_number:
 *                       type: string
 *                       example: "MAR-2024-0001"
 *                     status:
 *                       type: string
 *                       example: "issued"
 *       400:
 *         description: Invalid input or missing required placeholders
 *       404:
 *         description: Certificate type or template not found
 */
router.post(
  '/issue',
  authenticate,
  requirePermission('ISSUE_CERTIFICATE'),
  validate(issueCertificateSchema),
  CertificateController.issue
);

/**
 * @swagger
 * /certificates/{id}/revoke:
 *   put:
 *     summary: Revoke a certificate
 *     tags: [Certificates]
 *     description: Revoke an issued certificate with a reason
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Certificate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - revocation_reason
 *             properties:
 *               revocation_reason:
 *                 type: string
 *                 example: "Incorrect information provided"
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *       400:
 *         description: Certificate is already revoked
 *       404:
 *         description: Certificate not found
 */
router.put(
  '/:id/revoke',
  authenticate,
  requirePermission('REVOKE_CERTIFICATE'),
  validate(revokeCertificateSchema),
  CertificateController.revoke
);

export default router;
