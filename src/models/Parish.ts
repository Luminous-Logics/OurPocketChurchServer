/* eslint-disable @typescript-eslint/no-explicit-any */
import database from '../config/database';
import { IParish } from '../types';
import { ApiError } from '../utils/apiError';
import { ChurchAdminModel } from './ChurchAdmin';

export class ParishModel {
  /**
   * Find parish by ID
   */
  public static async findById(parishId: number): Promise<IParish | null> {
    const result = await database.executeQuery<IParish>(
      `SELECT * FROM parishes WHERE parish_id = @parishId`,
      { parishId }
    );

    return result.rows[0] || null;
  }

  /**
   * Get all parishes
   */
  public static async findAll(page: number = 1, limit: number = 20): Promise<IParish[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IParish>(
      `SELECT * FROM parishes
       WHERE is_active = TRUE
       ORDER BY parish_name ASC
       LIMIT @limit OFFSET @offset`,
      { offset, limit }
    );

    return result.rows;
  }

  /**
   * Create a new parish
   */
  public static async create(parishData: {
    parish_name: string;
    diocese?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website_url?: string;
    established_date?: Date;
    patron_saint?: string;
    timezone?: string;
    subscription_plan?: string;
    subscription_expiry?: Date;
  }): Promise<IParish> {
    const result = await database.executeQuery<{ parish_id: number }>(
      `INSERT INTO parishes (
        parish_name, diocese, address_line1, address_line2, city, state, country,
        postal_code, phone, email, website_url, established_date, patron_saint,
        timezone, subscription_plan, subscription_expiry
      )
       RETURNING parish_id
       VALUES (
        @parish_name, @diocese, @address_line1, @address_line2, @city, @state, @country,
        @postal_code, @phone, @email, @website_url, @established_date, @patron_saint,
        @timezone, @subscription_plan, @subscription_expiry
      )`,
      parishData
    );

    const parishId = result.rows[0].parish_id;
    const parish = await this.findById(parishId);

    if (!parish) {
      throw ApiError.internal('Failed to create parish');
    }

    return parish;
  }

  /**
   * Update parish
   */
  public static async update(
    parishId: number,
    updates: Partial<Omit<IParish, 'parish_id' | 'created_at' | 'updated_at'>>
  ): Promise<IParish> {
    const existingParish = await this.findById(parishId);
    if (!existingParish) {
      throw ApiError.notFound('Parish not found');
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { parishId };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existingParish;
    }

    await database.executeQuery(
      `UPDATE parishes SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE parish_id = @parishId`,
      params
    );

    const updatedParish = await this.findById(parishId);
    if (!updatedParish) {
      throw ApiError.internal('Failed to update parish');
    }

    return updatedParish;
  }

  /**
   * Delete parish (soft delete)
   */
  /**
   * Permanently delete parish and archive it into deleted_parishes table
   */
  public static async delete(parishId: number, deletedBy?: number): Promise<void> {
    const parish = await this.findById(parishId);
    if (!parish) {
      throw ApiError.notFound('Parish not found');
    }

    // Step 1: Delete associated ChurchAdmin records
    await ChurchAdminModel.hardDeleteByParishId(parishId);

    // Step 2: Insert deleted parish data into deleted_parishes
 await database.executeQuery(
  `INSERT INTO deleted_parish (
    parish_id, parish_name, diocese, address_line1, address_line2, city, state, country,
    postal_code, phone, email, website_url, established_date, patron_saint, timezone,
    subscription_plan, subscription_expiry, deleted_by, created_at, updated_at
  )
  VALUES (
    @parish_id, @parish_name, @diocese, @address_line1, @address_line2, @city, @state, @country,
    @postal_code, @phone, @email, @website_url, @established_date, @patron_saint, @timezone,
    @subscription_plan, @subscription_expiry, @deleted_by, @created_at, @updated_at
  )`,
  {
    parish_id: parish.parish_id,
    parish_name: parish.parish_name,
    diocese: parish.diocese,
    address_line1: parish.address_line1,
    address_line2: parish.address_line2,
    city: parish.city,
    state: parish.state,
    country: parish.country,
    postal_code: parish.postal_code,
    phone: parish.phone,
    email: parish.email,
    website_url: parish.website_url,
    established_date: parish.established_date,
    patron_saint: parish.patron_saint,
    timezone: parish.timezone,
    subscription_plan: parish.subscription_plan,
    subscription_expiry: parish.subscription_expiry,
    deleted_by: deletedBy || null,
    created_at: parish.created_at,
    updated_at: parish.updated_at,
  }
);


    // Step 2: Delete from main parishes table
    await database.executeQuery(
      `DELETE FROM parishes WHERE parish_id = @parish_id`,
      { parish_id: parishId }
    );
  }


  /**
   * Count all parishes
   */
  public static async count(): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM parishes WHERE is_active = TRUE`
    );

    return result.rows[0].count;
  }

  /**
   * Search parishes by name
   */
  public static async search(searchTerm: string): Promise<IParish[]> {
    const result = await database.executeQuery<IParish>(
      `SELECT * FROM parishes
       WHERE is_active = TRUE AND (
         parish_name LIKE '%' + @searchTerm + '%' OR
         city LIKE '%' + @searchTerm + '%' OR
         state LIKE '%' + @searchTerm + '%'
       )
       ORDER BY parish_name ASC`,
      { searchTerm }
    );

    return result.rows;
  }
}

export default ParishModel;
