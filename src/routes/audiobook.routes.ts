import { Router } from 'express';
import { AudiobookController } from '../controllers/audiobook.controller';
import { validate } from '../middleware/validate';
import { authenticate, requireChurchAdmin } from '../middleware/auth';
import {
  createAudiobookSchema,
  updateAudiobookSchema,
  audiobookIdSchema,
  audiobooksByParishSchema,
  searchAudiobookSchema,
  audiobooksByCategorySchema,
  audiobooksByAuthorSchema,
  getCategoriesSchema,
} from '../validators/audiobook.validator';

const router = Router();

/**
 * @swagger
 * /audiobooks/parish/{parishId}:
 *   get:
 *     summary: Get all audiobooks for a parish
 *     tags: [Audiobooks]
 *     description: Retrieve a paginated list of all active audiobooks for a specific parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of audiobooks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audiobook'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalRecords:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Bad request - Invalid parish ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId', validate(audiobooksByParishSchema), AudiobookController.getByParish);

/**
 * @swagger
 * /audiobooks/parish/{parishId}/search:
 *   get:
 *     summary: Search audiobooks within a parish
 *     tags: [Audiobooks]
 *     description: Search for audiobooks by title, author, or narrator within a specific parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audiobook'
 *       400:
 *         description: Bad request - Invalid parish ID or search term required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId/search', validate(searchAudiobookSchema), AudiobookController.search);

/**
 * @swagger
 * /audiobooks/parish/{parishId}/category:
 *   get:
 *     summary: Get audiobooks by category
 *     tags: [Audiobooks]
 *     description: Retrieve audiobooks filtered by category within a specific parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Audiobooks by category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audiobook'
 *       400:
 *         description: Bad request - Invalid parish ID or category required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId/category', validate(audiobooksByCategorySchema), AudiobookController.getByCategory);

/**
 * @swagger
 * /audiobooks/parish/{parishId}/author:
 *   get:
 *     summary: Get audiobooks by author
 *     tags: [Audiobooks]
 *     description: Retrieve audiobooks filtered by author within a specific parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         required: true
 *         description: Author name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Audiobooks by author retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audiobook'
 *       400:
 *         description: Bad request - Invalid parish ID or author required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId/author', validate(audiobooksByAuthorSchema), AudiobookController.getByAuthor);

/**
 * @swagger
 * /audiobooks/parish/{parishId}/categories:
 *   get:
 *     summary: Get all audiobook categories for a parish
 *     tags: [Audiobooks]
 *     description: Retrieve all unique audiobook categories within a specific parish
 *     parameters:
 *       - in: path
 *         name: parishId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Parish ID
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request - Invalid parish ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/parish/:parishId/categories', validate(getCategoriesSchema), AudiobookController.getCategories);

/**
 * @swagger
 * /audiobooks/{id}:
 *   get:
 *     summary: Get audiobook by ID
 *     tags: [Audiobooks]
 *     description: Retrieve a specific audiobook by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Audiobook ID
 *     responses:
 *       200:
 *         description: Audiobook retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Audiobook'
 *       404:
 *         description: Audiobook not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validate(audiobookIdSchema), AudiobookController.getById);

/**
 * @swagger
 * /audiobooks:
 *   post:
 *     summary: Create a new audiobook
 *     tags: [Audiobooks]
 *     description: Create a new audiobook entry (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAudiobook'
 *     responses:
 *       201:
 *         description: Audiobook created successfully
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
 *                   example: Audiobook created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Audiobook'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Church Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticate,
  requireChurchAdmin,
  validate(createAudiobookSchema),
  AudiobookController.create
);

/**
 * @swagger
 * /audiobooks/{id}:
 *   put:
 *     summary: Update an audiobook
 *     tags: [Audiobooks]
 *     description: Update audiobook information (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Audiobook ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAudiobook'
 *     responses:
 *       200:
 *         description: Audiobook updated successfully
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
 *                   example: Audiobook updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Audiobook'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Church Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Audiobook not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authenticate,
  requireChurchAdmin,
  validate(audiobookIdSchema),
  validate(updateAudiobookSchema),
  AudiobookController.update
);

/**
 * @swagger
 * /audiobooks/{id}:
 *   delete:
 *     summary: Delete an audiobook
 *     tags: [Audiobooks]
 *     description: Soft delete an audiobook (Church Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Audiobook ID
 *     responses:
 *       200:
 *         description: Audiobook deleted successfully
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
 *                   example: Audiobook deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Church Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Audiobook not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  authenticate,
  requireChurchAdmin,
  validate(audiobookIdSchema),
  AudiobookController.delete
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Audiobook:
 *       type: object
 *       properties:
 *         audiobook_id:
 *           type: integer
 *           description: Unique identifier for the audiobook
 *         parish_id:
 *           type: integer
 *           description: ID of the parish this audiobook belongs to
 *         title:
 *           type: string
 *           description: Title of the audiobook
 *         author:
 *           type: string
 *           description: Author of the book
 *         narrator:
 *           type: string
 *           description: Narrator of the audiobook
 *         description:
 *           type: string
 *           description: Description of the audiobook
 *         thumbnail_url:
 *           type: string
 *           description: URL to the thumbnail image
 *         audio_file_url:
 *           type: string
 *           description: URL to the audio file
 *         duration_minutes:
 *           type: integer
 *           description: Duration in minutes
 *         file_size_mb:
 *           type: number
 *           description: File size in megabytes
 *         category:
 *           type: string
 *           description: Category of the audiobook
 *         language:
 *           type: string
 *           description: Language of the audiobook
 *         publication_year:
 *           type: integer
 *           description: Year of publication
 *         is_active:
 *           type: boolean
 *           description: Whether the audiobook is active
 *         created_by:
 *           type: integer
 *           description: User ID who created the record
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *     CreateAudiobook:
 *       type: object
 *       required:
 *         - parish_id
 *         - title
 *         - author
 *       properties:
 *         parish_id:
 *           type: integer
 *           description: ID of the parish
 *         title:
 *           type: string
 *           description: Title of the audiobook
 *         author:
 *           type: string
 *           description: Author of the book
 *         narrator:
 *           type: string
 *           description: Narrator of the audiobook
 *         description:
 *           type: string
 *           description: Description of the audiobook
 *         thumbnail_url:
 *           type: string
 *           description: URL to the thumbnail image
 *         audio_file_url:
 *           type: string
 *           description: URL to the audio file
 *         duration_minutes:
 *           type: integer
 *           description: Duration in minutes
 *         file_size_mb:
 *           type: number
 *           description: File size in megabytes
 *         category:
 *           type: string
 *           description: Category of the audiobook
 *         language:
 *           type: string
 *           default: English
 *           description: Language of the audiobook
 *         publication_year:
 *           type: integer
 *           description: Year of publication
 *     UpdateAudiobook:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the audiobook
 *         author:
 *           type: string
 *           description: Author of the book
 *         narrator:
 *           type: string
 *           description: Narrator of the audiobook
 *         description:
 *           type: string
 *           description: Description of the audiobook
 *         thumbnail_url:
 *           type: string
 *           description: URL to the thumbnail image
 *         audio_file_url:
 *           type: string
 *           description: URL to the audio file
 *         duration_minutes:
 *           type: integer
 *           description: Duration in minutes
 *         file_size_mb:
 *           type: number
 *           description: File size in megabytes
 *         category:
 *           type: string
 *           description: Category of the audiobook
 *         language:
 *           type: string
 *           description: Language of the audiobook
 *         publication_year:
 *           type: integer
 *           description: Year of publication
 *         is_active:
 *           type: boolean
 *           description: Whether the audiobook is active
 */

export default router;
