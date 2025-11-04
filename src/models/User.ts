/* eslint-disable @typescript-eslint/no-explicit-any */
import database from '../config/database';
import { IUser, UserType } from '../types';
import { ApiError } from '../utils/apiError';

export class UserModel {
  public static async findById(userId: number): Promise<IUser | null> {
    const result = await database.executeQuery<IUser>(
      `SELECT * FROM users WHERE user_id = @userId`,
      { userId }
    );

    return result.rows[0] || null;
  }

  public static async findByEmail(email: string): Promise<IUser | null> {
    const result = await database.executeQuery<IUser>(`SELECT * FROM users WHERE email = @email`, {
      email,
    });

    return result.rows[0] || null;
  }

  public static async create(userData: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone: string;
    profile_image_url?: string;
    user_type: UserType;
  }): Promise<IUser> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw ApiError.conflict('Email already exists');
    }
    const result = await database.executeQuery<{ user_id: number }>(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, profile_image_url, user_type)
       VALUES (@email, @password_hash, @first_name, @last_name, @phone, @profile_image_url, @user_type)
       RETURNING user_id`,
      userData
    );

    const userId = result.rows[0].user_id;
    const user = await this.findById(userId);

    if (!user) {
      throw ApiError.internal('Failed to create user');
    }

    return user;
  }

  public static async update(
    userId: number,
    updates: Partial<Omit<IUser, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<IUser> {
    const existingUser = await this.findById(userId);
    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: Record<string, any> = { userId };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existingUser;
    }

    await database.executeQuery(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE user_id = @userId`,
      params
    );

    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw ApiError.internal('Failed to update user');
    }

    return updatedUser;
  }

  public static async delete(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await database.executeQuery(
      `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE user_id = @userId`,
      { userId }
    );
  }

  public static async updateLastLogin(userId: number): Promise<void> {
    await database.executeQuery(`UPDATE users SET last_login = NOW() WHERE user_id = @userId`, {
      userId,
    });
  }

  public static async verifyEmail(userId: number): Promise<void> {
    await database.executeQuery(
      `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE user_id = @userId`,
      { userId }
    );
  }

  public static async findByUserType(
    userType: UserType,
    page: number = 1,
    limit: number = 20
  ): Promise<IUser[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IUser>(
      `SELECT * FROM users
       WHERE user_type = @userType AND is_active = TRUE
       ORDER BY created_at DESC
       LIMIT @limit OFFSET @offset`,
      { userType, offset, limit }
    );

    return result.rows;
  }

  public static async countByUserType(userType: UserType): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE user_type = @userType AND is_active = TRUE`,
      { userType }
    );

    return parseInt(result.rows[0].count as any, 10);
  }

  /**
   * Get all users by parish ID
   * Retrieves all users (church admins and parishioners) belonging to a parish
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<any[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<any>(
      `SELECT
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.profile_image_url,
        u.user_type,
        u.is_active,
        u.email_verified,
        u.last_login,
        u.created_at,
        u.updated_at,
        ca.church_admin_id,
        ca.role AS admin_role,
        ca.department AS admin_department,
        ca.is_primary_admin,
        p.parishioner_id,
        p.ward_id,
        p.family_id,
        w.ward_name,
        f.family_name,
        (
          SELECT json_agg(json_build_object(
            'role_id', r.role_id,
            'role_name', r.role_name,
            'role_code', r.role_code,
            'description', r.description,
            'assigned_at', ur.assigned_at,
            'expires_at', ur.expires_at
          ))
          FROM user_roles ur
          INNER JOIN roles r ON ur.role_id = r.role_id
          WHERE ur.user_id = u.user_id
            AND ur.is_active = TRUE
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ) AS roles_json
      FROM users u
      LEFT JOIN church_admins ca ON u.user_id = ca.user_id AND ca.parish_id = @parishId AND ca.is_active = TRUE
      LEFT JOIN parishioners p ON u.user_id = p.user_id AND p.parish_id = @parishId
      LEFT JOIN wards w ON p.ward_id = w.ward_id
      LEFT JOIN families f ON p.family_id = f.family_id
      WHERE (ca.church_admin_id IS NOT NULL OR p.parishioner_id IS NOT NULL)
        AND u.is_active = TRUE
      ORDER BY u.created_at DESC
      LIMIT @limit OFFSET @offset`,
      { parishId, offset, limit }
    );

    // Parse the roles_json field for each user
    const users = result.rows.map((user: any) => {
      const roles = user.roles_json || [];
      return {
        ...user,
        roles: roles,
        roles_json: undefined, // Remove the raw JSON field
      };
    });

    return users;
  }

  /**
   * Count all users by parish ID
   */
  public static async countByParishId(parishId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(DISTINCT u.user_id) as count
      FROM users u
      LEFT JOIN church_admins ca ON u.user_id = ca.user_id AND ca.parish_id = @parishId
      LEFT JOIN parishioners p ON u.user_id = p.user_id AND p.parish_id = @parishId
      WHERE (ca.church_admin_id IS NOT NULL OR p.parishioner_id IS NOT NULL)
        AND u.is_active = TRUE`,
      { parishId }
    );

    return parseInt(result.rows[0].count as any, 10);
  }
}

export default UserModel;
