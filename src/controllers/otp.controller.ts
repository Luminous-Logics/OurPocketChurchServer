/**
 * OTP Controller
 *
 * Handles OTP generation, sending, and verification for:
 * - Login authentication
 * - Password reset
 * - Email/Phone verification
 */

import { Request, Response } from 'express';
import { OtpModel } from '../models/Otp';
import { UserModel } from '../models/User';
import { emailService } from '../services/email/email.service';
import { OtpUtil } from '../utils/otp.util';
import { JwtUtil } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken'; // Still needed for password reset token

export class OtpController {
  /**
   * Request OTP for login (email only)
   * POST /api/v1/otp/request-login
   */
  static async requestLoginOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not (security)
        logger.warn(`OTP requested for non-existent email: ${email}`);
        res.json({
          success: true,
          message: 'If this email is registered, an OTP has been sent.',
        });
        return;
      }

      // Check rate limiting (15 minutes window)
      const canSendOTP = await OtpModel.checkRateLimit(user.user_id, 15);
      if (!canSendOTP) {
        throw ApiError.badRequest(
          'Too many OTP requests. Please wait before requesting again.'
        );
      }

      // Generate OTP
      const otpCode = OtpUtil.generateOTP(6);
      const expiresAt = OtpUtil.calculateExpiryTime(10); // 10 minutes

      // Save OTP to database
      await OtpModel.create({
        user_id: user.user_id,
        otp_code: otpCode,
        otp_type: 'login',
        delivery_method: 'email',
        email: user.email,
        expires_at: expiresAt,
      });

      // Send OTP via email
      try {
        await emailService.sendTemplateEmail({
          to: user.email,
          templateCode: 'otp_login',
          variables: {
            firstName: user.first_name,
            lastName: user.last_name,
            otpCode: otpCode,
            expiryMinutes: 10,
            parishName: 'Parish Nexus',
            recipientName: `${user.first_name} ${user.last_name}`,
          },
        });

        logger.info(`Login OTP sent to user: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send OTP email', { emailError });
        throw ApiError.internal('Failed to send OTP. Please try again.');
      }

      res.json({
        success: true,
        message: `An OTP has been sent to ${OtpUtil.maskEmail(user.email)}`,
        data: {
          email: OtpUtil.maskEmail(user.email),
          expiresIn: '10 minutes',
        },
      });
    } catch (error) {
      logger.error('Error in requestLoginOTP', { error });
      throw error;
    }
  }

  /**
   * Verify OTP and issue JWT token for login
   * POST /api/v1/otp/verify-login
   */
  static async verifyLoginOTP(req: Request, res: Response): Promise<void> {
    logger.info('========== VERIFY LOGIN OTP CALLED ==========');
    logger.info('Request body:', req.body);

    try {
      const { email, otp_code } = req.body;
      logger.info(`Extracted values - email: ${email}, otp_code: ${otp_code}`);

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw ApiError.unauthorized('Invalid email or OTP');
      }

      logger.info(`User found: ${user.user_id}`);

      // Get the latest OTP to debug
      const latestOtp = await OtpModel.getLatestByUser(user.user_id, 'login');
      logger.info(`Latest OTP is null: ${latestOtp === null}`);
      if (latestOtp) {
        logger.info(`Latest OTP details:`, {
          otp_id: latestOtp.otp_id,
          otp_code: latestOtp.otp_code,
          is_verified: latestOtp.is_verified,
          expires_at: latestOtp.expires_at,
          attempts: latestOtp.attempts,
        });
      }

      // Verify OTP
      logger.info(`Attempting to verify OTP: ${otp_code} for user ${user.user_id}`);
      const otpRecord = await OtpModel.verify(user.user_id, otp_code, 'login');
      logger.info(`Verification result - otpRecord is null: ${otpRecord === null}`);

      if (!otpRecord) {
        logger.warn(`OTP verification failed for user ${user.user_id}, code: ${otp_code}`);
        // Increment attempts on the latest OTP if it exists
        if (latestOtp) {
          await OtpModel.incrementAttempts(latestOtp.otp_id);
          logger.info(`Incremented attempts for OTP ${latestOtp.otp_id}`);
        }
        throw ApiError.unauthorized('Invalid or expired OTP');
      }

      // Mark OTP as verified
      await OtpModel.markAsVerified(otpRecord.otp_id);

      // Update last login (same as normal login)
      await UserModel.updateLastLogin(user.user_id);

      // Generate token using JwtUtil (same as normal login)
      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type,
      };

      const token = JwtUtil.generateAccessToken(tokenPayload);

      logger.info(`User logged in via OTP: ${user.email}`);

      // Response format matches normal login
      res.json({
        success: true,
        data: {
          token,
          user: {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
          },
        },
      });
    } catch (error) {
      logger.error('Error in verifyLoginOTP', { error });
      throw error;
    }
  }

  /**
   * Request OTP for password reset
   * POST /api/v1/otp/request-reset
   */
  static async requestPasswordResetOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not (security)
        logger.warn(`Password reset OTP requested for non-existent email: ${email}`);
        res.json({
          success: true,
          message: 'If this email is registered, a password reset OTP has been sent.',
        });
        return;
      }

      // Check rate limiting (15 minutes window)
      const canSendOTP = await OtpModel.checkRateLimit(user.user_id, 15);
      if (!canSendOTP) {
        throw ApiError.badRequest(
          'Too many OTP requests. Please wait before requesting again.'
        );
      }

      // Generate OTP
      const otpCode = OtpUtil.generateOTP(6);
      const expiresAt = OtpUtil.calculateExpiryTime(15); // 15 minutes for password reset

      // Save OTP to database
      await OtpModel.create({
        user_id: user.user_id,
        otp_code: otpCode,
        otp_type: 'password_reset',
        delivery_method: 'email',
        email: user.email,
        expires_at: expiresAt,
      });

      // Send OTP via email using PASSWORD_RESET template
      try {
        await emailService.sendTemplateEmail({
          to: user.email,
          templateCode: 'password_reset',
          variables: {
            firstName: user.first_name,
            lastName: user.last_name,
            otpCode: otpCode,
            expiryMinutes: 15,
            parishName: 'Parish Nexus',
            recipientName: `${user.first_name} ${user.last_name}`,
            resetLink: `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(user.email)}`,
          },
        });

        logger.info(`Password reset OTP sent to user: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send password reset OTP email', { emailError });
        throw ApiError.internal('Failed to send OTP. Please try again.');
      }

      res.json({
        success: true,
        message: `A password reset OTP has been sent to ${OtpUtil.maskEmail(user.email)}`,
        data: {
          email: OtpUtil.maskEmail(user.email),
          expiresIn: '15 minutes',
        },
      });
    } catch (error) {
      logger.error('Error in requestPasswordResetOTP', { error });
      throw error;
    }
  }

  /**
   * Verify password reset OTP (returns a temporary token for password reset)
   * POST /api/v1/otp/verify-reset
   */
  static async verifyPasswordResetOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp_code } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw ApiError.unauthorized('Invalid email or OTP');
      }

      // Verify OTP
      const otpRecord = await OtpModel.verify(user.user_id, otp_code, 'password_reset');
      if (!otpRecord) {
        throw ApiError.unauthorized('Invalid or expired OTP');
      }

      // Mark OTP as verified
      await OtpModel.markAsVerified(otpRecord.otp_id);

      // Generate a temporary reset token (valid for 15 minutes)
      const resetToken = jwt.sign(
        {
          user_id: user.user_id,
          purpose: 'password_reset',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' } as jwt.SignOptions
      );

      logger.info(`Password reset OTP verified for user: ${user.email}`);

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          resetToken,
          expiresIn: '15 minutes',
        },
      });
    } catch (error) {
      logger.error('Error in verifyPasswordResetOTP', { error });
      throw error;
    }
  }

  /**
   * Resend OTP
   * POST /api/v1/otp/resend
   */
  static async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { otp_type } = req.body;

      // Validate otp_type
      if (!['login', 'password_reset'].includes(otp_type)) {
        throw ApiError.badRequest('Invalid OTP type');
      }

      // Reuse the appropriate request method
      if (otp_type === 'login') {
        await OtpController.requestLoginOTP(req, res);
      } else if (otp_type === 'password_reset') {
        await OtpController.requestPasswordResetOTP(req, res);
      }
    } catch (error) {
      logger.error('Error in resendOTP', { error });
      throw error;
    }
  }

  /**
   * Clean up expired OTPs (can be called by a cron job)
   * DELETE /api/v1/otp/cleanup
   */
  static async cleanupExpiredOTPs(_req: Request, res: Response): Promise<void> {
    try {
      await OtpModel.cleanupExpired();

      logger.info('Expired OTPs cleaned up successfully');

      res.json({
        success: true,
        message: 'Expired OTPs cleaned up successfully',
      });
    } catch (error) {
      logger.error('Error in cleanupExpiredOTPs', { error });
      throw error;
    }
  }
}
