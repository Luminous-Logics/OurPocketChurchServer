import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  deleteFileSchema,
  deleteMultipleFilesSchema,
  getPresignedUrlSchema,
} from '../validators/upload.validator';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadSingleAudio,
  uploadSinglePhoto,
  uploadSinglePDF,
  uploadMultipleAudios,
  uploadMultiplePhotos,
  uploadMultiplePDFs,
} from '../middleware/upload';

const router = Router();

// =====================================================
// SINGLE FILE UPLOAD ROUTES
// =====================================================

/**
 * @swagger
 * /upload/file:
 *   post:
 *     summary: Upload a single file (auto-detect type)
 *     tags: [Upload]
 *     description: Upload a single audio, photo, or PDF file. File type is automatically detected.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (audio/photo/PDF)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://your-domain.com/photos/uuid-filename.jpg
 *                     key:
 *                       type: string
 *                       example: photos/uuid-filename.jpg
 *                     fileName:
 *                       type: string
 *                       example: original-filename.jpg
 *                     fileSize:
 *                       type: integer
 *                       example: 1024000
 *                     mimeType:
 *                       type: string
 *                       example: image/jpeg
 *       400:
 *         description: Bad request - No file uploaded or invalid file type
 *       413:
 *         description: File too large
 */
router.post('/file', authenticate, uploadSingleFile, UploadController.uploadSingleFile);

/**
 * @swagger
 * /upload/audio:
 *   post:
 *     summary: Upload an audio file
 *     tags: [Upload]
 *     description: Upload a single audio file (MP3, WAV, OGG, AAC, M4A)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (max 50MB)
 *     responses:
 *       201:
 *         description: Audio file uploaded successfully
 */
router.post('/audio', authenticate, uploadSingleAudio, UploadController.uploadAudio);

/**
 * @swagger
 * /upload/photo:
 *   post:
 *     summary: Upload a photo
 *     tags: [Upload]
 *     description: Upload a single photo (JPEG, PNG, GIF, WebP, SVG)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Photo file (max 10MB)
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 */
router.post('/photo', authenticate, uploadSinglePhoto, UploadController.uploadPhoto);

/**
 * @swagger
 * /upload/pdf:
 *   post:
 *     summary: Upload a PDF file
 *     tags: [Upload]
 *     description: Upload a single PDF document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: PDF file (max 20MB)
 *     responses:
 *       201:
 *         description: PDF uploaded successfully
 */
router.post('/pdf', authenticate, uploadSinglePDF, UploadController.uploadPDF);

// =====================================================
// MULTIPLE FILES UPLOAD ROUTES
// =====================================================

/**
 * @swagger
 * /upload/files:
 *   post:
 *     summary: Upload multiple files (mixed types)
 *     tags: [Upload]
 *     description: Upload multiple files of any supported type (audio, photos, PDFs). Max 10 files.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple files (max 10)
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 */
router.post('/files', authenticate, uploadMultipleFiles, UploadController.uploadMultipleFiles);

/**
 * @swagger
 * /upload/audios:
 *   post:
 *     summary: Upload multiple audio files
 *     tags: [Upload]
 *     description: Upload multiple audio files. Max 10 files.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audios
 *             properties:
 *               audios:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple audio files (max 10, 50MB each)
 *     responses:
 *       201:
 *         description: Audio files uploaded successfully
 */
router.post('/audios', authenticate, uploadMultipleAudios, UploadController.uploadMultipleAudios);

/**
 * @swagger
 * /upload/photos:
 *   post:
 *     summary: Upload multiple photos
 *     tags: [Upload]
 *     description: Upload multiple photos. Max 10 files.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple photos (max 10, 10MB each)
 *     responses:
 *       201:
 *         description: Photos uploaded successfully
 */
router.post('/photos', authenticate, uploadMultiplePhotos, UploadController.uploadMultiplePhotos);

/**
 * @swagger
 * /upload/pdfs:
 *   post:
 *     summary: Upload multiple PDF files
 *     tags: [Upload]
 *     description: Upload multiple PDF documents. Max 10 files.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdfs
 *             properties:
 *               pdfs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple PDF files (max 10, 20MB each)
 *     responses:
 *       201:
 *         description: PDFs uploaded successfully
 */
router.post('/pdfs', authenticate, uploadMultiplePDFs, UploadController.uploadMultiplePDFs);

// =====================================================
// FILE MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /upload/delete:
 *   delete:
 *     summary: Delete a file from storage
 *     tags: [Upload]
 *     description: Delete a single file using its key
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 example: photos/uuid-filename.jpg
 *                 description: File key returned from upload
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/delete', authenticate, validate(deleteFileSchema), UploadController.deleteFile);

/**
 * @swagger
 * /upload/delete-multiple:
 *   delete:
 *     summary: Delete multiple files from storage
 *     tags: [Upload]
 *     description: Delete multiple files using their keys
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keys
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["photos/uuid-1.jpg", "audio/uuid-2.mp3"]
 *                 description: Array of file keys
 *     responses:
 *       200:
 *         description: Files deleted successfully
 */
router.delete('/delete-multiple', authenticate, validate(deleteMultipleFilesSchema), UploadController.deleteMultipleFiles);

/**
 * @swagger
 * /upload/presigned-url:
 *   post:
 *     summary: Get presigned URL for temporary file access
 *     tags: [Upload]
 *     description: Generate a presigned URL for temporary access to a private file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 example: photos/uuid-filename.jpg
 *               expiresIn:
 *                 type: integer
 *                 example: 3600
 *                 description: URL expiration time in seconds (60-86400)
 *                 default: 3600
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 */
router.post('/presigned-url', authenticate, validate(getPresignedUrlSchema), UploadController.getPresignedUrl);

export default router;
