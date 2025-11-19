import database from '../config/database';
import { ITemplate, ITemplateInput, ITemplateUpdate } from '../types';
import { TemplateRenderer } from '../utils/template-renderer';

export class TemplateModel {
  /**
   * Get all templates for a parish
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 50,
    activeOnly: boolean = true
  ): Promise<ITemplate[]> {
    const offset = (page - 1) * limit;

    const query = activeOnly
      ? `SELECT * FROM templates
         WHERE parish_id = @parishId AND is_active = TRUE
         ORDER BY created_at DESC
         LIMIT @limit OFFSET @offset`
      : `SELECT * FROM templates
         WHERE parish_id = @parishId
         ORDER BY created_at DESC
         LIMIT @limit OFFSET @offset`;

    const result = await database.executeQuery<ITemplate>(query, {
      parishId,
      limit,
      offset
    });

    return result.rows;
  }

  /**
   * Count templates for a parish
   */
  public static async countByParishId(parishId: number, activeOnly: boolean = true): Promise<number> {
    const query = activeOnly
      ? 'SELECT COUNT(*) as count FROM templates WHERE parish_id = @parishId AND is_active = TRUE'
      : 'SELECT COUNT(*) as count FROM templates WHERE parish_id = @parishId';

    const result = await database.executeQuery<{ count: string }>(query, { parishId });
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get template by ID
   */
  public static async findById(templateId: number): Promise<ITemplate | null> {
    const result = await database.executeQuery<ITemplate>(
      'SELECT * FROM templates WHERE template_id = @templateId',
      { templateId }
    );

    return result.rows[0] || null;
  }

  /**
   * Get template by code and parish
   */
  public static async findByCode(parishId: number, templateCode: string): Promise<ITemplate | null> {
    const result = await database.executeQuery<ITemplate>(
      `SELECT * FROM templates
       WHERE parish_id = @parishId AND template_code = @templateCode AND is_active = TRUE`,
      { parishId, templateCode }
    );

    return result.rows[0] || null;
  }

  /**
   * Get templates by category
   */
  public static async findByCategory(parishId: number, category: string): Promise<ITemplate[]> {
    const result = await database.executeQuery<ITemplate>(
      `SELECT * FROM templates
       WHERE parish_id = @parishId AND category = @category AND is_active = TRUE
       ORDER BY template_name`,
      { parishId, category }
    );

    return result.rows;
  }

  /**
   * Extract placeholders from HTML content
   */
  private static extractPlaceholders(htmlContent: string): string[] {
    return TemplateRenderer.extractVariables(htmlContent);
  }

  /**
   * Create new template
   */
  public static async create(templateData: ITemplateInput): Promise<ITemplate> {
    // Extract placeholders from HTML content
    const placeholders = this.extractPlaceholders(templateData.html_content);
    const placeholdersJson = JSON.stringify(placeholders);

    const result = await database.executeQuery<ITemplate>(
      `INSERT INTO templates (
        parish_id, template_name, template_code, description,
        html_content, placeholders, category, created_by
      )
      VALUES (
        @parishId, @templateName, @templateCode, @description,
        @htmlContent, @placeholders::jsonb, @category, @createdBy
      )
      RETURNING *`,
      {
        parishId: templateData.parish_id,
        templateName: templateData.template_name,
        templateCode: templateData.template_code,
        description: templateData.description || null,
        htmlContent: templateData.html_content,
        placeholders: placeholdersJson,
        category: templateData.category || null,
        createdBy: templateData.created_by || null
      }
    );

    return result.rows[0];
  }

  /**
   * Update template
   */
  public static async update(templateId: number, updates: ITemplateUpdate): Promise<ITemplate> {
    const setClauses: string[] = [];
    const params: Record<string, any> = { templateId };

    if (updates.template_name !== undefined) {
      setClauses.push('template_name = @templateName');
      params.templateName = updates.template_name;
    }
    if (updates.template_code !== undefined) {
      setClauses.push('template_code = @templateCode');
      params.templateCode = updates.template_code;
    }
    if (updates.description !== undefined) {
      setClauses.push('description = @description');
      params.description = updates.description;
    }
    if (updates.html_content !== undefined) {
      setClauses.push('html_content = @htmlContent');
      params.htmlContent = updates.html_content;

      // Re-extract placeholders when HTML content is updated
      const placeholders = this.extractPlaceholders(updates.html_content);
      setClauses.push('placeholders = @placeholders::jsonb');
      params.placeholders = JSON.stringify(placeholders);
    }
    if (updates.category !== undefined) {
      setClauses.push('category = @category');
      params.category = updates.category;
    }
    if (updates.is_active !== undefined) {
      setClauses.push('is_active = @isActive');
      params.isActive = updates.is_active;
    }

    if (setClauses.length === 0) {
      // No updates provided, just return the existing template
      return this.findById(templateId) as Promise<ITemplate>;
    }

    setClauses.push('updated_at = NOW()');

    const result = await database.executeQuery<ITemplate>(
      `UPDATE templates
       SET ${setClauses.join(', ')}
       WHERE template_id = @templateId
       RETURNING *`,
      params
    );

    if (!result.rows[0]) {
      throw new Error('Template not found');
    }

    return result.rows[0];
  }

  /**
   * Soft delete template
   */
  public static async delete(templateId: number): Promise<void> {
    await database.executeQuery(
      `UPDATE templates
       SET is_active = FALSE, updated_at = NOW()
       WHERE template_id = @templateId`,
      { templateId }
    );
  }

  /**
   * Hard delete template (use with caution)
   */
  public static async hardDelete(templateId: number): Promise<void> {
    await database.executeQuery(
      'DELETE FROM templates WHERE template_id = @templateId',
      { templateId }
    );
  }

  /**
   * Check if template code exists for a parish
   */
  public static async codeExists(parishId: number, templateCode: string, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? `SELECT COUNT(*) as count FROM templates
         WHERE parish_id = @parishId AND template_code = @templateCode AND template_id != @excludeId`
      : `SELECT COUNT(*) as count FROM templates
         WHERE parish_id = @parishId AND template_code = @templateCode`;

    const params: Record<string, any> = { parishId, templateCode };
    if (excludeId) {
      params.excludeId = excludeId;
    }

    const result = await database.executeQuery<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count || '0', 10) > 0;
  }
}
