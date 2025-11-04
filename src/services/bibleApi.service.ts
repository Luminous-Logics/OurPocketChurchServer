/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';

/**
 * Bible API Service
 * Integrates with API.Bible for 1600+ languages including Malayalam
 *
 * Setup Instructions:
 * 1. Sign up at https://scripture.api.bible/signup
 * 2. Get your API key
 * 3. Add to .env file: API_BIBLE_KEY=your_key_here
 * 4. Find Bible IDs from https://api.scripture.api.bible/v1/bibles
 */
export class BibleAPIService {
  private static readonly API_BIBLE_URL = 'https://api.scripture.api.bible/v1';
  private static readonly API_BIBLE_KEY = process.env.API_BIBLE_KEY || '';

  // Malayalam Bible IDs from API.Bible
  // See: https://scripture.api.bible/livedocs
  private static readonly MALAYALAM_VERSIONS: Record<string, string> = {
    'mal-irv': '3ea0147e32eebe47-01', // Indian Revised Version (IRV) Malayalam - 2025
    'mal-ocv': 'de295e9ba65f6d0f-01', // Biblica® Open Malayalam Contemporary Version 2020
    'mal-1910': '805e795e07fb9422-01', // Malayalam Sathyavedapusthakam 1910 Edition
  };

  // Other Indian language Bible IDs
  private static readonly INDIAN_BIBLE_IDS: Record<string, string> = {
    // Hindi
    'hin-irv': '4bf8f4e26f3d6111-01',
    // Tamil
    'tam-irv': '75cde9b67c793c01-01',
    // Telugu
    'tel-irv': 'aa146959e1d39b78-01',
    // Kannada
    'kan-irv': 'a33a100f04f2752e-01',
    'kan-ocv': '08389f036844c2de-01',
    // Urdu
    'urd-irv': 'de0270810140edf9-01',
  };

  // =====================================================
  // API.BIBLE METHODS (Malayalam and 1600+ languages)
  // =====================================================

  /**
   * Helper method: Get specific verses from a chapter
   * This method helps with compatibility for existing code that needs to fetch verses by book name
   * @param bookName - Book name (e.g., "John", "Genesis")
   * @param chapter - Chapter number
   * @param verseStart - Starting verse (optional, defaults to 1)
   * @param verseEnd - Ending verse (optional)
   * @param bibleIdOrVersion - Bible ID or version code (e.g., 'mal-irv', '3ea0147e32eebe47-01')
   */
  public static async getVerses(
    bookName: string,
    chapter: number,
    verseStart?: number,
    verseEnd?: number,
    bibleIdOrVersion: string = 'de4e12af7f28f599-02' // KJV as default
  ): Promise<any> {
    // Map version codes to Bible IDs
    const bibleId = this.MALAYALAM_VERSIONS[bibleIdOrVersion] ||
                    this.INDIAN_BIBLE_IDS[bibleIdOrVersion] ||
                    bibleIdOrVersion;

    // Convert book name to API.Bible book code
    const bookCode = this.convertBookNameToCode(bookName);

    // Build passage ID
    let passageId: string;
    if (verseStart && verseEnd) {
      passageId = `${bookCode}.${chapter}.${verseStart}-${bookCode}.${chapter}.${verseEnd}`;
    } else if (verseStart) {
      passageId = `${bookCode}.${chapter}.${verseStart}`;
    } else {
      passageId = `${bookCode}.${chapter}`;
    }

    return this.getPassage(bibleId, passageId);
  }

  /**
   * Convert book name to API.Bible book code
   * @param bookName - Book name (e.g., "John", "Genesis")
   */
  private static convertBookNameToCode(bookName: string): string {
    const bookMap: Record<string, string> = {
      'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM', 'deuteronomy': 'DEU',
      'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT', '1 samuel': '1SA', '2 samuel': '2SA',
      '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
      'ezra': 'EZR', 'nehemiah': 'NEH', 'esther': 'EST', 'job': 'JOB', 'psalms': 'PSA',
      'proverbs': 'PRO', 'ecclesiastes': 'ECC', 'song of solomon': 'SNG', 'isaiah': 'ISA',
      'jeremiah': 'JER', 'lamentations': 'LAM', 'ezekiel': 'EZK', 'daniel': 'DAN', 'hosea': 'HOS',
      'joel': 'JOL', 'amos': 'AMO', 'obadiah': 'OBA', 'jonah': 'JON', 'micah': 'MIC',
      'nahum': 'NAM', 'habakkuk': 'HAB', 'zephaniah': 'ZEP', 'haggai': 'HAG', 'zechariah': 'ZEC',
      'malachi': 'MAL',
      'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN', 'acts': 'ACT',
      'romans': 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO', 'galatians': 'GAL',
      'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL', '1 thessalonians': '1TH',
      '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI', 'titus': 'TIT',
      'philemon': 'PHM', 'hebrews': 'HEB', 'james': 'JAS', '1 peter': '1PE', '2 peter': '2PE',
      '1 john': '1JN', '2 john': '2JN', '3 john': '3JN', 'jude': 'JUD', 'revelation': 'REV',
    };

    const lowerBookName = bookName.toLowerCase().trim();
    const bookCode = bookMap[lowerBookName];

    if (!bookCode) {
      throw new Error(`Unknown book name: ${bookName}`);
    }

    return bookCode;
  }

  /**
   * Check if translation is Malayalam
   * @internal - Helper method for future auto-detection features
   */
  // @ts-expect-error - Reserved for future use
  private static isMalayalam(translation: string): boolean {
    return translation.startsWith('mal-') || Object.keys(this.MALAYALAM_VERSIONS).includes(translation);
  }


  /**
   * Get list of available Malayalam Bible versions
   */
  public static getMalayalamVersions(): Record<string, string> {
    return {
      'mal-irv': 'Indian Revised Version (IRV) Malayalam - 2025',
      'mal-ocv': 'Open Malayalam Contemporary Version 2020',
      'mal-1910': 'Malayalam Sathyavedapusthakam 1910 Edition',
    };
  }

  /**
   * Get list of all supported Indian language Bibles
   */
  public static getIndianLanguageVersions(): Record<string, string> {
    return {
      ...this.getMalayalamVersions(),
      'hin-irv': 'Indian Revised Version (IRV) Hindi',
      'tam-irv': 'Indian Revised Version (IRV) Tamil',
      'tel-irv': 'Indian Revised Version (IRV) Telugu',
      'kan-irv': 'Indian Revised Version (IRV) Kannada',
      'kan-ocv': 'Open Kannada Contemporary Version',
      'urd-irv': 'Indian Revised Version (IRV) Urdu',
    };
  }

  /**
   * Check if API.Bible is configured
   */
  public static isAPIBibleConfigured(): boolean {
    return !!this.API_BIBLE_KEY;
  }

  // =====================================================
  // API.BIBLE COMPLETE ENDPOINTS
  // =====================================================

  /**
   * Get list of all available Bibles from API.Bible
   * @param language - Filter by language code (e.g., 'mal', 'eng', 'hin')
   * @param abbreviation - Filter by abbreviation
   */
  public static async getBibles(language?: string, abbreviation?: string): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      let url = `${this.API_BIBLE_URL}/bibles`;
      const params: string[] = [];

      if (language) {
        params.push(`language=${language}`);
      }
      if (abbreviation) {
        params.push(`abbreviation=${abbreviation}`);
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch Bibles from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get a specific Bible by ID
   * @param bibleId - Bible version ID
   */
  public static async getBible(bibleId: string): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch Bible from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get list of books for a specific Bible
   * @param bibleId - Bible version ID
   * @param includeChapters - Include chapter information
   */
  public static async getBooks(bibleId: string, includeChapters: boolean = false): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      let url = `${this.API_BIBLE_URL}/bibles/${bibleId}/books`;
      if (includeChapters) {
        url += '?include-chapters=true';
      }

      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch books from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get a specific book
   * @param bibleId - Bible version ID
   * @param bookId - Book ID (e.g., 'GEN', 'JHN')
   */
  public static async getBook(bibleId: string, bookId: string): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/books/${bookId}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch book from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get chapters for a specific book
   * @param bibleId - Bible version ID
   * @param bookId - Book ID
   */
  public static async getChapters(bibleId: string, bookId: string): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/books/${bookId}/chapters`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch chapters from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get a specific chapter
   * @param bibleId - Bible version ID
   * @param chapterId - Chapter ID (e.g., 'GEN.1', 'JHN.3')
   * @param contentType - Content type ('html', 'json', 'text')
   * @param includeNotes - Include footnotes and cross-references
   * @param includeTitles - Include section titles
   * @param includeVerseNumbers - Include verse numbers
   */
  public static async getChapter(
    bibleId: string,
    chapterId: string,
    contentType: 'html' | 'json' | 'text' = 'text',
    includeNotes: boolean = false,
    includeTitles: boolean = true,
    includeVerseNumbers: boolean = true
  ): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const params = [
        `content-type=${contentType}`,
        `include-notes=${includeNotes}`,
        `include-titles=${includeTitles}`,
        `include-chapter-numbers=false`,
        `include-verse-numbers=${includeVerseNumbers}`,
      ];

      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/chapters/${chapterId}?${params.join('&')}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch chapter from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get verses for a specific chapter
   * @param bibleId - Bible version ID
   * @param chapterId - Chapter ID
   */
  public static async getVersesForChapter(bibleId: string, chapterId: string): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/chapters/${chapterId}/verses`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch verses from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get a specific verse
   * @param bibleId - Bible version ID
   * @param verseId - Verse ID (e.g., 'JHN.3.16')
   * @param contentType - Content type ('html', 'json', 'text')
   * @param includeNotes - Include footnotes and cross-references
   */
  public static async getVerseById(
    bibleId: string,
    verseId: string,
    contentType: 'html' | 'json' | 'text' = 'text',
    includeNotes: boolean = false
  ): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const params = [
        `content-type=${contentType}`,
        `include-notes=${includeNotes}`,
        `use-org-id=false`,
      ];

      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/verses/${verseId}?${params.join('&')}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch verse from API.Bible: ${error.message}`);
    }
  }

  /**
   * Get a passage (multiple verses)
   * @param bibleId - Bible version ID
   * @param passageId - Passage ID (e.g., 'JHN.3.16-JHN.3.17' or 'GEN.1')
   * @param contentType - Content type ('html', 'json', 'text')
   * @param includeNotes - Include footnotes and cross-references
   * @param includeTitles - Include section titles
   * @param includeVerseNumbers - Include verse numbers
   */
  public static async getPassage(
    bibleId: string,
    passageId: string,
    contentType: 'html' | 'json' | 'text' = 'text',
    includeNotes: boolean = false,
    includeTitles: boolean = true,
    includeVerseNumbers: boolean = true
  ): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const params = [
        `content-type=${contentType}`,
        `include-notes=${includeNotes}`,
        `include-titles=${includeTitles}`,
        `include-chapter-numbers=false`,
        `include-verse-numbers=${includeVerseNumbers}`,
        `use-org-id=false`,
      ];

      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/passages/${passageId}?${params.join('&')}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch passage from API.Bible: ${error.message}`);
    }
  }

  /**
   * Search Bible text
   * @param bibleId - Bible version ID
   * @param query - Search query (supports wildcards * and ?)
   * @param limit - Number of results (default: 10, max: 1000)
   * @param offset - Offset for pagination
   * @param sort - Sort order ('relevance' or 'canonical')
   */
  public static async searchBible(
    bibleId: string,
    query: string,
    limit: number = 10,
    offset: number = 0,
    sort: 'relevance' | 'canonical' = 'relevance'
  ): Promise<any> {
    if (!this.API_BIBLE_KEY) {
      throw new Error('API.Bible key not configured. Please add API_BIBLE_KEY to your .env file');
    }

    try {
      const params = [
        `query=${encodeURIComponent(query)}`,
        `limit=${Math.min(limit, 1000)}`,
        `offset=${offset}`,
        `sort=${sort}`,
      ];

      const url = `${this.API_BIBLE_URL}/bibles/${bibleId}/search?${params.join('&')}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.API_BIBLE_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to search Bible: ${error.message}`);
    }
  }
}

export default BibleAPIService;
