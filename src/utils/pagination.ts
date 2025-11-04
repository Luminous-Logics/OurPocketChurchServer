import { IPaginationParams, IPaginatedResponse } from '../types';
import config from '../config';

export class PaginationUtil {
  /**
   * Validate and sanitize pagination parameters
   */
  public static validateParams(
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: string
  ): IPaginationParams {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(
      Math.max(1, limit || config.pagination.defaultPageSize),
      config.pagination.maxPageSize
    );

    return {
      page: validatedPage,
      limit: validatedLimit,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
    };
  }

  /**
   * Calculate offset for SQL query
   */
  public static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Create paginated response
   */
  public static createResponse<T>(
    data: T[],
    totalRecords: number,
    page: number,
    limit: number
  ): IPaginatedResponse<T> {
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      success: true,
      data,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalRecords,
        totalPages,
      },
    };
  }

  /**
   * Generate SQL OFFSET and FETCH clause
   */
  public static generateSqlOffsetFetch(page: number, limit: number): string {
    const offset = this.calculateOffset(page, limit);
    return `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
  }

  /**
   * Generate ORDER BY clause
   */
  public static generateOrderBy(
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    defaultSort = 'created_at'
  ): string {
    const column = sortBy || defaultSort;
    // Sanitize column name to prevent SQL injection
    const sanitizedColumn = column.replace(/[^a-zA-Z0-9_]/g, '');
    return `ORDER BY ${sanitizedColumn} ${sortOrder}`;
  }
}

export default PaginationUtil;
