import { Router } from 'express';
import { ParishController } from '../controllers/parish.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createParishSchema,
  updateParishSchema,
  parishIdSchema,
  paginationSchema,
  searchParishSchema,
} from '../validators/parish.validator';

const router = Router();

/**
 * @swagger
 * /parishes:
 *   get:
 *     summary: Get all parishes
 *     tags: [Parishes]
 *     description: Retrieve a paginated list of all active parishes
 *     parameters:
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
 *         description: List of parishes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedParishResponse'
 */
router.get('/', authenticate, requirePermission('VIEW_PARISHES'), validate(paginationSchema), ParishController.getAll);

/**
 * @swagger
 * /parishes/search:
 *   get:
 *     summary: Search parishes
 *     tags: [Parishes]
 *     description: Search for parishes by name, city, or state
 *     parameters:
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
 *                     $ref: '#/components/schemas/Parish'
 *       400:
 *         description: Bad request - Search term is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', authenticate, requirePermission('VIEW_PARISHES'), validate(searchParishSchema), ParishController.search);

/**
 * @swagger
 * /parishes/{id}:
 *   get:
 *     summary: Get parish by ID
 *     tags: [Parishes]
 *     description: Retrieve a specific parish by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Parish retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Parish'
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, requirePermission('VIEW_PARISHES'), validate(parishIdSchema), ParishController.getById);

/**
 * @swagger
 * /parishes/{id}/stats:
 *   get:
 *     summary: Get parish statistics
 *     tags: [Parishes]
 *     description: Retrieve statistics for a specific parish
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Parish statistics retrieved successfully
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
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/stats', authenticate, requirePermission('VIEW_PARISHES'), validate(parishIdSchema), ParishController.getStats);

/**
 * @swagger
 * /parishes:
 *   post:
 *     summary: Create a new parish
 *     tags: [Parishes]
 *     description: Create a new parish with optional subscription creation (Super Admin only). If subscription fields (plan_id, billing_cycle, billing_name, billing_email, billing_phone) are provided, a subscription will be created automatically and payment_link will be returned in the response.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateParish'
 *     responses:
 *       201:
 *         description: Parish created successfully (includes subscription and payment_link if subscription fields were provided)
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
 *                   example: Parish created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     parish:
 *                       $ref: '#/components/schemas/Parish'
 *                     admin:
 *                       type: object
 *                       description: Church admin user details (if created)
 *                     subscription:
 *                       type: object
 *                       description: Subscription details (if created)
 *                       properties:
 *                         subscription_id:
 *                           type: integer
 *                           example: 1
 *                         razorpay_subscription_id:
 *                           type: string
 *                           example: sub_xyz123
 *                         plan_name:
 *                           type: string
 *                           example: Standard Plan
 *                         amount:
 *                           type: number
 *                           example: 2499
 *                         billing_cycle:
 *                           type: string
 *                           example: monthly
 *                     razorpay_subscription_id:
 *                       type: string
 *                       example: sub_xyz123
 *                       description: Razorpay subscription ID - use this for Standard Checkout integration
 *                     razorpay_key_id:
 *                       type: string
 *                       example: rzp_test_abc123
 *                       description: Razorpay API key ID - frontend needs this for checkout
 *                     checkout_info:
 *                       type: object
 *                       description: Integration instructions for payment checkout
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Use razorpay_subscription_id with Razorpay Standard Checkout for payment
 *                         integration_type:
 *                           type: string
 *                           example: standard_checkout
 *                         test_mode:
 *                           type: boolean
 *                           example: true
 *                     razorpay_subscription:
 *                       type: object
 *                       description: Full Razorpay subscription response for debugging
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Super Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  validate(createParishSchema),
  ParishController.create
);

/**
 * @swagger
 * /parishes/{id}:
 *   put:
 *     summary: Update a parish
 *     tags: [Parishes]
 *     description: Update parish information (Super Admin or Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParish'
 *     responses:
 *       200:
 *         description: Parish updated successfully
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
 *                   example: Parish updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Parish'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('EDIT_PARISH'),
  validate(parishIdSchema),
  validate(updateParishSchema),
  ParishController.update
);

/**
 * @swagger
 * /parishes/{id}:
 *   delete:
 *     summary: Delete a parish
 *     tags: [Parishes]
 *     description: Soft delete a parish (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Parish deleted successfully
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
 *                   example: Parish deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Super Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Parish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('DELETE_PARISH'),
  validate(parishIdSchema),
  ParishController.delete
);

export default router;
