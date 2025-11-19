import puppeteer from 'puppeteer';
import logger from '../utils/logger';

export interface IPdfOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
}

export class PdfGeneratorService {
  /**
   * Generate PDF from HTML content
   */
  public static async generatePdfFromHtml(
    htmlContent: string,
    options: IPdfOptions = {}
  ): Promise<Buffer> {
    let browser;

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      // Create a new page
      const page = await browser.newPage();

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      // Default options
      const pdfOptions = {
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: options.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: options.printBackground !== undefined ? options.printBackground : true,
        preferCSSPageSize: options.preferCSSPageSize || false,
      };

      // Generate PDF
      const pdfData = await page.pdf(pdfOptions);
      const pdfBuffer = Buffer.from(pdfData);

      logger.info('PDF generated successfully', {
        size: pdfBuffer.length,
        format: pdfOptions.format,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation failed', { error });
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Close browser
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF with custom CSS styling
   */
  public static async generateStyledPdf(
    htmlContent: string,
    cssStyles?: string,
    options: IPdfOptions = {}
  ): Promise<Buffer> {
    let fullHtml = htmlContent;

    // If custom CSS is provided, wrap HTML with style tag
    if (cssStyles) {
      fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${cssStyles}
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;
    }

    return this.generatePdfFromHtml(fullHtml, options);
  }

  /**
   * Generate PDF with header and footer
   */
  public static async generatePdfWithHeaderFooter(
    htmlContent: string,
    headerTemplate?: string,
    footerTemplate?: string,
    options: IPdfOptions = {}
  ): Promise<Buffer> {
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfOptions: any = {
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: options.margin || {
          top: '40mm',
          right: '20mm',
          bottom: '40mm',
          left: '20mm',
        },
        printBackground: options.printBackground !== undefined ? options.printBackground : true,
        displayHeaderFooter: !!(headerTemplate || footerTemplate),
        headerTemplate: headerTemplate || '<div></div>',
        footerTemplate: footerTemplate || '<div></div>',
      };

      const pdfData = await page.pdf(pdfOptions);
      const pdfBuffer = Buffer.from(pdfData);

      logger.info('PDF with header/footer generated successfully', {
        size: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('PDF with header/footer generation failed', { error });
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
