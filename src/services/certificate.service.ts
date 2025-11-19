import logger from '../utils/logger';
import { PdfGeneratorService } from './pdf-generator.service';
import { TemplateRenderer } from '../utils/template-renderer';
import database from '../config/database';

export class CertificateService {

  /**
   * Generate certificate number using database function
   */
  public async generateCertificateNumber(certificateTypeId: number): Promise<string> {
    try {
      const result = await database.executeQuery<{ generate_certificate_number: string }>(
        'SELECT generate_certificate_number(@certificateTypeId) as generate_certificate_number',
        { certificateTypeId }
      );

      if (!result.rows[0]) {
        throw new Error('Failed to generate certificate number');
      }

      return result.rows[0].generate_certificate_number;
    } catch (error) {
      logger.error('Error generating certificate number:', error);
      throw new Error('Failed to generate certificate number');
    }
  }

  /**
   * Generate certificate PDF (on-demand, no upload)
   */
  public async generateCertificatePdf(
    htmlTemplate: string,
    placeholderValues: Record<string, unknown>,
    certificateNumber: string
  ): Promise<Buffer> {
    try {
      // Step 1: Render HTML with placeholder values
      const renderedHtml = TemplateRenderer.render(htmlTemplate, placeholderValues);

      // Step 2: Generate PDF from rendered HTML
      const pdfBuffer = await PdfGeneratorService.generatePdfFromHtml(renderedHtml, {
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      logger.info('Certificate PDF generated successfully', {
        certificateNumber,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('Error generating certificate PDF:', error);
      throw new Error(`Failed to generate certificate PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate placeholder values against required placeholders
   */
  public validatePlaceholders(
    requiredPlaceholders: string[],
    providedValues: Record<string, unknown>
  ): { valid: boolean; missing: string[] } {
    return TemplateRenderer.validateVariables(requiredPlaceholders, providedValues);
  }
}

// Export singleton instance
export const certificateService = new CertificateService();
