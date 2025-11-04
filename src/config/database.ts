/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import config from './index';
import logger from '../utils/logger';

class Database {
  private pool: Pool | null = null;
  private readonly config: typeof config.database;

  constructor() {
    this.config = config.database;
  }

  public async connect(): Promise<Pool> {
    try {
      if (this.pool) {
        return this.pool;
      }

      logger.info('Connecting to PostgreSQL database...');
      this.pool = new Pool(this.config);

      // Test the connection
      const client = await this.pool.connect();
      client.release();

      logger.info('Successfully connected to PostgreSQL database');

      // Handle connection errors
      this.pool.on('error', (err: Error) => {
        logger.error('Database connection error:', err);
      });

      return this.pool;
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  public async executeQuery<T extends QueryResultRow = any>(
    query: string,
    params: Record<string, any> | any[] = []
  ): Promise<QueryResult<T>> {
    try {
      const pool = await this.connect();

      // Convert named parameters (@param) to positional parameters ($1, $2, etc.)
      const { text, values } = this.convertNamedParams(query, params);

      const result = await pool.query<T>(text, values);
      return result;
    } catch (error) {
      logger.error('Query execution error:', error);
      logger.error('Query:', query);
      logger.error('Params:', params);
      throw error;
    }
  }

  // Helper method to convert named parameters to positional
  private convertNamedParams(query: string, params: Record<string, any> | any[]): { text: string; values: any[] } {
    // If params is already an array, return as-is
    if (Array.isArray(params)) {
      return { text: query, values: params };
    }

    const values: any[] = [];
    let index = 1;
    const paramMap = new Map<string, number>();

    // Replace @paramName with $1, $2, etc.
    const text = query.replace(/@(\w+)/g, (_match, paramName) => {
      if (!paramMap.has(paramName)) {
        paramMap.set(paramName, index);
        values.push(params[paramName]);
        index++;
      }
      return `$${paramMap.get(paramName)}`;
    });

    return { text, values };
  }

  // Helper method to begin a transaction
  public async beginTransaction(): Promise<PoolClient> {
    const pool = await this.connect();
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
  }

  // Helper method to commit a transaction
  public async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  // Helper method to rollback a transaction
  public async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  // Helper method to create a parameterized query
  public async createRequest(params: Record<string, any> = {}): Promise<{ query: (sql: string) => Promise<QueryResult> }> {
    const pool = await this.connect();

    return {
      query: async (sql: string) => {
        const { text, values } = this.convertNamedParams(sql, params);
        return pool.query(text, values);
      },
    };
  }

  // Check if database is connected
  public isConnected(): boolean {
    return this.pool !== null;
  }

  // Execute a query within a transaction
  public async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.beginTransaction();
    try {
      const result = await callback(client);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

// Export singleton instance
const database = new Database();
export default database;
