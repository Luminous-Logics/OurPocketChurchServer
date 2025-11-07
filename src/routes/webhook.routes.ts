import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * @swagger
 * /webhooks/razorpay:
 *   post:
 *     summary: Handle Razorpay webhook events
 *     tags: [Webhooks]
 *     description: |
 *       Receives webhook notifications from Razorpay for subscription and payment events.
 *
 *       **Configure in Razorpay Dashboard:**
 *       Settings > Webhooks > Add Webhook URL
 *
 *       **Events handled:**
 *       - subscription.activated
 *       - subscription.charged
 *       - subscription.completed
 *       - subscription.cancelled
 *       - subscription.paused
 *       - subscription.resumed
 *       - subscription.halted
 *       - payment.captured
 *       - payment.failed
 *
 *       **Security:** Signature verification using RAZORPAY_WEBHOOK_SECRET
 *     parameters:
 *       - in: header
 *         name: x-razorpay-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC signature for webhook verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "subscription.activated"
 *               entity:
 *                 type: string
 *                 example: "subscription"
 *               payload:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       400:
 *         description: Invalid signature or payload
 */
router.post('/razorpay', WebhookController.handleRazorpayWebhook);

export default router;
