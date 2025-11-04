/* eslint-disable @typescript-eslint/no-explicit-any */
import database from '../config/database';
import { IChurchAdmin } from '../types';
import { ApiError } from '../utils/apiError';

export class ChurchAdminModel {

  public static async findById(churchAdminId: number): Promise<IChurchAdmin | null> {
    const result = await database.executeQuery<IChurchAdmin>(
      `SELECT * FROM church_admins WHERE church_admin_id = @churchAdminId`,
      { churchAdminId }
    );

    return result.rows[0] || null;
  }

  public static async findByUserId(userId: number): Promise<IChurchAdmin | null> {
    const result = await database.executeQuery<IChurchAdmin>(
      `SELECT * FROM church_admins WHERE user_id = @userId`,
      { userId }
    );

    return result.rows[0] || null;
  }

  public static async findByParishId(parishId: number): Promise<IChurchAdmin[]> {
    const result = await database.executeQuery<IChurchAdmin>(
      `SELECT * FROM church_admins WHERE parish_id = @parishId AND is_active = TRUE`,
      { parishId }
    );

    return result.rows;
  }

  public static async create(adminData: {
    user_id: number;
    parish_id: number;
    role: string;
    department?: string;
    permissions?: string;
    hire_date?: Date;
    is_primary_admin?: boolean;
  }): Promise<IChurchAdmin> {
    // Check if user already has a church admin record
    const existing = await this.findByUserId(adminData.user_id);
    if (existing) {
      throw ApiError.conflict('User already has a church admin record');
    }

    // Build dynamic INSERT query based on provided fields
    const fields: string[] = ['user_id', 'parish_id', 'role'];
    const params: Record<string, any> = {
      user_id: adminData.user_id,
      parish_id: adminData.parish_id,
      role: adminData.role,
    };

    // Add optional fields only if they have values
    if (adminData.department !== undefined) {
      fields.push('department');
      params.department = adminData.department;
    }
    if (adminData.permissions !== undefined) {
      fields.push('permissions');
      params.permissions = adminData.permissions;
    }
    if (adminData.hire_date !== undefined) {
      fields.push('hire_date');
      params.hire_date = adminData.hire_date;
    }
    if (adminData.is_primary_admin !== undefined) {
      fields.push('is_primary_admin');
      params.is_primary_admin = adminData.is_primary_admin;
    }

    const fieldNames = fields.join(', ');
    const fieldParams = fields.map((f) => `@${f}`).join(', ');

    const result = await database.executeQuery<{ church_admin_id: number }>(
      `INSERT INTO church_admins (${fieldNames})
       VALUES (${fieldParams})
       RETURNING church_admin_id`,
      params
    );

    const churchAdminId = result.rows[0].church_admin_id;
    const churchAdmin = await this.findById(churchAdminId);

    if (!churchAdmin) {
      throw ApiError.internal('Failed to create church admin record');
    }

    return churchAdmin;
  }

  public static async update(
    churchAdminId: number,
    updates: Partial<Omit<IChurchAdmin, 'church_admin_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<IChurchAdmin> {
    const existing = await this.findById(churchAdminId);
    if (!existing) {
      throw ApiError.notFound('Church admin not found');
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { churchAdminId };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existing;
    }

    await database.executeQuery(
      `UPDATE church_admins SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE church_admin_id = @churchAdminId`,
      params
    );

    const updated = await this.findById(churchAdminId);
    if (!updated) {
      throw ApiError.internal('Failed to update church admin');
    }

    return updated;
  }

  public static async delete(churchAdminId: number): Promise<void> {
    const admin = await this.findById(churchAdminId);
    if (!admin) {
      throw ApiError.notFound('Church admin not found');
    }

    await database.executeQuery(
      `UPDATE church_admins SET is_active = FALSE, updated_at = NOW() WHERE church_admin_id = @churchAdminId`,
      { churchAdminId }
    );
  }

  public static async hardDeleteByParishId(parishId: number): Promise<void> {
    await database.executeQuery(
      `DELETE FROM church_admins WHERE parish_id = @parishId`,
      { parishId }
    );
  }
}

export default ChurchAdminModel;
