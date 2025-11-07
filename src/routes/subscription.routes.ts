import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
import {
  validate,
  validateQuery,
  validateParams,
  createSubscriptionSchema,
  cancelSubscriptionSchema,
  pauseSubscriptionSchema,
  updateBillingDetailsSchema,
  getPlanQuerySchema,
  getPaymentHistoryQuerySchema,
  checkFeatureLimitSchema,
} from '../validators/subscription.validator';
import Joi from 'joi';

const router = Router();

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [Subscriptions]
 *     description: Retrieve all available subscription plans (Basic, Standard, Premium)
 *     responses:
 *       200:
 *         description: List of subscription plans
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
 *                       plan_id:
 *                         type: integer
 *                         example: 1
 *                       plan_name:
 *                         type: string
 *                         example: "Basic Plan"
 *                       tier:
 *                         type: string
 *                         example: "basic"
 *                       amount:
 *                         type: number
 *                         example: 999.00
 *                       currency:
 *                         type: string
 *                         example: "INR"
 *                       billing_cycle:
 *                         type: string
 *                         example: "monthly"
 *                       max_parishioners:
 *                         type: integer
 *                         example: 500
 *                       max_families:
 *                         type: integer
 *                         example: 100
 *                       trial_period_days:
 *                         type: integer
 *                         example: 15
 */
router.get(
  '/plans',
  validateQuery(getPlanQuerySchema),
  SubscriptionController.getPlans
);

/**
 * @swagger
 * /subscriptions/plans/{id}:
 *   get:
 *     summary: Get a specific subscription plan by ID
 *     tags: [Subscriptions]
 *     description: Retrieve details of a specific subscription plan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Subscription plan details
 *       404:
 *         description: Plan not found
 */
router.get(
  '/plans/:id',
  validateParams(
    Joi.object({
      id: Joi.number().integer().positive().required(),
    })
  ),
  SubscriptionController.getPlanById
);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription for a parish
 *     tags: [Subscriptions]
 *     description: |
 *       **Creates Razorpay subscription for Standard Checkout integration**
 *
 *       This endpoint creates a Razorpay customer and subscription, then returns the `razorpay_subscription_id`
 *       that your frontend should use with Razorpay Standard Checkout for payment.
 *
 *       **Flow:**
 *       1. Call this endpoint to create subscription
 *       2. Response includes `razorpay_subscription_id` and `razorpay_key_id`
 *       3. Frontend opens Razorpay Checkout modal with these values
 *       4. User completes payment
 *       5. Frontend calls `/subscriptions/verify-payment` with payment response
 *       6. Subscription gets activated
 *
 *       **Note:** The `payment_link` (hosted page URL) has limited functionality in test mode.
 *       Use Standard Checkout instead for better test mode support.
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
 *               - plan_id
 *               - billing_email
 *             properties:
 *               parish_id:
 *                 type: integer
 *                 example: 1
 *               plan_id:
 *                 type: integer
 *                 example: 2
 *               billing_email:
 *                 type: string
 *                 format: email
 *                 example: "admin@parish.com"
 *               billing_phone:
 *                 type: string
 *                 example: "9876543210"
 *               billing_address:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                     example: "123 Church St"
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                     example: "Mumbai"
 *                   state:
 *                     type: string
 *                     example: "Maharashtra"
 *                   postal_code:
 *                     type: string
 *                     example: "400001"
 *                   country:
 *                     type: string
 *                     example: "India"
 *               tax_identification_number:
 *                 type: string
 *                 example: "29ABCDE1234F1Z5"
 *               company_name:
 *                 type: string
 *                 example: "St. Mary's Parish"
 *     responses:
 *       201:
 *         description: Subscription created successfully - Use razorpay_subscription_id for checkout
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
 *                   example: "Subscription created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     razorpay_subscription_id:
 *                       type: string
 *                       example: "sub_JNxOJWLjGOzLOc"
 *                       description: "Use this with Razorpay Standard Checkout"
 *                     razorpay_key_id:
 *                       type: string
 *                       example: "rzp_test_1234567890"
 *                       description: "Your Razorpay key for frontend checkout"
 *                     checkout_info:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         integration_type:
 *                           type: string
 *                           example: "standard_checkout"
 *                         test_mode:
 *                           type: boolean
 *       400:
 *         description: Invalid request or parish already has subscription
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  validate(createSubscriptionSchema),
  SubscriptionController.createSubscription
);

/**
 * @swagger
 * /subscriptions/{parishId}:
 *   get:
 *     summary: Get subscription details for a parish
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription details
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:parishId',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  SubscriptionController.getSubscription
);

/**
 * @swagger
 * /subscriptions/{parishId}/cancel:
 *   post:
 *     summary: Cancel a parish subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
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
 *               - cancellation_reason
 *             properties:
 *               cancellation_reason:
 *                 type: string
 *                 example: "Switching to different system"
 *               cancel_at_cycle_end:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:parishId/cancel',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  validate(cancelSubscriptionSchema),
  SubscriptionController.cancelSubscription
);

/**
 * @swagger
 * /subscriptions/{parishId}/pause:
 *   post:
 *     summary: Pause a parish subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription paused
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:parishId/pause',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  validate(pauseSubscriptionSchema),
  SubscriptionController.pauseSubscription
);

/**
 * @swagger
 * /subscriptions/{parishId}/resume:
 *   post:
 *     summary: Resume a paused parish subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription resumed
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:parishId/resume',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  SubscriptionController.resumeSubscription
);

/**
 * @swagger
 * /subscriptions/{parishId}/billing-details:
 *   put:
 *     summary: Update billing details for a subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
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
 *               billing_email:
 *                 type: string
 *               billing_phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Billing details updated
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:parishId/billing-details',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  validate(updateBillingDetailsSchema),
  SubscriptionController.updateBillingDetails
);

/**
 * @swagger
 * /subscriptions/{parishId}/payments:
 *   get:
 *     summary: Get payment history for a parish subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Payment history
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:parishId/payments',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  validateQuery(getPaymentHistoryQuerySchema),
  SubscriptionController.getPaymentHistory
);

/**
 * @swagger
 * /subscriptions/{parishId}/feature-access:
 *   get:
 *     summary: Check feature access and limits for a parish
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feature access information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     can_add_parishioner:
 *                       type: boolean
 *                     can_add_family:
 *                       type: boolean
 *                     remaining_parishioners:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:parishId/feature-access',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  SubscriptionController.getFeatureAccess
);

/**
 * @swagger
 * /subscriptions/{parishId}/usage:
 *   get:
 *     summary: Get current resource usage for a parish
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Current usage statistics
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:parishId/usage',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  SubscriptionController.getUsage
);

/**
 * @swagger
 * /subscriptions/{parishId}/check-limit:
 *   post:
 *     summary: Check if a parish can use a specific feature
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
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
 *               - feature
 *             properties:
 *               feature:
 *                 type: string
 *                 enum: [parishioner, family, ward, user]
 *                 example: "parishioner"
 *     responses:
 *       200:
 *         description: Feature limit check result
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:parishId/check-limit',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  validate(checkFeatureLimitSchema),
  SubscriptionController.checkFeatureLimit
);

/**
 * @swagger
 * /subscriptions/{parishId}/manual-activate:
 *   post:
 *     summary: "(SUPER ADMIN ONLY) Manually activate parish subscription"
 *     tags:
 *       - Subscriptions
 *     description: |
 *       **FOR TESTING PURPOSES ONLY**
 *
 *       Manually activate a parish subscription without going through Razorpay payment flow.
 *       This is useful during development when Razorpay test mode doesn't provide hosted pages.
 *
 *       **This endpoint:**
 *       - Updates parish subscription_status from PENDING to ACTIVE
 *       - Updates parish_subscriptions table (if exists)
 *       - Allows admin users to login and access the system
 *       - Bypasses payment requirement
 *
 *       **⚠️ WARNING:** Only use this in development/testing. In production, use the proper Razorpay payment flow.
 *
 *       **Access:** Super Admin only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the parish to activate
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Manual activation for testing purposes"
 *                 description: Optional reason for manual activation
 *     responses:
 *       200:
 *         description: Parish activated successfully
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
 *                   example: "Parish subscription manually activated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     parish:
 *                       type: object
 *                       description: Updated parish with ACTIVE subscription_status
 *                     subscription:
 *                       type: object
 *                       description: Updated subscription details
 *                     warning:
 *                       type: string
 *                       example: "This is a manual activation for testing purposes only. In production, use the Razorpay payment flow."
 *       401:
 *         description: Unauthorized - Super admin access required
 *       404:
 *         description: Parish not found
 */

/**
 * @swagger
 * /subscriptions/verify-payment:
 *   post:
 *     summary: Verify payment after Razorpay Standard Checkout
 *     tags: [Subscriptions]
 *     description: |
 *       **For Razorpay Standard Checkout Integration**
 *
 *       This endpoint is called by your frontend after a successful payment via Razorpay Standard Checkout.
 *       It verifies the payment signature to ensure authenticity and activates the subscription.
 *
 *       **Flow:**
 *       1. Frontend opens Razorpay Checkout with subscription_id
 *       2. User completes payment
 *       3. Razorpay callback provides: razorpay_payment_id, razorpay_subscription_id, razorpay_signature
 *       4. Frontend calls this endpoint with those 3 values
 *       5. Backend verifies signature and activates subscription
 *       6. Parish status changes from PENDING to ACTIVE
 *
 *       **Security:** Uses HMAC SHA256 signature verification to prevent tampering
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_payment_id
 *               - razorpay_subscription_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_payment_id:
 *                 type: string
 *                 example: "pay_JNxOJWLjGOzLOc"
 *                 description: Payment ID returned by Razorpay Checkout
 *               razorpay_subscription_id:
 *                 type: string
 *                 example: "sub_JNxOJWLjGOzLOc"
 *                 description: Subscription ID returned by Razorpay Checkout
 *               razorpay_signature:
 *                 type: string
 *                 example: "1a2b3c4d5e6f7g8h9i0j..."
 *                 description: Signature returned by Razorpay Checkout for verification
 *     responses:
 *       200:
 *         description: Payment verified and subscription activated
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
 *                   example: "Payment verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *                       example: true
 *                     subscription_id:
 *                       type: integer
 *                       example: 1
 *                     parish_id:
 *                       type: integer
 *                       example: 1
 *                     subscription_status:
 *                       type: string
 *                       example: "active"
 *                     message:
 *                       type: string
 *                       example: "Payment verified successfully. Your subscription is now active!"
 *       400:
 *         description: Invalid signature or missing parameters
 *       404:
 *         description: Subscription not found
 */
router.post(
  '/verify-payment',
  validate(
    Joi.object({
      razorpay_payment_id: Joi.string().required(),
      razorpay_subscription_id: Joi.string().required(),
      razorpay_signature: Joi.string().required(),
    })
  ),
  SubscriptionController.verifyPayment
);

/**
 * @swagger
 * /subscriptions/{parishId}/payment-details:
 *   get:
 *     summary: Get payment details for a pending subscription
 *     tags: [Subscriptions]
 *     description: |
 *       **Public endpoint** - Allows users to retrieve payment information for pending subscriptions.
 *
 *       This is useful when:
 *       - User registered but didn't complete payment
 *       - User wants to check payment status
 *       - User needs to get payment link again
 *
 *       **Response varies by payment method:**
 *       - **Online**: Returns Razorpay payment details for completing payment
 *       - **Cash**: Returns instructions for cash payment verification
 *
 *       **Note:** This endpoint is accessible without authentication to allow users to pay even if they can't login.
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parish ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payment_required:
 *                   type: boolean
 *                   example: true
 *                 payment_method:
 *                   type: string
 *                   enum: [online, cash]
 *                   example: "online"
 *                 message:
 *                   type: string
 *                   example: "Your parish subscription payment is pending."
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         subscription_id:
 *                           type: integer
 *                         plan_name:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         billing_cycle:
 *                           type: string
 *                         razorpay_subscription_id:
 *                           type: string
 *                     razorpay_subscription_id:
 *                       type: string
 *                       description: "Use with Razorpay Checkout (online payments only)"
 *                     razorpay_key_id:
 *                       type: string
 *                       description: "Your Razorpay key (online payments only)"
 *       404:
 *         description: Subscription not found
 */
router.get(
  '/:parishId/payment-details',
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  SubscriptionController.getPaymentDetails
);

router.post(
  '/:parishId/manual-activate',
  authenticate,
  validateParams(
    Joi.object({
      parishId: Joi.number().integer().positive().required(),
    })
  ),
  validate(
    Joi.object({
      reason: Joi.string().min(5).max(500).optional(),
    })
  ),
  SubscriptionController.manuallyActivateParish
);

export default router;
