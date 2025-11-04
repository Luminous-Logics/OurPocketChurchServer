import database from '../config/database';
import { IAccount, IAccountSummary } from '../types';
import { ApiError } from '../utils/apiError';

export class AccountModel {
  /**
   * Find account by ID
   */
  public static async findById(accountId: number): Promise<IAccount | null> {
    const result = await database.executeQuery<IAccount>(
      `SELECT * FROM accounts WHERE account_id = @accountId`,
      { accountId }
    );

    return result.rows[0] || null;
  }

  /**
   * Find all accounts by parish ID with pagination
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<IAccount[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IAccount>(
      `SELECT a.*, ac.category_name, ac.category_type
       FROM accounts a
       LEFT JOIN account_categories ac ON a.category_id = ac.category_id
       WHERE a.parish_id = @parishId
       ORDER BY a.transaction_date DESC, a.created_at DESC
       LIMIT @limit OFFSET @offset`,
      { parishId, offset, limit }
    );

    return result.rows;
  }

  /**
   * Count accounts by parish ID
   */
  public static async countByParishId(parishId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM accounts WHERE parish_id = @parishId`,
      { parishId }
    );

    return parseInt(result.rows[0].count as any, 10);
  }

  /**
   * Get account summary (totals and balance)
   */
  public static async getSummary(parishId: number): Promise<IAccountSummary> {
    const result = await database.executeQuery<{
      total_income: number;
      total_expenses: number;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
       FROM accounts
       WHERE parish_id = @parishId`,
      { parishId }
    );

    const row = result.rows[0];

    return {
      total_income: row.total_income || 0,
      total_expenses: row.total_expenses || 0,
      current_balance: (row.total_income || 0) - (row.total_expenses || 0),
    };
  }

  /**
   * Get transactions by type (income or expense)
   */
  public static async findByType(
    parishId: number,
    type: 'income' | 'expense',
    page: number = 1,
    limit: number = 20
  ): Promise<IAccount[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IAccount>(
      `SELECT a.*, ac.category_name, ac.category_type
       FROM accounts a
       LEFT JOIN account_categories ac ON a.category_id = ac.category_id
       WHERE a.parish_id = @parishId AND a.transaction_type = @type
       ORDER BY a.transaction_date DESC, a.created_at DESC
       LIMIT @limit OFFSET @offset`,
      { parishId, type, offset, limit }
    );

    return result.rows;
  }

  /**
   * Get transactions by date range
   */
  public static async findByDateRange(
    parishId: number,
    startDate: Date,
    endDate: Date
  ): Promise<IAccount[]> {
    const result = await database.executeQuery<IAccount>(
      `SELECT a.*, ac.category_name, ac.category_type
       FROM accounts a
       LEFT JOIN account_categories ac ON a.category_id = ac.category_id
       WHERE a.parish_id = @parishId
         AND a.transaction_date >= @startDate
         AND a.transaction_date <= @endDate
       ORDER BY a.transaction_date DESC, a.created_at DESC`,
      { parishId, startDate, endDate }
    );

    return result.rows;
  }

  /**
   * Get transactions by category
   */
  public static async findByCategory(
    parishId: number,
    categoryId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<IAccount[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IAccount>(
      `SELECT a.*, ac.category_name, ac.category_type
       FROM accounts a
       LEFT JOIN account_categories ac ON a.category_id = ac.category_id
       WHERE a.parish_id = @parishId AND a.category_id = @categoryId
       ORDER BY a.transaction_date DESC, a.created_at DESC
       LIMIT @limit OFFSET @offset`,
      { parishId, categoryId, offset, limit }
    );

    return result.rows;
  }


  /**
   * Calculate running balance up to a specific transaction
   */
  private static async calculateBalance(parishId: number, upToDate: Date): Promise<number> {
    const result = await database.executeQuery<{ balance: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as balance
       FROM accounts
       WHERE parish_id = @parishId
         AND transaction_date <= @upToDate`,
      { parishId, upToDate }
    );

    return result.rows[0]?.balance || 0;
  }

  /**
   * Create a new account transaction
   */
  public static async create(accountData: {
    parish_id: number;
    transaction_date: Date;
    transaction_type: 'income' | 'expense';
    category_id: number;
    amount: number;
    description: string;
    reference_number?: string;
    payment_method?: string;
    created_by?: number;
  }): Promise<IAccount> {
    const fields: string[] = [
      'parish_id',
      'transaction_date',
      'transaction_type',
      'category_id',
      'amount',
      'description',
    ];
    const params: Record<string, any> = {
      parish_id: accountData.parish_id,
      transaction_date: accountData.transaction_date,
      transaction_type: accountData.transaction_type,
      category_id: accountData.category_id,
      amount: accountData.amount,
      description: accountData.description,
    };

    if (accountData.reference_number !== undefined) {
      fields.push('reference_number');
      params.reference_number = accountData.reference_number;
    }
    if (accountData.payment_method !== undefined) {
      fields.push('payment_method');
      params.payment_method = accountData.payment_method;
    }
    if (accountData.created_by !== undefined) {
      fields.push('created_by');
      params.created_by = accountData.created_by;
    }

    // Calculate balance after this transaction
    const balanceBefore = await this.calculateBalance(
      accountData.parish_id,
      accountData.transaction_date
    );
    const balanceAfter =
      accountData.transaction_type === 'income'
        ? balanceBefore + accountData.amount
        : balanceBefore - accountData.amount;

    fields.push('balance_after');
    params.balance_after = balanceAfter;

    const fieldNames = fields.join(', ');
    const fieldParams = fields.map((f) => `@${f}`).join(', ');

    const result = await database.executeQuery<{ account_id: number }>(
      `INSERT INTO accounts (${fieldNames})
       VALUES (${fieldParams})
       RETURNING account_id`,
      params
    );

    const accountId = result.rows[0].account_id;
    const account = await this.findById(accountId);

    if (!account) {
      throw ApiError.internal('Failed to create account transaction');
    }

    return account;
  }

  /**
   * Update account transaction
   */
  public static async update(
    accountId: number,
    updates: Partial<Omit<IAccount, 'account_id' | 'parish_id' | 'created_at' | 'updated_at' | 'balance_after'>>
  ): Promise<IAccount> {
    const existingAccount = await this.findById(accountId);
    if (!existingAccount) {
      throw ApiError.notFound('Account transaction not found');
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { accountId };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existingAccount;
    }

    await database.executeQuery(
      `UPDATE accounts SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE account_id = @accountId`,
      params
    );

    const updatedAccount = await this.findById(accountId);
    if (!updatedAccount) {
      throw ApiError.internal('Failed to update account transaction');
    }

    return updatedAccount;
  }


  /**
   * Delete account transaction
   */
  public static async delete(accountId: number): Promise<void> {
    const account = await this.findById(accountId);
    if (!account) {
      throw ApiError.notFound('Account transaction not found');
    }

    await database.executeQuery(
      `DELETE FROM accounts WHERE account_id = @accountId`,
      { accountId }
    );
  }

  /**
   * Search transactions by description
   */
  public static async search(parishId: number, searchTerm: string): Promise<IAccount[]> {
    const result = await database.executeQuery<IAccount>(
      `SELECT a.*, ac.category_name, ac.category_type
       FROM accounts a
       LEFT JOIN account_categories ac ON a.category_id = ac.category_id
       WHERE a.parish_id = @parishId AND (
         a.description LIKE '%' || @searchTerm || '%' OR
         a.reference_number LIKE '%' || @searchTerm || '%' OR
         ac.category_name LIKE '%' || @searchTerm || '%'
       )
       ORDER BY a.transaction_date DESC, a.created_at DESC`,
      { parishId, searchTerm }
    );

    return result.rows;
  }

  /**
   * Get all transactions for CSV export
   */
  public static async getAllForExport(parishId: number): Promise<IAccount[]> {
    const result = await database.executeQuery<IAccount>(
      `SELECT a.*, ac.category_name, ac.category_type
       FROM accounts a
       LEFT JOIN account_categories ac ON a.category_id = ac.category_id
       WHERE a.parish_id = @parishId
       ORDER BY a.transaction_date DESC, a.created_at DESC`,
      { parishId }
    );

    return result.rows;
  }

  /**
   * Bulk import transactions (for CSV import)
   */
  public static async bulkImport(
    parishId: number,
    transactions: Array<{
      transaction_date: Date;
      transaction_type: 'income' | 'expense';
      category_id: number;
      amount: number;
      description: string;
      reference_number?: string;
      payment_method?: string;
    }>,
    createdBy?: number
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < transactions.length; i++) {
      try {
        await this.create({
          parish_id: parishId,
          ...transactions[i],
          created_by: createdBy,
        });
        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return { success: successCount, failed: failedCount, errors };
  }
}

export default AccountModel;
