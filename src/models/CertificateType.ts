import database from '../config/database';
import { ICertificateType, ICertificateTypeInput, ICertificateTypeUpdate } from '../types';

export class CertificateTypeModel {
  /**
   * Get all certificate types for a parish with template details
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 50,
    activeOnly: boolean = true
  ): Promise<ICertificateType[]> {
    const offset = (page - 1) * limit;

    const query = activeOnly
      ? `SELECT
          ct.*,
          t.template_name,
          t.html_content,
          t.placeholders
         FROM certificate_types ct
         LEFT JOIN templates t ON ct.template_id = t.template_id
         WHERE ct.parish_id = @parishId AND ct.is_active = TRUE
         ORDER BY ct.created_at DESC
         LIMIT @limit OFFSET @offset`
      : `SELECT
          ct.*,
          t.template_name,
          t.html_content,
          t.placeholders
         FROM certificate_types ct
         LEFT JOIN templates t ON ct.template_id = t.template_id
         WHERE ct.parish_id = @parishId
         ORDER BY ct.created_at DESC
         LIMIT @limit OFFSET @offset`;

    const result = await database.executeQuery<ICertificateType>(query, {
      parishId,
      limit,
      offset
    });

    return result.rows;
  }

  /**
   * Count certificate types for a parish
   */
  public static async countByParishId(parishId: number, activeOnly: boolean = true): Promise<number> {
    const query = activeOnly
      ? 'SELECT COUNT(*) as count FROM certificate_types WHERE parish_id = @parishId AND is_active = TRUE'
      : 'SELECT COUNT(*) as count FROM certificate_types WHERE parish_id = @parishId';

    const result = await database.executeQuery<{ count: string }>(query, { parishId });
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get certificate type by ID with template details
   */
  public static async findById(certificateTypeId: number): Promise<ICertificateType | null> {
    const result = await database.executeQuery<ICertificateType>(
      `SELECT
        ct.*,
        t.template_name,
        t.html_content,
        t.placeholders
       FROM certificate_types ct
       LEFT JOIN templates t ON ct.template_id = t.template_id
       WHERE ct.certificate_type_id = @certificateTypeId`,
      { certificateTypeId }
    );

    return result.rows[0] || null;
  }

  /**
   * Get certificate type by code and parish
   */
  public static async findByCode(parishId: number, typeCode: string): Promise<ICertificateType | null> {
    const result = await database.executeQuery<ICertificateType>(
      `SELECT
        ct.*,
        t.template_name,
        t.html_content,
        t.placeholders
       FROM certificate_types ct
       LEFT JOIN templates t ON ct.template_id = t.template_id
       WHERE ct.parish_id = @parishId AND ct.type_code = @typeCode AND ct.is_active = TRUE`,
      { parishId, typeCode }
    );

    return result.rows[0] || null;
  }

  /**
   * Create new certificate type
   */
  public static async create(certTypeData: ICertificateTypeInput): Promise<ICertificateType> {
    const result = await database.executeQuery<ICertificateType>(
      `INSERT INTO certificate_types (
        parish_id, template_id, type_name, type_code,
        description, prefix, created_by
      )
      VALUES (
        @parishId, @templateId, @typeName, @typeCode,
        @description, @prefix, @createdBy
      )
      RETURNING *`,
      {
        parishId: certTypeData.parish_id,
        templateId: certTypeData.template_id,
        typeName: certTypeData.type_name,
        typeCode: certTypeData.type_code,
        description: certTypeData.description || null,
        prefix: certTypeData.prefix || null,
        createdBy: certTypeData.created_by || null
      }
    );

    return result.rows[0];
  }

  /**
   * Update certificate type
   */
  public static async update(
    certificateTypeId: number,
    updates: ICertificateTypeUpdate
  ): Promise<ICertificateType> {
    const setClauses: string[] = [];
    const params: Record<string, any> = { certificateTypeId };

    if (updates.template_id !== undefined) {
      setClauses.push('template_id = @templateId');
      params.templateId = updates.template_id;
    }
    if (updates.type_name !== undefined) {
      setClauses.push('type_name = @typeName');
      params.typeName = updates.type_name;
    }
    if (updates.type_code !== undefined) {
      setClauses.push('type_code = @typeCode');
      params.typeCode = updates.type_code;
    }
    if (updates.description !== undefined) {
      setClauses.push('description = @description');
      params.description = updates.description;
    }
    if (updates.prefix !== undefined) {
      setClauses.push('prefix = @prefix');
      params.prefix = updates.prefix;
    }
    if (updates.is_active !== undefined) {
      setClauses.push('is_active = @isActive');
      params.isActive = updates.is_active;
    }

    if (setClauses.length === 0) {
      // No updates provided, just return the existing certificate type
      return this.findById(certificateTypeId) as Promise<ICertificateType>;
    }

    setClauses.push('updated_at = NOW()');

    const result = await database.executeQuery<ICertificateType>(
      `UPDATE certificate_types
       SET ${setClauses.join(', ')}
       WHERE certificate_type_id = @certificateTypeId
       RETURNING *`,
      params
    );

    if (!result.rows[0]) {
      throw new Error('Certificate type not found');
    }

    return result.rows[0];
  }

  /**
   * Soft delete certificate type
   */
  public static async delete(certificateTypeId: number): Promise<void> {
    await database.executeQuery(
      `UPDATE certificate_types
       SET is_active = FALSE, updated_at = NOW()
       WHERE certificate_type_id = @certificateTypeId`,
      { certificateTypeId }
    );
  }

  /**
   * Hard delete certificate type (use with caution)
   */
  public static async hardDelete(certificateTypeId: number): Promise<void> {
    await database.executeQuery(
      'DELETE FROM certificate_types WHERE certificate_type_id = @certificateTypeId',
      { certificateTypeId }
    );
  }

  /**
   * Check if type code exists for a parish
   */
  public static async codeExists(
    parishId: number,
    typeCode: string,
    excludeId?: number
  ): Promise<boolean> {
    const query = excludeId
      ? `SELECT COUNT(*) as count FROM certificate_types
         WHERE parish_id = @parishId AND type_code = @typeCode AND certificate_type_id != @excludeId`
      : `SELECT COUNT(*) as count FROM certificate_types
         WHERE parish_id = @parishId AND type_code = @typeCode`;

    const params: Record<string, any> = { parishId, typeCode };
    if (excludeId) {
      params.excludeId = excludeId;
    }

    const result = await database.executeQuery<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count || '0', 10) > 0;
  }
}
