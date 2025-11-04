import database from '../config/database';

export interface IOtp {
  otp_id: number;
  user_id: number;
  otp_code: string;
  otp_type: 'login' | 'password_reset' | 'verification';
  delivery_method: 'sms' | 'email';
  phone?: string;
  email?: string;
  is_verified: boolean;
  expires_at: Date;
  created_at: Date;
  verified_at?: Date;
  ip_address?: string;
  attempts: number;
}

export interface ICreateOtp {
  user_id: number;
  otp_code: string;
  otp_type: 'login' | 'password_reset' | 'verification';
  delivery_method: 'sms' | 'email';
  phone?: string;
  email?: string;
  expires_at: Date;
  expires_in_minutes?: number; // Optional: minutes until expiry (alternative to expires_at)
  ip_address?: string;
}

export class OtpModel {
  /**
   * Create new OTP
   */
  public static async create(otp: ICreateOtp): Promise<IOtp> {
    // Use PostgreSQL's INTERVAL to avoid timezone issues
    // Calculate minutes from now by comparing expires_at with current time
    const now = new Date();
    const minutesUntilExpiry = Math.round((otp.expires_at.getTime() - now.getTime()) / 60000);

    const result = await database.executeQuery<IOtp>(
      `INSERT INTO otp_codes (
          user_id, otp_code, otp_type, delivery_method, phone, email, expires_at, ip_address
        )
        VALUES (
          @userId, @otpCode, @otpType, @deliveryMethod, @phone, @email,
          NOW() + INTERVAL '@expiryMinutes minutes', @ipAddress
        )
        RETURNING *`,
      {
        userId: otp.user_id,
        otpCode: otp.otp_code,
        otpType: otp.otp_type,
        deliveryMethod: otp.delivery_method,
        phone: otp.phone || null,
        email: otp.email || null,
        expiryMinutes: minutesUntilExpiry,
        ipAddress: otp.ip_address || null
      }
    );

    return result.rows[0];
  }

  /**
   * Get latest OTP for user
   */
  public static async getLatestByUser(
    userId: number,
    otpType: string = 'login'
  ): Promise<IOtp | null> {
    const result = await database.executeQuery<IOtp>(
      `SELECT * FROM otp_codes
        WHERE user_id = @userId AND otp_type = @otpType
        ORDER BY created_at DESC
        LIMIT 1`,
      { userId, otpType }
    );

    return result.rows[0] || null;
  }

  /**
   * Verify OTP code
   */
  public static async verify(userId: number, otpCode: string, otpType: string = 'login'): Promise<IOtp | null> {
    const result = await database.executeQuery<IOtp>(
      `SELECT * FROM otp_codes
        WHERE user_id = @userId
          AND otp_code = @otpCode
          AND otp_type = @otpType
          AND is_verified = FALSE
          AND expires_at > NOW()
          AND attempts < 3
        ORDER BY created_at DESC
        LIMIT 1`,
      { userId, otpCode, otpType }
    );

    return result.rows[0] || null;
  }

  /**
   * Mark OTP as verified
   */
  public static async markAsVerified(otpId: number): Promise<void> {
    await database.executeQuery(
      `UPDATE otp_codes
        SET is_verified = TRUE, verified_at = NOW()
        WHERE otp_id = @otpId`,
      { otpId }
    );
  }

  /**
   * Increment attempts
   */
  public static async incrementAttempts(otpId: number): Promise<void> {
    await database.executeQuery(
      'UPDATE otp_codes SET attempts = attempts + 1 WHERE otp_id = @otpId',
      { otpId }
    );
  }

  /**
   * Invalidate all OTPs for user
   */
  public static async invalidateUserOtps(userId: number, otpType: string = 'login'): Promise<void> {
    await database.executeQuery(
      `UPDATE otp_codes
        SET is_verified = TRUE
        WHERE user_id = @userId AND otp_type = @otpType AND is_verified = FALSE`,
      { userId, otpType }
    );
  }

  /**
   * Clean up expired OTPs
   */
  public static async cleanupExpired(): Promise<number> {
    const result = await database.executeQuery(
      `DELETE FROM otp_codes
        WHERE expires_at < NOW() - INTERVAL '24 hours'`
    );

    return result.rowCount || 0;
  }

  /**
   * Check rate limiting (max OTPs per user per time period)
   */
  public static async checkRateLimit(
    userId: number,
    minutes: number = 60,
    maxAttempts: number = 3
  ): Promise<boolean> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM otp_codes
        WHERE user_id = @userId
          AND created_at > NOW() - INTERVAL '@minutes minutes'`,
      { userId, minutes }
    );

    const count = parseInt(result.rows[0].count as any, 10);
    return count < maxAttempts;
  }
}
