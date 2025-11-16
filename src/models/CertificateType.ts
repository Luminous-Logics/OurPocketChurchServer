import database from '../config/database';
import { ICertificateType, ICertificateTypeInput, ICertificateTypeUpdate } from '../types';
import { ApiError } from '../utils/apiError';

/**
 * CertificateType Model
 * Handles all database operations for certificate types
 */
export class CertificateTypeModel {
  /**
   * Find a certificate type by ID
   */
  public static async findById(certificateTypeId: number): Promise<ICertificateType | null> {
    try {
      const result = await database.executeQuery<ICertificateType>(
        `SELECT * FROM certificate_types WHERE certificate_type_id = @certificateTypeId`,
        { certificateTypeId }
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding certificate type by ID:', error);
      throw ApiError.internal('Failed to retrieve certificate type');
    }
  }

  /**
   * Find all certificate types for a parish
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20,
    isActive?: boolean
  ): Promise<ICertificateType[]> {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT ct.*,
               t.template_name as default_template_name
        FROM certificate_types ct
        LEFT JOIN templates t ON ct.default_template_id = t.template_id
        WHERE ct.parish_id = @parishId
      `;

      const params: Record<string, any> = { parishId, limit, offset };

      if (isActive !== undefined) {
        query += ` AND ct.is_active = @isActive`;
        params.isActive = isActive;
      }

      query += ` ORDER BY ct.created_at DESC LIMIT @limit OFFSET @offset`;

      const result = await database.executeQuery<ICertificateType>(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding certificate types by parish ID:', error);
      throw ApiError.internal('Failed to retrieve certificate types');
    }
  }

  /**
   * Count certificate types for a parish
   */
  public static async countByParishId(parishId: number, isActive?: boolean): Promise<number> {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM certificate_types
        WHERE parish_id = @parishId
      `;

      const params: Record<string, any> = { parishId };

      if (isActive !== undefined) {
        query += ` AND is_active = @isActive`;
        params.isActive = isActive;
      }

      const result = await database.executeQuery<{ count: string }>(query, params);
      return parseInt(result.rows[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error counting certificate types:', error);
      throw ApiError.internal('Failed to count certificate types');
    }
  }

  /**
   * Find certificate type by code within a parish
   */
  public static async findByCode(
    parishId: number,
    typeCode: string
  ): Promise<ICertificateType | null> {
    try {
      const result = await database.executeQuery<ICertificateType>(
        `SELECT * FROM certificate_types
         WHERE parish_id = @parishId AND type_code = @typeCode`,
        { parishId, typeCode }
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding certificate type by code:', error);
      throw ApiError.internal('Failed to retrieve certificate type');
    }
  }

  /**
   * Create a new certificate type
   */
  public static async create(typeData: ICertificateTypeInput): Promise<ICertificateType> {
    try {
      // Check if parish exists
      const parishExists = await database.executeQuery(
        `SELECT parish_id FROM parishes WHERE parish_id = @parishId`,
        { parishId: typeData.parish_id }
      );

      if (parishExists.rows.length === 0) {
        throw ApiError.notFound('Parish not found');
      }

      // Check if type code already exists for this parish
      const existingType = await this.findByCode(typeData.parish_id, typeData.type_code);
      if (existingType) {
        throw ApiError.conflict(
          `Certificate type with code '${typeData.type_code}' already exists for this parish`
        );
      }

      // If default_template_id is provided, verify it exists and belongs to this parish
      if (typeData.default_template_id) {
        const templateExists = await database.executeQuery(
          `SELECT template_id FROM templates
           WHERE template_id = @templateId AND parish_id = @parishId`,
          { templateId: typeData.default_template_id, parishId: typeData.parish_id }
        );

        if (templateExists.rows.length === 0) {
          throw ApiError.badRequest('Template not found or does not belong to this parish');
        }
      }

      // Build dynamic insert query
      const fields: string[] = ['parish_id', 'type_name', 'type_code'];
      const params: Record<string, any> = {
        parish_id: typeData.parish_id,
        type_name: typeData.type_name,
        type_code: typeData.type_code,
      };

      // Add optional fields with defaults
      if (typeData.description !== undefined) {
        fields.push('description');
        params.description = typeData.description;
      }

      if (typeData.default_template_id !== undefined) {
        fields.push('default_template_id');
        params.default_template_id = typeData.default_template_id;
      }

      if (typeData.requires_approval !== undefined) {
        fields.push('requires_approval');
        params.requires_approval = typeData.requires_approval;
      }

      if (typeData.auto_generate_number !== undefined) {
        fields.push('auto_generate_number');
        params.auto_generate_number = typeData.auto_generate_number;
      }

      if (typeData.number_prefix !== undefined) {
        fields.push('number_prefix');
        params.number_prefix = typeData.number_prefix;
      }

      if (typeData.number_format !== undefined) {
        fields.push('number_format');
        params.number_format = typeData.number_format;
      }

      if (typeData.available_placeholders !== undefined) {
        fields.push('available_placeholders');
        params.available_placeholders = JSON.stringify(typeData.available_placeholders);
      }

      if (typeData.is_active !== undefined) {
        fields.push('is_active');
        params.is_active = typeData.is_active;
      }

      if (typeData.created_by !== undefined) {
        fields.push('created_by');
        params.created_by = typeData.created_by;
      }

      const fieldNames = fields.join(', ');
      const fieldPlaceholders = fields.map(f => `@${f}`).join(', ');

      const query = `
        INSERT INTO certificate_types (${fieldNames})
        VALUES (${fieldPlaceholders})
        RETURNING *
      `;

      const result = await database.executeQuery<ICertificateType>(query, params);
      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error creating certificate type:', error);
      throw ApiError.internal('Failed to create certificate type');
    }
  }

  /**
   * Update a certificate type
   */
  public static async update(
    certificateTypeId: number,
    updateData: ICertificateTypeUpdate
  ): Promise<ICertificateType> {
    try {
      // Check if certificate type exists
      const existingType = await this.findById(certificateTypeId);
      if (!existingType) {
        throw ApiError.notFound('Certificate type not found');
      }

      // If type_code is being updated, check for uniqueness
      if (updateData.type_code && updateData.type_code !== existingType.type_code) {
        const codeExists = await this.findByCode(existingType.parish_id, updateData.type_code);
        if (codeExists) {
          throw ApiError.conflict(
            `Certificate type with code '${updateData.type_code}' already exists for this parish`
          );
        }
      }

      // If default_template_id is being updated, verify it exists and belongs to this parish
      if (updateData.default_template_id) {
        const templateExists = await database.executeQuery(
          `SELECT template_id FROM templates
           WHERE template_id = @templateId AND parish_id = @parishId`,
          { templateId: updateData.default_template_id, parishId: existingType.parish_id }
        );

        if (templateExists.rows.length === 0) {
          throw ApiError.badRequest('Template not found or does not belong to this parish');
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: Record<string, any> = { certificateTypeId };

      if (updateData.type_name !== undefined) {
        updateFields.push('type_name = @type_name');
        params.type_name = updateData.type_name;
      }

      if (updateData.type_code !== undefined) {
        updateFields.push('type_code = @type_code');
        params.type_code = updateData.type_code;
      }

      if (updateData.description !== undefined) {
        updateFields.push('description = @description');
        params.description = updateData.description;
      }

      if (updateData.default_template_id !== undefined) {
        updateFields.push('default_template_id = @default_template_id');
        params.default_template_id = updateData.default_template_id;
      }

      if (updateData.requires_approval !== undefined) {
        updateFields.push('requires_approval = @requires_approval');
        params.requires_approval = updateData.requires_approval;
      }

      if (updateData.auto_generate_number !== undefined) {
        updateFields.push('auto_generate_number = @auto_generate_number');
        params.auto_generate_number = updateData.auto_generate_number;
      }

      if (updateData.number_prefix !== undefined) {
        updateFields.push('number_prefix = @number_prefix');
        params.number_prefix = updateData.number_prefix;
      }

      if (updateData.number_format !== undefined) {
        updateFields.push('number_format = @number_format');
        params.number_format = updateData.number_format;
      }

      if (updateData.available_placeholders !== undefined) {
        updateFields.push('available_placeholders = @available_placeholders');
        params.available_placeholders = JSON.stringify(updateData.available_placeholders);
      }

      if (updateData.is_active !== undefined) {
        updateFields.push('is_active = @is_active');
        params.is_active = updateData.is_active;
      }

      if (updateFields.length === 0) {
        throw ApiError.badRequest('No fields to update');
      }

      const query = `
        UPDATE certificate_types
        SET ${updateFields.join(', ')}
        WHERE certificate_type_id = @certificateTypeId
        RETURNING *
      `;

      const result = await database.executeQuery<ICertificateType>(query, params);
      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error updating certificate type:', error);
      throw ApiError.internal('Failed to update certificate type');
    }
  }

  /**
   * Delete a certificate type (soft delete)
   */
  public static async softDelete(certificateTypeId: number): Promise<void> {
    try {
      const existingType = await this.findById(certificateTypeId);
      if (!existingType) {
        throw ApiError.notFound('Certificate type not found');
      }

      // Check if there are any certificates using this type
      const certificatesExist = await database.executeQuery(
        `SELECT COUNT(*) as count FROM certificates
         WHERE certificate_type_id = @certificateTypeId`,
        { certificateTypeId }
      );

      const count = parseInt(certificatesExist.rows[0]?.count || '0', 10);
      if (count > 0) {
        throw ApiError.badRequest(
          `Cannot delete certificate type. ${count} certificate(s) are using this type. Please deactivate instead.`
        );
      }

      await database.executeQuery(
        `UPDATE certificate_types SET is_active = false
         WHERE certificate_type_id = @certificateTypeId`,
        { certificateTypeId }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error soft deleting certificate type:', error);
      throw ApiError.internal('Failed to delete certificate type');
    }
  }

  /**
   * Hard delete a certificate type
   */
  public static async hardDelete(certificateTypeId: number): Promise<void> {
    try {
      const existingType = await this.findById(certificateTypeId);
      if (!existingType) {
        throw ApiError.notFound('Certificate type not found');
      }

      // Check if there are any certificates using this type
      const certificatesExist = await database.executeQuery(
        `SELECT COUNT(*) as count FROM certificates
         WHERE certificate_type_id = @certificateTypeId`,
        { certificateTypeId }
      );

      const count = parseInt(certificatesExist.rows[0]?.count || '0', 10);
      if (count > 0) {
        throw ApiError.badRequest(
          `Cannot delete certificate type. ${count} certificate(s) are using this type.`
        );
      }

      await database.executeQuery(
        `DELETE FROM certificate_types WHERE certificate_type_id = @certificateTypeId`,
        { certificateTypeId }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error hard deleting certificate type:', error);
      throw ApiError.internal('Failed to delete certificate type');
    }
  }
}
