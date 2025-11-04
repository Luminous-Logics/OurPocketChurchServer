/**
 * OTP Utility Functions
 * Generate and validate one-time passwords
 */

export class OtpUtil {
  /**
   * Generate random 6-digit OTP
   */
  public static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits[randomIndex];
    }

    // Ensure it's exactly the specified length
    return otp.padStart(length, '0');
  }

  /**
   * Validate OTP format
   */
  public static validateOTPFormat(otp: string, length: number = 6): boolean {
    const otpRegex = new RegExp(`^\\d{${length}}$`);
    return otpRegex.test(otp);
  }

  /**
   * Check if OTP is expired
   */
  public static isOTPExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt);
  }

  /**
   * Calculate expiry time (in minutes from now)
   */
  public static calculateExpiryTime(minutes: number = 5): Date {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + minutes);
    return expiryDate;
  }

  /**
   * Mask phone number for display
   * Example: +1234567890 -> +1-XXX-XX-7890
   */
  public static maskPhone(phone: string): string {
    if (phone.length < 4) return phone;

    const visibleStart = 2;
    const visibleEnd = 4;
    const start = phone.slice(0, visibleStart);
    const end = phone.slice(-visibleEnd);
    const masked = 'X'.repeat(Math.max(0, phone.length - visibleStart - visibleEnd));

    // Format: +1-XXX-XX-7890
    if (phone.startsWith('+')) {
      return `${start}-${masked.slice(0, 3)}-${masked.slice(3)}-${end}`;
    }

    return `${start}-XXX-XX-${end}`;
  }

  /**
   * Mask email for display
   * Example: john.doe@example.com -> j***e@example.com
   */
  public static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');

    if (!domain) return email;

    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }

    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    const masked = '***';

    return `${firstChar}${masked}${lastChar}@${domain}`;
  }
}
