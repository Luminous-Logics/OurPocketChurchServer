import Handlebars from 'handlebars';

/**
 * Template Renderer Utility
 * Uses Handlebars for rendering email templates with variables
 */
export class TemplateRenderer {
  /**
   * Render template with variables
   */
  public static render(template: string, variables: Record<string, any>): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate that all required variables are provided
   */
  public static validateVariables(
    requiredVariables: string[],
    providedVariables: Record<string, any>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const varName of requiredVariables) {
      if (!(varName in providedVariables) || providedVariables[varName] === undefined || providedVariables[varName] === null) {
        missing.push(varName);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Extract variable names from template
   * Finds all {{variableName}} placeholders
   */
  public static extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: Set<string> = new Set();
    let match;

    while ((match = regex.exec(template)) !== null) {
      // Remove any Handlebars helpers or modifiers
      const varName = match[1].trim().split(' ')[0].replace('#', '').replace('/', '');
      if (varName && !varName.startsWith('if') && !varName.startsWith('else')) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  /**
   * Register custom helpers
   */
  public static registerHelpers(): void {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;

      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (format === 'time') {
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      return d.toLocaleDateString();
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Capitalize first letter
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Default value helper
    Handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    // Conditional helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
  }
}

// Register helpers on module load
TemplateRenderer.registerHelpers();
