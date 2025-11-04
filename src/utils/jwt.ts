import jwt from "jsonwebtoken";
import config from "../config";
import { ITokenPayload } from "../types";

export interface IGeneratedToken {
  token: string;
  expires_in: number; // in seconds
  expires_at: string; // ISO timestamp
}

export class JwtUtil {
  /**
   * Generate access token with expiry info
   */
  public static generateAccessToken(payload: ITokenPayload): IGeneratedToken {
    const expiresInString = config.jwt.expiresIn;
    const expiresInSeconds = this.parseExpiryToSeconds(expiresInString);
console.log(expiresInSeconds,"expiresInSeconds")
    const token = jwt.sign(payload as object, config.jwt.secret, {
      expiresIn: expiresInString,
    } as jwt.SignOptions);

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      token,
      expires_in: expiresInSeconds,
      expires_at: expiresAt,
    };
  }

  /**
   * Verify access token
   */
  public static verifyAccessToken(token: string): ITokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as ITokenPayload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  public static decodeToken(token: string): ITokenPayload | null {
    try {
      const decoded = jwt.decode(token);
      return decoded as ITokenPayload | null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Helper to convert expiry format ("1h", "30m", "3600s") → seconds
   */
  private static parseExpiryToSeconds(expiry: string): number {
    const num = parseInt(expiry);
    if (expiry.endsWith("h")) return num * 3600;
    if (expiry.endsWith("m")) return num * 60;
    if (expiry.endsWith("s")) return num;
    if (expiry.endsWith("d")) return num * 24 * 3600; // Convert days to seconds
    return Number(expiry) || 3600; // default 1 hour
  }
}

export default JwtUtil;
