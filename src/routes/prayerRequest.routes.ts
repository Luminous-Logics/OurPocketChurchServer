import { Router } from 'express';
import { PrayerRequestController } from '../controllers/prayerRequest.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { createPrayerRequestSchema, parishIdSchema } from '../validators/prayerRequest.validator';

const router = Router();

/**
 * @swagger
 * /prayer-requests/parish/{parishId}/active:
 *   get:
 *     summary: Get active/new prayer requests
 *     tags: [Prayer Requests]
 *     description: Retrieve all pending and confirmed prayer requests for the "Active/New" tab
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Active prayer requests retrieved successfully
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
 *                     $ref: '#/components/schemas/PrayerRequest'
 */
router.get(
  '/parish/:parishId/active',
  authenticate,
  requirePermission('VIEW_PRAYER_REQUESTS'),
  validate(parishIdSchema),
  PrayerRequestController.getActiveRequests
);

/**
 * @swagger
 * /prayer-requests/parish/{parishId}/past:
 *   get:
 *     summary: Get past prayer requests
 *     tags: [Prayer Requests]
 *     description: Retrieve all completed and cancelled prayer requests for the "Past Requests" tab
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Past prayer requests retrieved successfully
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
 *                     $ref: '#/components/schemas/PrayerRequest'
 */
router.get(
  '/parish/:parishId/past',
  authenticate,
  requirePermission('VIEW_PRAYER_REQUESTS'),
  validate(parishIdSchema),
  PrayerRequestController.getPastRequests
);

/**
 * @swagger
 * /prayer-requests:
 *   post:
 *     summary: Create a new prayer request
 *     tags: [Prayer Requests]
 *     description: Submit a new prayer request with optional slot booking
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
 *               - requester_name
 *               - subject
 *               - description
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 description: ID of the parish
 *               requester_name:
 *                 type: string
 *                 description: Your name
 *                 example: John Doe
 *               subject:
 *                 type: string
 *                 description: Prayer subject
 *                 example: Prayer for healing
 *               description:
 *                 type: string
 *                 description: Detailed description
 *                 example: Please pray for my mother's recovery from surgery.
 *               booking_date:
 *                 type: string
 *                 format: date
 *                 description: Optional - Date for prayer slot (if "Book a prayer slot" is checked)
 *               booking_time:
 *                 type: string
 *                 description: Optional - Time for prayer slot (HH:MM format)
 *                 example: "10:00"
 *               is_anonymous:
 *                 type: boolean
 *                 default: false
 *               is_urgent:
 *                 type: boolean
 *                 default: false
 *               is_public:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Prayer request created successfully
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
 *                   example: Prayer request created successfully
 *                 data:
 *                   $ref: '#/components/schemas/PrayerRequest'
 */
router.post(
  '/',
  authenticate,
  requirePermission('CREATE_PRAYER_REQUEST'),
  validate(createPrayerRequestSchema),
  PrayerRequestController.create
);

/**
 * @swagger
 * /prayer-requests/{id}/approve:
 *   patch:
 *     summary: Approve a prayer request
 *     tags: [Prayer Requests]
 *     description: Approve a pending prayer request (changes status to 'confirmed')
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Prayer request ID
 *     responses:
 *       200:
 *         description: Prayer request approved successfully
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
 *                   example: Prayer request approved successfully
 *                 data:
 *                   $ref: '#/components/schemas/PrayerRequest'
 */
router.patch(
  '/:id/approve',
  authenticate,
  requirePermission('MANAGE_PRAYER_REQUESTS'),
  PrayerRequestController.approve
);

/**
 * @swagger
 * /prayer-requests/{id}/close:
 *   patch:
 *     summary: Close a prayer request
 *     tags: [Prayer Requests]
 *     description: Close a prayer request (changes status to 'completed')
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Prayer request ID
 *     responses:
 *       200:
 *         description: Prayer request closed successfully
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
 *                   example: Prayer request closed successfully
 *                 data:
 *                   $ref: '#/components/schemas/PrayerRequest'
 */
router.patch(
  '/:id/close',
  authenticate,
  requirePermission('MANAGE_PRAYER_REQUESTS'),
  PrayerRequestController.close
);

/**
 * @swagger
 * /prayer-requests/auto-archive:
 *   post:
 *     summary: Manually trigger auto-archive (Testing/Admin)
 *     tags: [Prayer Requests]
 *     description: Manually archive prayer requests older than specified days (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of days old to archive (default 10)
 *     responses:
 *       200:
 *         description: Auto-archive completed successfully
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
 *                   example: Auto-archive completed 5 prayer requests archived
 *                 data:
 *                   type: object
 *                   properties:
 *                     archived_count:
 *                       type: integer
 *                       example: 5
 *                     days_threshold:
 *                       type: integer
 *                       example: 10
 */
router.post(
  '/auto-archive',
  authenticate,
  requirePermission('MANAGE_PRAYER_REQUESTS'),
  PrayerRequestController.manualArchive
);

/**
 * @swagger
 * components:
 *   schemas:
 *     PrayerRequest:
 *       type: object
 *       properties:
 *         prayer_request_id:
 *           type: integer
 *         parish_id:
 *           type: integer
 *         requested_by:
 *           type: integer
 *         requester_name:
 *           type: string
 *           example: John Doe
 *         subject:
 *           type: string
 *           example: Prayer for healing
 *         description:
 *           type: string
 *           example: Please pray for my mother's recovery from surgery.
 *         booking_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         booking_time:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           example: pending
 *         is_anonymous:
 *           type: boolean
 *         is_urgent:
 *           type: boolean
 *         is_public:
 *           type: boolean
 *         approved_by:
 *           type: integer
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

export default router;
