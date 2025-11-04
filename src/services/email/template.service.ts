/**
 * Template Service
 *
 * Manages email templates from the database and renders them with variables.
 * Provides a clean API for template management and rendering.
 */

import { EmailTemplateModel, IEmailTemplate, ICreateEmailTemplate } from '../../models/EmailTemplate';
import { TemplateRenderer } from '../../utils/template-renderer';
import logger from '../../utils/logger';
import { ApiError } from '../../utils/apiError';

export interface RenderOptions {
  templateCode: string;
  variables: Record<string, any>;
  recipientEmail?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text?: string;
  templateCode: string;
}

export class TemplateService {
  private static instance: TemplateService;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Render an email template with variables
   */
  async renderTemplate(options: RenderOptions): Promise<RenderedEmail> {
    const { templateCode, variables, recipientEmail } = options;

    try {
      // Get template from database
      const template = await EmailTemplateModel.getByCode(templateCode);

      if (!template) {
        logger.error(`Template not found: ${templateCode}`);
        throw ApiError.notFound(`Email template '${templateCode}' not found`);
      }

      if (!template.is_active) {
        logger.error(`Template is inactive: ${templateCode}`);
        throw ApiError.badRequest(`Email template '${templateCode}' is not active`);
      }

      // Parse required variables
      let requiredVariables: string[] = [];
      if (template.variables) {
        try {
          requiredVariables = JSON.parse(template.variables);
        } catch (error) {
          logger.warn(`Failed to parse template variables for ${templateCode}`, { error });
        }
      }

      // Validate that all required variables are provided
      const validation = TemplateRenderer.validateVariables(requiredVariables, variables);
      if (!validation.valid) {
        logger.error(`Missing required variables for template ${templateCode}`, {
          missing: validation.missing,
        });
        throw ApiError.badRequest(
          `Missing required variables for template '${templateCode}': ${validation.missing.join(', ')}`
        );
      }

      // Add recipient email to variables if provided
      const templateVariables = {
        ...variables,
        recipientEmail: recipientEmail || variables.email || '',
        currentYear: new Date().getFullYear(),
        appName: 'Parish Nexus',
      };

      // Render subject, HTML, and text versions
      const renderedSubject = TemplateRenderer.render(template.subject, templateVariables);
      const renderedHtml = TemplateRenderer.render(template.body_html, templateVariables);
      const renderedText = template.body_text
        ? TemplateRenderer.render(template.body_text, templateVariables)
        : undefined;

      logger.info(`Template rendered successfully: ${templateCode}`, {
        recipientEmail,
      });

      return {
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText,
        templateCode,
      };
    } catch (error) {
      logger.error(`Failed to render template: ${templateCode}`, { error });
      throw error;
    }
  }

  /**
   * Get all active templates
   */
  async getActiveTemplates(): Promise<IEmailTemplate[]> {
    try {
      return await EmailTemplateModel.getAll();
    } catch (error) {
      logger.error('Failed to get active templates', { error });
      throw ApiError.internal('Failed to retrieve email templates');
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<IEmailTemplate[]> {
    try {
      return await EmailTemplateModel.getByCategory(category);
    } catch (error) {
      logger.error(`Failed to get templates by category: ${category}`, { error });
      throw ApiError.internal('Failed to retrieve email templates');
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(template: ICreateEmailTemplate & { is_active?: boolean }): Promise<IEmailTemplate> {
    try {
      // Validate that variables is valid JSON if provided
      if (template.variables) {
        try {
          if (typeof template.variables === 'string') {
            JSON.parse(template.variables);
          }
        } catch (error) {
          throw ApiError.badRequest('Template variables must be a valid JSON array');
        }
      }

      const newTemplate = await EmailTemplateModel.create(template);
      logger.info(`Template created: ${template.template_code}`, {
        template_id: newTemplate.template_id,
      });

      return newTemplate;
    } catch (error) {
      logger.error(`Failed to create template: ${template.template_code}`, { error });
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateCode: string,
    updates: Partial<ICreateEmailTemplate> & { is_active?: boolean }
  ): Promise<IEmailTemplate> {
    try {
      // Validate that variables is valid JSON if provided
      if (updates.variables) {
        try {
          if (typeof updates.variables === 'string') {
            JSON.parse(updates.variables);
          }
        } catch (error) {
          throw ApiError.badRequest('Template variables must be a valid JSON array');
        }
      }

      const updatedTemplate = await EmailTemplateModel.update(templateCode, updates);

      if (!updatedTemplate) {
        throw ApiError.notFound(`Email template '${templateCode}' not found`);
      }

      logger.info(`Template updated: ${templateCode}`);
      return updatedTemplate;
    } catch (error) {
      logger.error(`Failed to update template: ${templateCode}`, { error });
      throw error;
    }
  }

  /**
   * Delete a template (soft delete by setting is_active = false)
   */
  async deleteTemplate(templateCode: string): Promise<void> {
    try {
      await EmailTemplateModel.update(templateCode, { is_active: false });
      logger.info(`Template deleted: ${templateCode}`);
    } catch (error) {
      logger.error(`Failed to delete template: ${templateCode}`, { error });
      throw ApiError.internal('Failed to delete email template');
    }
  }

  /**
   * Preview a template with sample variables (for admin panel)
   */
  async previewTemplate(templateCode: string, sampleVariables: Record<string, any>): Promise<RenderedEmail> {
    try {
      return await this.renderTemplate({
        templateCode,
        variables: sampleVariables,
      });
    } catch (error) {
      logger.error(`Failed to preview template: ${templateCode}`, { error });
      throw error;
    }
  }
}

// Export singleton instance
export const templateService = TemplateService.getInstance();
