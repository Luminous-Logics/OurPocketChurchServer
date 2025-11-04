import database from '../config/database';

export interface IRole {
  role_id: number;
  parish_id?: number;
  role_name: string;
  role_code: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  priority: number;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface IPermission {
  permission_id: number;
  permission_name: string;
  permission_code: string;
  description?: string;
  module: string;
  action: string;
  is_active: boolean;
  created_at: Date;
}

export interface IRolePermission {
  role_permission_id: number;
  role_id: number;
  permission_id: number;
  granted_by?: number;
  granted_at: Date;
}

export interface IUserRole {
  user_role_id: number;
  user_id: number;
  role_id: number;
  assigned_by?: number;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface IUserPermission {
  user_permission_id: number;
  user_id: number;
  permission_id: number;
  permission_type: 'GRANT' | 'REVOKE';
  assigned_by?: number;
  assigned_at: Date;
  expires_at?: Date;
  reason?: string;
  is_active: boolean;
}

export interface IPermissionAuditLog {
  audit_id: number;
  action_type: string;
  entity_type: string;
  entity_id?: number;
  performed_by?: number;
  performed_at: Date;
  old_value?: string;
  new_value?: string;
  description?: string;
  ip_address?: string;
}

export class RoleModel {
  /**
   * Get all roles (optionally filtered by parish)
   */
  public static async getAllRoles(parishId?: number): Promise<IRole[]> {
    let query = `
      SELECT role_id, parish_id, role_name, role_code, description,
             is_system_role, is_active, priority, created_by, created_at, updated_at
      FROM roles
      WHERE is_active = TRUE
    `;

    const params: any = {};

    if (parishId) {
      query += ' AND (parish_id = @parishId OR parish_id IS NULL)';
      params.parishId = parishId;
    } else {
      query += ' AND parish_id IS NULL';
    }

    query += ' ORDER BY priority DESC, role_name ASC';

    const result = await database.executeQuery(query, params);
    return result.rows;
  }

  /**
   * Get role by ID
   */
  public static async getRoleById(roleId: number): Promise<IRole | null> {
    const result = await database.executeQuery<IRole>(`
        SELECT role_id, parish_id, role_name, role_code, description,
               is_system_role, is_active, priority, created_by, created_at, updated_at
        FROM roles
        WHERE role_id = @roleId
      `, { roleId });

    return result.rows[0] || null;
  }

  /**
   * Get role by code
   */
  public static async getRoleByCode(roleCode: string, parishId?: number): Promise<IRole | null> {
    let query = 'SELECT * FROM roles WHERE role_code = @roleCode';
    const params: any = { roleCode };

    if (parishId) {
      query += ' AND (parish_id = @parishId OR parish_id IS NULL)';
      params.parishId = parishId;
    } else {
      query += ' AND parish_id IS NULL';
    }

    const result = await database.executeQuery(query, params);
    return result.rows[0] || null;
  }

  /**
   * Create a new role
   */
  public static async createRole(roleData: Partial<IRole>): Promise<IRole> {
    const result = await database.executeQuery<IRole>(`
        INSERT INTO roles (parish_id, role_name, role_code, description, is_system_role, priority, created_by)
        VALUES (@parishId, @roleName, @roleCode, @description, @isSystemRole, @priority, @createdBy)
        RETURNING *
      `, {
      parishId: roleData.parish_id || null,
      roleName: roleData.role_name,
      roleCode: roleData.role_code,
      description: roleData.description || null,
      isSystemRole: roleData.is_system_role || false,
      priority: roleData.priority || 0,
      createdBy: roleData.created_by || null,
    });

    return result.rows[0];
  }

  /**
   * Update role
   */
  public static async updateRole(roleId: number, roleData: Partial<IRole>): Promise<IRole> {
    const result = await database.executeQuery<IRole>(`
        UPDATE roles
        SET role_name = @roleName,
            description = @description,
            priority = @priority,
            is_active = @isActive,
            updated_at = NOW()
        WHERE role_id = @roleId
        RETURNING *
      `, {
      roleId,
      roleName: roleData.role_name,
      description: roleData.description || null,
      priority: roleData.priority,
      isActive: roleData.is_active,
    });

    return result.rows[0];
  }

  /**
   * Delete role (soft delete)
   */
  public static async deleteRole(roleId: number): Promise<void> {
    await database.executeQuery(`
        UPDATE roles
        SET is_active = FALSE, updated_at = NOW()
        WHERE role_id = @roleId AND is_system_role = FALSE
      `, { roleId });
  }

  /**
   * Get permissions for a role
   */
  public static async getRolePermissions(roleId: number): Promise<IPermission[]> {
    const result = await database.executeQuery<IPermission>(`
        SELECT p.*
        FROM permissions p
        INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
        WHERE rp.role_id = @roleId AND p.is_active = TRUE
        ORDER BY p.module, p.action
      `, { roleId });

    return result.rows;
  }

  /**
   * Assign permission to role
   */
  public static async assignPermissionToRole(
    roleId: number,
    permissionId: number,
    grantedBy?: number
  ): Promise<IRolePermission> {
    const result = await database.executeQuery<IRolePermission>(`
        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES (@roleId, @permissionId, @grantedBy)
        RETURNING *
      `, {
      roleId,
      permissionId,
      grantedBy: grantedBy || null,
    });

    return result.rows[0];
  }

  /**
   * Remove permission from role
   */
  public static async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await database.executeQuery(
      'DELETE FROM role_permissions WHERE role_id = @roleId AND permission_id = @permissionId',
      { roleId, permissionId }
    );
  }

  /**
   * Get all users with a specific role
   */
  public static async getUsersByRole(roleId: number): Promise<any[]> {
    const result = await database.executeQuery(`
        SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone,
               ur.assigned_at, ur.expires_at, ur.is_active
        FROM users u
        INNER JOIN user_roles ur ON u.user_id = ur.user_id
        WHERE ur.role_id = @roleId AND ur.is_active = TRUE
        ORDER BY u.first_name, u.last_name
      `, { roleId });

    return result.rows;
  }
}

export class PermissionModel {
  /**
   * Get all permissions
   */
  public static async getAllPermissions(): Promise<IPermission[]> {
    const result = await database.executeQuery<IPermission>(`
        SELECT * FROM permissions
        WHERE is_active = TRUE
        ORDER BY module, action
      `);

    return result.rows;
  }

  /**
   * Get permissions by module
   */
  public static async getPermissionsByModule(module: string): Promise<IPermission[]> {
    const result = await database.executeQuery<IPermission>(`
        SELECT * FROM permissions
        WHERE module = @module AND is_active = TRUE
        ORDER BY action
      `, { module });

    return result.rows;
  }

  /**
   * Get permission by code
   */
  public static async getPermissionByCode(permissionCode: string): Promise<IPermission | null> {
    const result = await database.executeQuery<IPermission>(
      'SELECT * FROM permissions WHERE permission_code = @permissionCode',
      { permissionCode }
    );

    return result.rows[0] || null;
  }

  /**
   * Create custom permission (if needed)
   */
  public static async createPermission(permissionData: Partial<IPermission>): Promise<IPermission> {
    const result = await database.executeQuery<IPermission>(`
        INSERT INTO permissions (permission_name, permission_code, description, module, action)
        VALUES (@permissionName, @permissionCode, @description, @module, @action)
        RETURNING *
      `, {
      permissionName: permissionData.permission_name,
      permissionCode: permissionData.permission_code,
      description: permissionData.description || null,
      module: permissionData.module,
      action: permissionData.action,
    });

    return result.rows[0];
  }

  /**
   * Get user's effective permissions (from roles + direct permissions)
   */
  public static async getUserPermissions(userId: number): Promise<IPermission[]> {
    const result = await database.executeQuery<IPermission>(`
        -- Get permissions from user roles and direct grants, exclude revokes
        SELECT DISTINCT
          p.permission_id,
          p.permission_name,
          p.permission_code,
          p.description,
          p.module,
          p.action,
          p.is_active,
          p.created_at
        FROM permissions p
        WHERE p.is_active = TRUE
          AND p.permission_id IN (
            -- Permissions from roles
            SELECT rp.permission_id
            FROM role_permissions rp
            INNER JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = @userId
              AND ur.is_active = TRUE
              AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

            UNION

            -- Directly granted permissions
            SELECT up.permission_id
            FROM user_permissions up
            WHERE up.user_id = @userId
              AND up.permission_type = 'GRANT'
              AND up.is_active = TRUE
              AND (up.expires_at IS NULL OR up.expires_at > NOW())
          )
          AND p.permission_id NOT IN (
            -- Exclude revoked permissions
            SELECT up.permission_id
            FROM user_permissions up
            WHERE up.user_id = @userId
              AND up.permission_type = 'REVOKE'
              AND up.is_active = TRUE
              AND (up.expires_at IS NULL OR up.expires_at > NOW())
          )
        ORDER BY p.module, p.action
      `, { userId });

    return result.rows;
  }

  /**
   * Check if user has specific permission
   */
  public static async userHasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const result = await database.executeQuery<{ has_permission: boolean }>(`
        SELECT CASE
          WHEN EXISTS (
            -- Check if permission is granted via role
            SELECT 1
            FROM permissions p
            INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
            INNER JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = @userId
              AND p.permission_code = @permissionCode
              AND ur.is_active = TRUE
              AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
              AND p.is_active = TRUE
          )
          OR EXISTS (
            -- Check if directly granted
            SELECT 1
            FROM permissions p
            INNER JOIN user_permissions up ON p.permission_id = up.permission_id
            WHERE up.user_id = @userId
              AND p.permission_code = @permissionCode
              AND up.permission_type = 'GRANT'
              AND up.is_active = TRUE
              AND (up.expires_at IS NULL OR up.expires_at > NOW())
          )
          THEN TRUE
          ELSE FALSE
        END AS has_permission
      `, { userId, permissionCode });

    return result.rows[0]?.has_permission || false;
  }
}

export class UserRoleModel {
  /**
   * Get user's roles
   */
  public static async getUserRoles(userId: number): Promise<IRole[]> {
    const result = await database.executeQuery<IRole>(`
        SELECT r.*
        FROM roles r
        INNER JOIN user_roles ur ON r.role_id = ur.role_id
        WHERE ur.user_id = @userId
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY r.priority DESC
      `, { userId });

    return result.rows;
  }

  /**
   * Assign role to user
   */
  public static async assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy?: number,
    expiresAt?: Date
  ): Promise<IUserRole> {
    const result = await database.executeQuery<IUserRole>(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES (@userId, @roleId, @assignedBy, @expiresAt)
        RETURNING *
      `, {
      userId,
      roleId,
      assignedBy: assignedBy || null,
      expiresAt: expiresAt || null,
    });

    return result.rows[0];
  }

  /**
   * Remove role from user
   */
  public static async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await database.executeQuery(
      'DELETE FROM user_roles WHERE user_id = @userId AND role_id = @roleId',
      { userId, roleId }
    );
  }

  /**
   * Grant direct permission to user
   */
  public static async grantPermissionToUser(
    userId: number,
    permissionId: number,
    assignedBy?: number,
    reason?: string,
    expiresAt?: Date
  ): Promise<IUserPermission> {
    const result = await database.executeQuery<IUserPermission>(`
        INSERT INTO user_permissions (user_id, permission_id, permission_type, assigned_by, reason, expires_at)
        VALUES (@userId, @permissionId, 'GRANT', @assignedBy, @reason, @expiresAt)
        ON CONFLICT (user_id, permission_id)
        DO UPDATE SET
          permission_type = 'GRANT',
          is_active = TRUE,
          assigned_by = @assignedBy,
          reason = @reason,
          expires_at = @expiresAt,
          assigned_at = NOW()
        RETURNING *
      `, {
      userId,
      permissionId,
      assignedBy: assignedBy || null,
      reason: reason || null,
      expiresAt: expiresAt || null,
    });

    return result.rows[0];
  }

  /**
   * Revoke permission from user
   */
  public static async revokePermissionFromUser(
    userId: number,
    permissionId: number,
    assignedBy?: number,
    reason?: string
  ): Promise<void> {
    await database.executeQuery(`
        INSERT INTO user_permissions (user_id, permission_id, permission_type, assigned_by, reason)
        VALUES (@userId, @permissionId, 'REVOKE', @assignedBy, @reason)
        ON CONFLICT (user_id, permission_id)
        DO UPDATE SET
          permission_type = 'REVOKE',
          is_active = TRUE,
          assigned_by = @assignedBy,
          reason = @reason,
          assigned_at = NOW()
      `, {
      userId,
      permissionId,
      assignedBy: assignedBy || null,
      reason: reason || null,
    });
  }
}

export default {
  RoleModel,
  PermissionModel,
  UserRoleModel,
};
