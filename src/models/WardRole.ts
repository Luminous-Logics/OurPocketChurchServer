import database from '../config/database';
import { IWardRole, IWardRoleInput } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class WardRoleModel {
  /**
   * Get all roles for a specific ward with parishioner details
   */
  public static async getWardRoles(wardId: number): Promise<any[]> {
    const result = await database.executeQuery(
      `SELECT
          wr.ward_role_id,
          wr.ward_id,
          wr.parishioner_id,
          wr.role_id,
          wr.role_name,
          wr.is_primary,
          wr.assigned_by,
          wr.assigned_at,
          wr.expires_at,
          wr.is_active,
          wr.notes,
          wr.created_at,
          wr.updated_at,
          r.role_name as role_type,
          r.role_code,
          r.description as role_description,
          u.first_name as parishioner_first_name,
          u.last_name as parishioner_last_name,
          u.email as parishioner_email,
          u.phone as parishioner_phone,
          p.photo_url as parishioner_photo_url,
          p.member_status,
          assigned_user.first_name as assigned_by_first_name,
          assigned_user.last_name as assigned_by_last_name
        FROM ward_roles wr
        INNER JOIN parishioners p ON wr.parishioner_id = p.parishioner_id
        INNER JOIN users u ON p.user_id = u.user_id
        INNER JOIN roles r ON wr.role_id = r.role_id
        LEFT JOIN users assigned_user ON wr.assigned_by = assigned_user.user_id
        WHERE wr.ward_id = @wardId AND wr.is_active = TRUE
        ORDER BY r.priority DESC, wr.is_primary DESC, wr.created_at ASC`,
      { wardId }
    );

    return result.rows;
  }

  /**
   * Get a specific ward role by ID
   */
  public static async getWardRoleById(wardRoleId: number): Promise<IWardRole | null> {
    const result = await database.executeQuery<IWardRole>(
      `SELECT * FROM ward_roles
        WHERE ward_role_id = @wardRoleId`,
      { wardRoleId }
    );

    return result.rows[0] || null;
  }

  /**
   * Assign a role to a parishioner in a ward
   */
  public static async assignRole(data: IWardRoleInput): Promise<IWardRole> {
    try {
      // Check if the same role assignment already exists
      const existing = await database.executeQuery(
        `SELECT ward_role_id FROM ward_roles
          WHERE ward_id = @wardId
            AND parishioner_id = @parishionerId
            AND role_id = @roleId
            AND is_active = TRUE`,
        { wardId: data.ward_id, parishionerId: data.parishioner_id, roleId: data.role_id }
      );

      if (existing.rows.length > 0) {
        throw ApiError.conflict('This person already has this role in the ward');
      }

      // Get role name from roles table if not provided
      let roleName = data.role_name;
      if (!roleName) {
        const roleResult = await database.executeQuery<{ role_name: string }>(
          'SELECT role_name FROM roles WHERE role_id = @roleId',
          { roleId: data.role_id }
        );

        if (roleResult.rows.length === 0) {
          throw ApiError.notFound('Role not found');
        }

        roleName = roleResult.rows[0].role_name;
      }

      const result = await database.executeQuery<IWardRole>(
        `INSERT INTO ward_roles (ward_id, parishioner_id, role_id, role_name, assigned_by, expires_at, is_primary, notes)
          VALUES (@wardId, @parishionerId, @roleId, @roleName, @assignedBy, @expiresAt, @isPrimary, @notes)
          RETURNING *`,
        {
          wardId: data.ward_id,
          parishionerId: data.parishioner_id,
          roleId: data.role_id,
          roleName: roleName,
          assignedBy: data.assigned_by || null,
          expiresAt: data.expires_at || null,
          isPrimary: data.is_primary || false,
          notes: data.notes || null
        }
      );

      logger.info('Ward role assigned successfully', {
        ward_role_id: result.rows[0].ward_role_id,
        ward_id: data.ward_id,
        parishioner_id: data.parishioner_id,
        role_id: data.role_id,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error assigning ward role', { error, data });
      throw error;
    }
  }

  /**
   * Update ward role (e.g., change primary status, add notes, update expiry)
   */
  public static async updateWardRole(
    wardRoleId: number,
    updates: Partial<Pick<IWardRole, 'role_name' | 'is_primary' | 'expires_at' | 'notes' | 'is_active'>>
  ): Promise<IWardRole> {
    const existing = await this.getWardRoleById(wardRoleId);
    if (!existing) {
      throw ApiError.notFound('Ward role assignment not found');
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { wardRoleId };

    if (updates.role_name !== undefined) {
      updateFields.push('role_name = @roleName');
      params.roleName = updates.role_name;
    }
    if (updates.is_primary !== undefined) {
      updateFields.push('is_primary = @isPrimary');
      params.isPrimary = updates.is_primary;
    }
    if (updates.expires_at !== undefined) {
      updateFields.push('expires_at = @expiresAt');
      params.expiresAt = updates.expires_at;
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = @notes');
      params.notes = updates.notes;
    }
    if (updates.is_active !== undefined) {
      updateFields.push('is_active = @isActive');
      params.isActive = updates.is_active;
    }

    if (updateFields.length === 0) {
      return existing;
    }

    const result = await database.executeQuery<IWardRole>(
      `UPDATE ward_roles
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE ward_role_id = @wardRoleId
      RETURNING *`,
      params
    );

    return result.rows[0];
  }

  /**
   * Remove a role assignment (soft delete)
   */
  public static async removeRole(wardRoleId: number): Promise<void> {
    const existing = await this.getWardRoleById(wardRoleId);
    if (!existing) {
      throw ApiError.notFound('Ward role assignment not found');
    }

    await database.executeQuery(
      'UPDATE ward_roles SET is_active = FALSE, updated_at = NOW() WHERE ward_role_id = @wardRoleId',
      { wardRoleId }
    );

    logger.info('Ward role removed successfully', { ward_role_id: wardRoleId });
  }

  /**
   * Hard delete a ward role (permanent deletion)
   */
  public static async deleteRole(wardRoleId: number): Promise<void> {
    await database.executeQuery(
      'DELETE FROM ward_roles WHERE ward_role_id = @wardRoleId',
      { wardRoleId }
    );

    logger.info('Ward role deleted permanently', { ward_role_id: wardRoleId });
  }

  /**
   * Get all parishioners with a specific role in a ward
   */
  public static async getByRole(wardId: number, roleId: number): Promise<any[]> {
    const result = await database.executeQuery(
      `SELECT
          wr.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          p.photo_url,
          p.member_status
        FROM ward_roles wr
        INNER JOIN parishioners p ON wr.parishioner_id = p.parishioner_id
        INNER JOIN users u ON p.user_id = u.user_id
        WHERE wr.ward_id = @wardId AND wr.role_id = @roleId AND wr.is_active = TRUE
        ORDER BY wr.is_primary DESC, u.first_name, u.last_name`,
      { wardId, roleId }
    );

    return result.rows;
  }

  /**
   * Get all ward roles for a specific parishioner (across all wards)
   */
  public static async getParishionerWardRoles(parishionerId: number): Promise<any[]> {
    const result = await database.executeQuery(
      `SELECT
          wr.*,
          w.ward_name,
          w.ward_number,
          w.parish_id,
          r.role_name as role_type,
          r.role_code,
          r.description as role_description
        FROM ward_roles wr
        INNER JOIN wards w ON wr.ward_id = w.ward_id
        INNER JOIN roles r ON wr.role_id = r.role_id
        WHERE wr.parishioner_id = @parishionerId AND wr.is_active = TRUE AND w.is_active = TRUE
        ORDER BY w.ward_name, r.priority DESC`,
      { parishionerId }
    );

    return result.rows;
  }

  /**
   * Get all available ward role types
   */
  public static async getWardRoleTypes(parishId?: number): Promise<any[]> {
    let query = `
      SELECT
        role_id,
        role_name,
        role_code,
        description,
        priority,
        parish_id
      FROM roles
      WHERE is_ward_role = TRUE AND is_active = TRUE
    `;

    const params: Record<string, any> = {};

    if (parishId) {
      query += ' AND (parish_id = @parishId OR parish_id IS NULL)';
      params.parishId = parishId;
    } else {
      query += ' AND parish_id IS NULL'; // System-wide ward roles only
    }

    query += ' ORDER BY priority DESC, role_name ASC';

    const result = await database.executeQuery(query, params);
    return result.rows;
  }

  /**
   * Check if a parishioner has a specific role in a ward
   */
  public static async hasRole(wardId: number, parishionerId: number, roleId: number): Promise<boolean> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count
        FROM ward_roles
        WHERE ward_id = @wardId
          AND parishioner_id = @parishionerId
          AND role_id = @roleId
          AND is_active = TRUE
          AND (expires_at IS NULL OR expires_at > NOW())`,
      { wardId, parishionerId, roleId }
    );

    return parseInt(result.rows[0].count as any, 10) > 0;
  }

  /**
   * Count active roles in a ward
   */
  public static async countWardRoles(wardId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count
        FROM ward_roles
        WHERE ward_id = @wardId AND is_active = TRUE`,
      { wardId }
    );

    return parseInt(result.rows[0].count as any, 10);
  }

  /**
   * Get wards by role type (e.g., find all wards that have a treasurer)
   */
  public static async getWardsByRole(parishId: number, roleId: number): Promise<any[]> {
    const result = await database.executeQuery(
      `SELECT DISTINCT
          w.*,
          COUNT(wr.ward_role_id) as role_count
        FROM wards w
        INNER JOIN ward_roles wr ON w.ward_id = wr.ward_id
        WHERE w.parish_id = @parishId
          AND wr.role_id = @roleId
          AND wr.is_active = TRUE
          AND w.is_active = TRUE
        GROUP BY w.ward_id, w.parish_id, w.ward_name, w.ward_number, w.description,
                 w.coordinator_id, w.area_coverage, w.total_families, w.total_members,
                 w.is_active, w.created_at, w.updated_at
        ORDER BY w.ward_name`,
      { parishId, roleId }
    );

    return result.rows;
  }
}

export default WardRoleModel;
