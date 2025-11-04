import database from '../config/database';

export interface IEmailTemplate {
  template_id: number;
  template_code: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  category?: string;
  variables?: string; // JSON string array
  description?: string;
  is_active: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateEmailTemplate {
  template_code: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  category?: string;
  variables?: string[];
  description?: string;
  created_by?: number;
}

export class EmailTemplateModel {
  /**
   * Get all email templates
   */
  public static async getAll(activeOnly: boolean = true): Promise<IEmailTemplate[]> {
    const query = activeOnly
      ? 'SELECT * FROM email_templates WHERE is_active = TRUE ORDER BY category, template_name'
      : 'SELECT * FROM email_templates ORDER BY category, template_name';

    const result = await database.executeQuery<IEmailTemplate>(query);
    return result.rows;
  }

  /**
   * Get template by code
   */
  public static async getByCode(templateCode: string): Promise<IEmailTemplate | null> {
    const result = await database.executeQuery<IEmailTemplate>(
      `SELECT * FROM email_templates
        WHERE template_code = @templateCode AND is_active = TRUE`,
      { templateCode }
    );

    return result.rows[0] || null;
  }

  /**
   * Get template by ID
   */
  public static async getById(templateId: number): Promise<IEmailTemplate | null> {
    const result = await database.executeQuery<IEmailTemplate>(
      'SELECT * FROM email_templates WHERE template_id = @templateId',
      { templateId }
    );

    return result.rows[0] || null;
  }

  /**
   * Get templates by category
   */
  public static async getByCategory(category: string): Promise<IEmailTemplate[]> {
    const result = await database.executeQuery<IEmailTemplate>(
      `SELECT * FROM email_templates
        WHERE category = @category AND is_active = TRUE
        ORDER BY template_name`,
      { category }
    );

    return result.rows;
  }

  /**
   * Create new email template
   */
  public static async create(template: ICreateEmailTemplate): Promise<IEmailTemplate> {
    const variablesJson = template.variables ? JSON.stringify(template.variables) : null;

    const result = await database.executeQuery<IEmailTemplate>(
      `INSERT INTO email_templates (
          template_code, template_name, subject, body_html, body_text,
          category, variables, description, created_by
        )
        VALUES (
          @templateCode, @templateName, @subject, @bodyHtml, @bodyText,
          @category, @variables, @description, @createdBy
        )
        RETURNING *`,
      {
        templateCode: template.template_code,
        templateName: template.template_name,
        subject: template.subject,
        bodyHtml: template.body_html,
        bodyText: template.body_text || null,
        category: template.category || null,
        variables: variablesJson,
        description: template.description || null,
        createdBy: template.created_by || null
      }
    );

    return result.rows[0];
  }

  /**
   * Update email template
   */
  public static async update(
    templateCode: string,
    updates: Partial<ICreateEmailTemplate> & { is_active?: boolean }
  ): Promise<IEmailTemplate> {
    const variablesJson = updates.variables ? JSON.stringify(updates.variables) : undefined;

    const setClauses: string[] = [];
    const params: Record<string, any> = { templateCode };

    if (updates.template_name !== undefined) {
      setClauses.push('template_name = @templateName');
      params.templateName = updates.template_name;
    }
    if (updates.subject !== undefined) {
      setClauses.push('subject = @subject');
      params.subject = updates.subject;
    }
    if (updates.body_html !== undefined) {
      setClauses.push('body_html = @bodyHtml');
      params.bodyHtml = updates.body_html;
    }
    if (updates.body_text !== undefined) {
      setClauses.push('body_text = @bodyText');
      params.bodyText = updates.body_text;
    }
    if (updates.category !== undefined) {
      setClauses.push('category = @category');
      params.category = updates.category;
    }
    if (variablesJson !== undefined) {
      setClauses.push('variables = @variables');
      params.variables = variablesJson;
    }
    if (updates.description !== undefined) {
      setClauses.push('description = @description');
      params.description = updates.description;
    }
    if (updates.is_active !== undefined) {
      setClauses.push('is_active = @isActive');
      params.isActive = updates.is_active;
    }

    setClauses.push('updated_at = NOW()');

    const result = await database.executeQuery<IEmailTemplate>(
      `UPDATE email_templates
      SET ${setClauses.join(', ')}
      WHERE template_code = @templateCode
      RETURNING *`,
      params
    );

    return result.rows[0];
  }

  /**
   * Soft delete template
   */
  public static async delete(templateCode: string): Promise<void> {
    await database.executeQuery(
      `UPDATE email_templates
        SET is_active = FALSE, updated_at = NOW()
        WHERE template_code = @templateCode`,
      { templateCode }
    );
  }

  /**
   * Hard delete template (use with caution)
   */
  public static async hardDelete(templateCode: string): Promise<void> {
    await database.executeQuery(
      'DELETE FROM email_templates WHERE template_code = @templateCode',
      { templateCode }
    );
  }
}
