import { Router } from 'express';
import { BibleController } from '../controllers/bible.controller';
import { validate } from '../middleware/validate';
import { authenticate, requireChurchAdmin } from '../middleware/auth';
import {
  createDailyReadingSchema,
  parishIdSchema,
  createBookmarkSchema,
  bookmarkIdSchema,
  recordReadingSchema,
} from '../validators/bible.validator';

const router = Router();

// =====================================================
// BIBLE API ROUTES (1600+ languages including Malayalam)
// =====================================================

/**
 * @swagger
 * /bible/api/bibles:
 *   get:
 *     summary: Get list of available Bibles
 *     tags: [Bible]
 *     description: Fetch all available Bible translations from API.Bible
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language code (e.g., 'mal', 'eng', 'hin')
 *       - in: query
 *         name: abbreviation
 *         schema:
 *           type: string
 *         description: Filter by abbreviation
 *     responses:
 *       200:
 *         description: Bibles retrieved successfully
 */
router.get('/api/bibles', BibleController.getBibles);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}:
 *   get:
 *     summary: Get a specific Bible by ID
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bible version ID (e.g., '3ea0147e32eebe47-01' for Malayalam IRV)
 *     responses:
 *       200:
 *         description: Bible retrieved successfully
 */
router.get('/api/bibles/:bibleId', BibleController.getBibleById);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/books:
 *   get:
 *     summary: Get books for a specific Bible
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeChapters
 *         schema:
 *           type: boolean
 *         description: Include chapter information
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 */
router.get('/api/bibles/:bibleId/books', BibleController.getBooksForBible);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/books/{bookId}:
 *   get:
 *     summary: Get a specific book
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID (e.g., 'GEN', 'JHN')
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 */
router.get('/api/bibles/:bibleId/books/:bookId', BibleController.getBookById);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/books/{bookId}/chapters:
 *   get:
 *     summary: Get chapters for a specific book
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapters retrieved successfully
 */
router.get('/api/bibles/:bibleId/books/:bookId/chapters', BibleController.getChaptersForBook);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/chapters/{chapterId}:
 *   get:
 *     summary: Get a specific chapter by ID
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID (e.g., 'GEN.1', 'JHN.3')
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [html, json, text]
 *           default: text
 *       - in: query
 *         name: includeNotes
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeTitles
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeVerseNumbers
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Chapter retrieved successfully
 */
router.get('/api/bibles/:bibleId/chapters/:chapterId', BibleController.getChapterById);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/chapters/{chapterId}/verses:
 *   get:
 *     summary: Get verses for a specific chapter
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verses retrieved successfully
 */
router.get('/api/bibles/:bibleId/chapters/:chapterId/verses', BibleController.getVersesForChapter);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/verses/{verseId}:
 *   get:
 *     summary: Get a specific verse by ID
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: verseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Verse ID (e.g., 'JHN.3.16')
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [html, json, text]
 *           default: text
 *       - in: query
 *         name: includeNotes
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Verse retrieved successfully
 */
router.get('/api/bibles/:bibleId/verses/:verseId', BibleController.getVerseById);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/passages/{passageId}:
 *   get:
 *     summary: Get a passage (multiple verses)
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: passageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Passage ID (e.g., 'JHN.3.16-JHN.3.17' or 'GEN.1')
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [html, json, text]
 *           default: text
 *       - in: query
 *         name: includeNotes
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeTitles
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeVerseNumbers
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Passage retrieved successfully
 */
router.get('/api/bibles/:bibleId/passages/:passageId', BibleController.getPassage);

/**
 * @swagger
 * /bible/api/bibles/{bibleId}/search:
 *   get:
 *     summary: Search Bible text
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (supports wildcards * and ?)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 1000
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, canonical]
 *           default: relevance
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/api/bibles/:bibleId/search', BibleController.searchBible);

/**
 * @swagger
 * /bible/api/versions/malayalam:
 *   get:
 *     summary: Get list of supported Malayalam Bible versions
 *     tags: [Bible]
 *     responses:
 *       200:
 *         description: Malayalam versions retrieved successfully
 */
router.get('/api/versions/malayalam', BibleController.getMalayalamVersions);

/**
 * @swagger
 * /bible/api/versions/indian-languages:
 *   get:
 *     summary: Get list of supported Indian language Bibles
 *     tags: [Bible]
 *     responses:
 *       200:
 *         description: Indian language versions retrieved successfully
 */
router.get('/api/versions/indian-languages', BibleController.getIndianLanguageVersions);

// =====================================================
// DAILY BIBLE READINGS (Today's Word)
// =====================================================

/**
 * @swagger
 * /bible/parish/{parishId}/todays-reading:
 *   get:
 *     summary: Get today's reading for a parish
 *     tags: [Bible]
 *     description: Get the daily Bible reading assigned by church admin ("Today's Word")
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Today's reading retrieved successfully
 */
router.get('/parish/:parishId/todays-reading', validate(parishIdSchema), BibleController.getTodaysReading);

/**
 * @swagger
 * /bible/daily-reading:
 *   post:
 *     summary: Create a daily Bible reading
 *     tags: [Bible]
 *     security:
 *       - bearerAuth: []
 *     description: Church admin sets the daily reading for their parish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parish_id
 *               - reading_date
 *               - book_name
 *               - chapter
 *             properties:
 *               parish_id:
 *                 type: integer
 *               reading_date:
 *                 type: string
 *                 format: date
 *               book_name:
 *                 type: string
 *                 example: John
 *               chapter:
 *                 type: integer
 *                 example: 3
 *               verse_start:
 *                 type: integer
 *                 example: 16
 *               verse_end:
 *                 type: integer
 *                 example: 17
 *               translation:
 *                 type: string
 *                 default: kjv
 *     responses:
 *       201:
 *         description: Daily reading created successfully
 */
router.post('/daily-reading', authenticate, requireChurchAdmin, validate(createDailyReadingSchema), BibleController.createDailyReading);

// =====================================================
// BIBLE BOOKMARKS
// =====================================================

/**
 * @swagger
 * /bible/bookmarks:
 *   get:
 *     summary: Get my Bible bookmarks
 *     tags: [Bible]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmarks retrieved successfully
 */
router.get('/bookmarks', authenticate, BibleController.getMyBookmarks);

/**
 * @swagger
 * /bible/bookmarks:
 *   post:
 *     summary: Create a Bible bookmark
 *     tags: [Bible]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book_name
 *               - chapter
 *             properties:
 *               book_name:
 *                 type: string
 *                 example: Psalms
 *               chapter:
 *                 type: integer
 *                 example: 23
 *               verse_start:
 *                 type: integer
 *               verse_end:
 *                 type: integer
 *               translation:
 *                 type: string
 *                 default: kjv
 *               note:
 *                 type: string
 *               highlight_color:
 *                 type: string
 *                 enum: [yellow, green, blue, red, purple]
 *               is_favorite:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Bookmark created successfully
 */
router.post('/bookmarks', authenticate, validate(createBookmarkSchema), BibleController.createBookmark);

/**
 * @swagger
 * /bible/bookmarks/{id}:
 *   delete:
 *     summary: Delete a bookmark
 *     tags: [Bible]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bookmark deleted successfully
 */
router.delete('/bookmarks/:id', authenticate, validate(bookmarkIdSchema), BibleController.deleteBookmark);

// =====================================================
// READING HISTORY
// =====================================================

/**
 * @swagger
 * /bible/history:
 *   get:
 *     summary: Get my reading history
 *     tags: [Bible]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Reading history retrieved successfully
 */
router.get('/history', authenticate, BibleController.getMyHistory);

/**
 * @swagger
 * /bible/history:
 *   post:
 *     summary: Record a Bible reading
 *     tags: [Bible]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book_name
 *               - chapter
 *             properties:
 *               book_name:
 *                 type: string
 *               chapter:
 *                 type: integer
 *               verse_start:
 *                 type: integer
 *               verse_end:
 *                 type: integer
 *               translation:
 *                 type: string
 *               reading_duration_seconds:
 *                 type: integer
 *               completed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Reading recorded successfully
 */
router.post('/history', authenticate, validate(recordReadingSchema), BibleController.recordReading);

export default router;
