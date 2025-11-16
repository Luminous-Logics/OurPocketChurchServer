import database from '../config/database';
import { ITemplate, ITemplateInput, ITemplateUpdate } from '../types';
import { ApiError } from '../utils/apiError';

/**
 * Template Model
 * Handles all database operations for HTML templates
 */
export class TemplateModel {
  /**
   * Find a template by ID
   */
  public static async findById(templateId: number): Promise<ITemplate | null> {
    try {
      const result = await database.executeQuery<ITemplate>(
        `SELECT * FROM templates WHERE template_id = @templateId`,
        { templateId }
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding template by ID:', error);
      throw ApiError.internal('Failed to retrieve template');
    }
  }

  /**
   * Find all templates for a parish with pagination
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20,
    category?: string,
    isActive?: boolean
  ): Promise<ITemplate[]> {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT t.*,
               u.first_name || ' ' || u.last_name AS created_by_name
        FROM templates t
        LEFT JOIN users u ON t.created_by = u.user_id
        WHERE t.parish_id = @parishId
      `;

      const params: Record<string, any> = { parishId, limit, offset };

      // Add category filter if provided
      if (category) {
        query += ` AND t.category = @category`;
        params.category = category;
      }

      // Add active status filter if provided
      if (isActive !== undefined) {
        query += ` AND t.is_active = @isActive`;
        params.isActive = isActive;
      }

      query += ` ORDER BY t.created_at DESC LIMIT @limit OFFSET @offset`;

      const result = await database.executeQuery<ITemplate>(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding templates by parish ID:', error);
      throw ApiError.internal('Failed to retrieve templates');
    }
  }

  /**
   * Count templates for a parish
   */
  public static async countByParishId(
    parishId: number,
    category?: string,
    isActive?: boolean
  ): Promise<number> {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM templates
        WHERE parish_id = @parishId
      `;

      const params: Record<string, any> = { parishId };

      if (category) {
        query += ` AND category = @category`;
        params.category = category;
      }

      if (isActive !== undefined) {
        query += ` AND is_active = @isActive`;
        params.isActive = isActive;
      }

      const result = await database.executeQuery<{ count: string }>(query, params);
      return parseInt(result.rows[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error counting templates:', error);
      throw ApiError.internal('Failed to count templates');
    }
  }

  /**
   * Find template by code within a parish
   */
  public static async findByCode(
    parishId: number,
    templateCode: string
  ): Promise<ITemplate | null> {
    try {
      const result = await database.executeQuery<ITemplate>(
        `SELECT * FROM templates
         WHERE parish_id = @parishId AND template_code = @templateCode`,
        { parishId, templateCode }
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding template by code:', error);
      throw ApiError.internal('Failed to retrieve template');
    }
  }

  /**
   * Create a new template
   */
  public static async create(templateData: ITemplateInput): Promise<ITemplate> {
    try {
      // Check if parish exists
      const parishExists = await database.executeQuery(
        `SELECT parish_id FROM parishes WHERE parish_id = @parishId`,
        { parishId: templateData.parish_id }
      );

      if (parishExists.rows.length === 0) {
        throw ApiError.notFound('Parish not found');
      }

      // Check if template code already exists for this parish
      const existingTemplate = await this.findByCode(
        templateData.parish_id,
        templateData.template_code
      );

      if (existingTemplate) {
        throw ApiError.conflict(
          `Template with code '${templateData.template_code}' already exists for this parish`
        );
      }

      // Build dynamic insert query
      const fields: string[] = [
        'parish_id',
        'template_name',
        'template_code',
        'html_content',
      ];
      const params: Record<string, any> = {
        parish_id: templateData.parish_id,
        template_name: templateData.template_name,
        template_code: templateData.template_code,
        html_content: templateData.html_content,
      };

      // Add optional fields
      if (templateData.description !== undefined) {
        fields.push('description');
        params.description = templateData.description;
      }

      if (templateData.category !== undefined) {
        fields.push('category');
        params.category = templateData.category;
      }

      if (templateData.is_active !== undefined) {
        fields.push('is_active');
        params.is_active = templateData.is_active;
      }

      if (templateData.created_by !== undefined) {
        fields.push('created_by');
        params.created_by = templateData.created_by;
      }

      const fieldNames = fields.join(', ');
      const fieldPlaceholders = fields.map(f => `@${f}`).join(', ');

      const query = `
        INSERT INTO templates (${fieldNames})
        VALUES (${fieldPlaceholders})
        RETURNING *
      `;

      const result = await database.executeQuery<ITemplate>(query, params);
      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error creating template:', error);
      throw ApiError.internal('Failed to create template');
    }
  }

  /**
   * Update a template
   */
  public static async update(
    templateId: number,
    updateData: ITemplateUpdate
  ): Promise<ITemplate> {
    try {
      // Check if template exists
      const existingTemplate = await this.findById(templateId);
      if (!existingTemplate) {
        throw ApiError.notFound('Template not found');
      }

      // If template_code is being updated, check for uniqueness
      if (updateData.template_code && updateData.template_code !== existingTemplate.template_code) {
        const codeExists = await this.findByCode(
          existingTemplate.parish_id,
          updateData.template_code
        );
        if (codeExists) {
          throw ApiError.conflict(
            `Template with code '${updateData.template_code}' already exists for this parish`
          );
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: Record<string, any> = { templateId };

      if (updateData.template_name !== undefined) {
        updateFields.push('template_name = @template_name');
        params.template_name = updateData.template_name;
      }

      if (updateData.template_code !== undefined) {
        updateFields.push('template_code = @template_code');
        params.template_code = updateData.template_code;
      }

      if (updateData.description !== undefined) {
        updateFields.push('description = @description');
        params.description = updateData.description;
      }

      if (updateData.html_content !== undefined) {
        updateFields.push('html_content = @html_content');
        params.html_content = updateData.html_content;
      }

      if (updateData.category !== undefined) {
        updateFields.push('category = @category');
        params.category = updateData.category;
      }

      if (updateData.is_active !== undefined) {
        updateFields.push('is_active = @is_active');
        params.is_active = updateData.is_active;
      }

      if (updateFields.length === 0) {
        throw ApiError.badRequest('No fields to update');
      }

      const query = `
        UPDATE templates
        SET ${updateFields.join(', ')}
        WHERE template_id = @templateId
        RETURNING *
      `;

      const result = await database.executeQuery<ITemplate>(query, params);
      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error updating template:', error);
      throw ApiError.internal('Failed to update template');
    }
  }

  /**
   * Delete a template (soft delete by setting is_active = false)
   */
  public static async softDelete(templateId: number): Promise<void> {
    try {
      const existingTemplate = await this.findById(templateId);
      if (!existingTemplate) {
        throw ApiError.notFound('Template not found');
      }

      await database.executeQuery(
        `UPDATE templates SET is_active = false WHERE template_id = @templateId`,
        { templateId }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error soft deleting template:', error);
      throw ApiError.internal('Failed to delete template');
    }
  }

  /**
   * Hard delete a template (permanent deletion)
   */
  public static async hardDelete(templateId: number): Promise<void> {
    try {
      const existingTemplate = await this.findById(templateId);
      if (!existingTemplate) {
        throw ApiError.notFound('Template not found');
      }

      await database.executeQuery(
        `DELETE FROM templates WHERE template_id = @templateId`,
        { templateId }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error hard deleting template:', error);
      throw ApiError.internal('Failed to delete template');
    }
  }

  /**
   * Search templates by name or code
   */
  public static async search(
    parishId: number,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ITemplate[]> {
    try {
      const offset = (page - 1) * limit;
      const searchPattern = `%${searchTerm}%`;

      const query = `
        SELECT t.*,
               u.first_name || ' ' || u.last_name AS created_by_name
        FROM templates t
        LEFT JOIN users u ON t.created_by = u.user_id
        WHERE t.parish_id = @parishId
          AND (
            t.template_name ILIKE @searchPattern
            OR t.template_code ILIKE @searchPattern
            OR t.description ILIKE @searchPattern
          )
        ORDER BY t.created_at DESC
        LIMIT @limit OFFSET @offset
      `;

      const result = await database.executeQuery<ITemplate>(query, {
        parishId,
        searchPattern,
        limit,
        offset,
      });

      return result.rows;
    } catch (error) {
      console.error('Error searching templates:', error);
      throw ApiError.internal('Failed to search templates');
    }
  }

  /**
   * Get all unique categories for a parish
   */
  public static async getCategories(parishId: number): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT category
        FROM templates
        WHERE parish_id = @parishId
          AND category IS NOT NULL
        ORDER BY category ASC
      `;

      const result = await database.executeQuery<{ category: string }>(query, {
        parishId,
      });

      return result.rows.map(row => row.category);
    } catch (error) {
      console.error('Error getting template categories:', error);
      throw ApiError.internal('Failed to retrieve template categories');
    }
  }
}
