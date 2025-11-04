/**
 * OTP Routes
 *
 * Handles OTP-based authentication routes
 */

import { Router } from 'express';
import { OtpController } from '../controllers/otp.controller';
import { validate } from '../middleware/validate';
import {
  requestLoginOTPSchema,
  verifyLoginOTPSchema,
  requestPasswordResetOTPSchema,
  verifyPasswordResetOTPSchema,
  resendOTPSchema,
} from '../validators/otp.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: OTP Authentication
 *   description: OTP-based authentication and password reset
 */

/**
 * @swagger
 * /otp/request-login:
 *   post:
 *     summary: Request OTP for login
 *     description: Send an OTP to the user's email for authentication
 *     tags: [OTP Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                   example: An OTP has been sent to j***e@example.com
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: j***e@example.com
 *                     expiresIn:
 *                       type: string
 *                       example: 10 minutes
 *       429:
 *         description: Too many requests
 */
router.post(
  '/request-login',
  validate({ body: requestLoginOTPSchema }),
  OtpController.requestLoginOTP
);

/**
 * @swagger
 * /otp/verify-login:
 *   post:
 *     summary: Verify OTP and login
 *     description: Verify the OTP code and receive JWT tokens for authentication
 *     tags: [OTP Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               otp_code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                         user_type:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired OTP
 */
router.post(
  '/verify-login',
  validate({ body: verifyLoginOTPSchema }),
  OtpController.verifyLoginOTP
);

/**
 * @swagger
 * /otp/request-reset:
 *   post:
 *     summary: Request OTP for password reset
 *     description: Send an OTP to the user's email for password reset
 *     tags: [OTP Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
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
 *                   example: A password reset OTP has been sent to j***e@example.com
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: j***e@example.com
 *                     expiresIn:
 *                       type: string
 *                       example: 15 minutes
 *       429:
 *         description: Too many requests
 */
router.post(
  '/request-reset',
  validate({ body: requestPasswordResetOTPSchema }),
  OtpController.requestPasswordResetOTP
);

/**
 * @swagger
 * /otp/verify-reset:
 *   post:
 *     summary: Verify password reset OTP
 *     description: Verify the OTP code and receive a temporary reset token
 *     tags: [OTP Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               otp_code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: OTP verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       description: Temporary token for password reset (valid 15 minutes)
 *                     expiresIn:
 *                       type: string
 *                       example: 15 minutes
 *       401:
 *         description: Invalid or expired OTP
 */
router.post(
  '/verify-reset',
  validate({ body: verifyPasswordResetOTPSchema }),
  OtpController.verifyPasswordResetOTP
);

/**
 * @swagger
 * /otp/resend:
 *   post:
 *     summary: Resend OTP
 *     description: Resend OTP for login or password reset
 *     tags: [OTP Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               otp_type:
 *                 type: string
 *                 enum: [login, password_reset]
 *                 example: login
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Too many requests
 */
router.post(
  '/resend',
  validate({ body: resendOTPSchema }),
  OtpController.resendOTP
);

/**
 * @swagger
 * /otp/cleanup:
 *   delete:
 *     summary: Cleanup expired OTPs
 *     description: Remove expired OTP codes from database (Admin only, can be used by cron jobs)
 *     tags: [OTP Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired OTPs cleaned up successfully
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/cleanup',
  authenticate,
  OtpController.cleanupExpiredOTPs
);

export default router;
