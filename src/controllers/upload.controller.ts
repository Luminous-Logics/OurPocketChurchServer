import { Request, Response, NextFunction } from 'express';
import cloudflareService from '../services/cloudflare.service';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class UploadController {
  /**
   * Upload a single file (auto-detect type: audio, photo, or PDF)
   */
  public static async uploadSingleFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        throw ApiError.badRequest('No file uploaded');
      }

      // Detect file category
      const category = cloudflareService.getFileCategory(file.mimetype);
      if (!category) {
        throw ApiError.badRequest('Unsupported file type');
      }

      // Upload to Cloudflare R2
      const result = await cloudflareService.uploadFile(file, category);

      logger.info(`File uploaded successfully: ${result.key}`);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple files
   */
  public static async uploadMultipleFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw ApiError.badRequest('No files uploaded');
      }

      // Group files by category
      const filesByCategory: { [key: string]: Express.Multer.File[] } = {
        audio: [],
        photos: [],
        pdfs: [],
      };

      for (const file of files) {
        const category = cloudflareService.getFileCategory(file.mimetype);
        if (!category) {
          throw ApiError.badRequest(`Unsupported file type: ${file.mimetype}`);
        }
        filesByCategory[category].push(file);
      }

      // Upload all files
      const uploadResults = [];

      for (const [category, categoryFiles] of Object.entries(filesByCategory)) {
        if (categoryFiles.length > 0) {
          const results = await cloudflareService.uploadMultipleFiles(
            categoryFiles,
            category as 'audio' | 'photos' | 'pdfs'
          );
          uploadResults.push(...results);
        }
      }

      logger.info(`${uploadResults.length} files uploaded successfully`);

      res.status(201).json({
        success: true,
        message: `${uploadResults.length} files uploaded successfully`,
        data: uploadResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload audio file
   */
  public static async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        throw ApiError.badRequest('No audio file uploaded');
      }

      const result = await cloudflareService.uploadFile(file, 'audio');

      logger.info(`Audio file uploaded successfully: ${result.key}`);

      res.status(201).json({
        success: true,
        message: 'Audio file uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload photo
   */
  public static async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        throw ApiError.badRequest('No photo uploaded');
      }

      const result = await cloudflareService.uploadFile(file, 'photos');

      logger.info(`Photo uploaded successfully: ${result.key}`);

      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload PDF
   */
  public static async uploadPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        throw ApiError.badRequest('No PDF file uploaded');
      }

      const result = await cloudflareService.uploadFile(file, 'pdfs');

      logger.info(`PDF uploaded successfully: ${result.key}`);

      res.status(201).json({
        success: true,
        message: 'PDF uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple photos
   */
  public static async uploadMultiplePhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw ApiError.badRequest('No photos uploaded');
      }

      const results = await cloudflareService.uploadMultipleFiles(files, 'photos');

      logger.info(`${results.length} photos uploaded successfully`);

      res.status(201).json({
        success: true,
        message: `${results.length} photos uploaded successfully`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple audio files
   */
  public static async uploadMultipleAudios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw ApiError.badRequest('No audio files uploaded');
      }

      const results = await cloudflareService.uploadMultipleFiles(files, 'audio');

      logger.info(`${results.length} audio files uploaded successfully`);

      res.status(201).json({
        success: true,
        message: `${results.length} audio files uploaded successfully`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple PDFs
   */
  public static async uploadMultiplePDFs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw ApiError.badRequest('No PDF files uploaded');
      }

      const results = await cloudflareService.uploadMultipleFiles(files, 'pdfs');

      logger.info(`${results.length} PDFs uploaded successfully`);

      res.status(201).json({
        success: true,
        message: `${results.length} PDFs uploaded successfully`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a file
   */
  public static async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.body;

      await cloudflareService.deleteFile(key);

      logger.info(`File deleted successfully: ${key}`);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete multiple files
   */
  public static async deleteMultipleFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { keys } = req.body;

      await cloudflareService.deleteMultipleFiles(keys);

      logger.info(`${keys.length} files deleted successfully`);

      res.json({
        success: true,
        message: `${keys.length} files deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned URL for temporary access (for private files)
   */
  public static async getPresignedUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, expiresIn } = req.body;

      const signedUrl = await cloudflareService.getPresignedUrl(key, expiresIn || 3600);

      res.json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: {
          url: signedUrl,
          expiresIn: expiresIn || 3600,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
