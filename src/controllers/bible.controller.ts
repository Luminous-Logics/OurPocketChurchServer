import { Request, Response, NextFunction } from 'express';
import { BibleModel } from '../models/Bible';
import { BibleAPIService } from '../services/bibleApi.service';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class BibleController {
  // =====================================================
  // API.BIBLE ENDPOINTS (1600+ languages including Malayalam)
  // =====================================================

  /**
   * Get list of available Bibles
   */
  public static async getBibles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const language = req.query.language as string;
      const abbreviation = req.query.abbreviation as string;

      const bibles = await BibleAPIService.getBibles(language, abbreviation);

      res.json({
        success: true,
        data: bibles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific Bible by ID
   */
  public static async getBibleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId } = req.params;

      const bible = await BibleAPIService.getBible(bibleId);

      res.json({
        success: true,
        data: bible,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get books for a specific Bible
   */
  public static async getBooksForBible(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId } = req.params;
      const includeChapters = req.query.includeChapters === 'true';

      const books = await BibleAPIService.getBooks(bibleId, includeChapters);

      res.json({
        success: true,
        data: books,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific book
   */
  public static async getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId, bookId } = req.params;

      const book = await BibleAPIService.getBook(bibleId, bookId);

      res.json({
        success: true,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get chapters for a specific book
   */
  public static async getChaptersForBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId, bookId } = req.params;

      const chapters = await BibleAPIService.getChapters(bibleId, bookId);

      res.json({
        success: true,
        data: chapters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific chapter by ID
   */
  public static async getChapterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId, chapterId } = req.params;
      const contentType = (req.query.contentType as 'html' | 'json' | 'text') || 'text';
      const includeNotes = req.query.includeNotes === 'true';
      const includeTitles = req.query.includeTitles !== 'false'; // Default true
      const includeVerseNumbers = req.query.includeVerseNumbers !== 'false'; // Default true

      const chapter = await BibleAPIService.getChapter(
        bibleId,
        chapterId,
        contentType,
        includeNotes,
        includeTitles,
        includeVerseNumbers
      );

      res.json({
        success: true,
        data: chapter,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get verses for a specific chapter
   */
  public static async getVersesForChapter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId, chapterId } = req.params;

      const verses = await BibleAPIService.getVersesForChapter(bibleId, chapterId);

      res.json({
        success: true,
        data: verses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific verse by ID
   */
  public static async getVerseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId, verseId } = req.params;
      const contentType = (req.query.contentType as 'html' | 'json' | 'text') || 'text';
      const includeNotes = req.query.includeNotes === 'true';

      const verse = await BibleAPIService.getVerseById(bibleId, verseId, contentType, includeNotes);

      res.json({
        success: true,
        data: verse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a passage (multiple verses)
   */
  public static async getPassage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId, passageId } = req.params;
      const contentType = (req.query.contentType as 'html' | 'json' | 'text') || 'text';
      const includeNotes = req.query.includeNotes === 'true';
      const includeTitles = req.query.includeTitles !== 'false'; // Default true
      const includeVerseNumbers = req.query.includeVerseNumbers !== 'false'; // Default true

      const passage = await BibleAPIService.getPassage(
        bibleId,
        passageId,
        contentType,
        includeNotes,
        includeTitles,
        includeVerseNumbers
      );

      res.json({
        success: true,
        data: passage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search Bible text
   */
  public static async searchBible(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bibleId } = req.params;
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const sort = (req.query.sort as 'relevance' | 'canonical') || 'relevance';

      if (!query) {
        throw ApiError.badRequest('Search query is required');
      }

      const results = await BibleAPIService.searchBible(bibleId, query, limit, offset, sort);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of supported Malayalam Bible versions
   */
  public static async getMalayalamVersions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = BibleAPIService.getMalayalamVersions();

      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of supported Indian language Bibles
   */
  public static async getIndianLanguageVersions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = BibleAPIService.getIndianLanguageVersions();

      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // DAILY BIBLE READINGS
  // =====================================================

  /**
   * Get today's reading for a parish
   */
  public static async getTodaysReading(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const reading = await BibleModel.getTodaysReading(parishId);

      if (!reading) {
        res.json({
          success: true,
          message: 'No reading scheduled for today',
          data: null,
        });
        return;
      }

      // Fetch actual Bible content from API if not cached
      if (!reading.content) {
        const bibleContent = await BibleAPIService.getVerses(
          reading.book_name,
          reading.chapter,
          reading.verse_start || 1,
          reading.verse_end,
          reading.translation
        );

        // API.Bible returns data.content or data.data.content
        reading.content = bibleContent?.data?.content || bibleContent?.content || '';
      }

      res.json({
        success: true,
        data: reading,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a daily reading (Church Admin only)
   */
  public static async createDailyReading(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const readingData = req.body;

      // Fetch Bible content from API
      const bibleContent = await BibleAPIService.getVerses(
        readingData.book_name,
        readingData.chapter,
        readingData.verse_start,
        readingData.verse_end,
        readingData.translation || 'kjv'
      );

      // Cache the content - API.Bible returns different format
      readingData.content = bibleContent?.data?.content || bibleContent?.content || '';
      readingData.title = bibleContent?.data?.reference || `${readingData.book_name} ${readingData.chapter}`;

      if (req.user) {
        readingData.created_by = req.user.user_id;
      }

      const reading = await BibleModel.createDailyReading(readingData);

      res.status(201).json({
        success: true,
        message: 'Daily reading created successfully',
        data: reading,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // BIBLE BOOKMARKS
  // =====================================================

  /**
   * Get user's bookmarks
   */
  public static async getMyBookmarks(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const bookmarks = await BibleModel.getUserBookmarks(req.user.user_id);

      res.json({
        success: true,
        data: bookmarks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a bookmark
   */
  public static async createBookmark(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const bookmarkData = {
        ...req.body,
        user_id: req.user.user_id,
      };

      const bookmark = await BibleModel.createBookmark(bookmarkData);

      res.status(201).json({
        success: true,
        message: 'Bookmark created successfully',
        data: bookmark,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a bookmark
   */
  public static async deleteBookmark(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const bookmarkId = parseInt(req.params.id);

      if (isNaN(bookmarkId)) {
        throw ApiError.badRequest('Invalid bookmark ID');
      }

      await BibleModel.deleteBookmark(bookmarkId, req.user.user_id);

      res.json({
        success: true,
        message: 'Bookmark deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // READING HISTORY
  // =====================================================

  /**
   * Record a reading
   */
  public static async recordReading(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const historyData = {
        ...req.body,
        user_id: req.user.user_id,
      };

      const history = await BibleModel.recordReading(historyData);

      res.status(201).json({
        success: true,
        message: 'Reading recorded successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's reading history
   */
  public static async getMyHistory(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const limit = parseInt(req.query.limit as string) || 20;

      const history = await BibleModel.getUserHistory(req.user.user_id, limit);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default BibleController;
