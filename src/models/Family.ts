/* eslint-disable @typescript-eslint/no-explicit-any */
import database from '../config/database';
import { IFamily } from '../types';
import { ApiError } from '../utils/apiError';

export class FamilyModel {
  public static async findById(familyId: number): Promise<IFamily | null> {
    const result = await database.executeQuery<IFamily>(
      `SELECT
         f.*,
         (SELECT COUNT(*) FROM parishioners WHERE family_id = f.family_id AND is_active = TRUE) AS member_count
       FROM families f
       WHERE f.family_id = @familyId`,
      { familyId }
    );

    return result.rows[0] || null;
  }

  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<IFamily[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IFamily>(
      `SELECT
         f.*,
         (SELECT COUNT(*) FROM parishioners WHERE family_id = f.family_id AND is_active = TRUE) AS member_count
       FROM families f
       WHERE f.parish_id = @parishId AND f.is_active = 1
       ORDER BY f.family_name ASC
       LIMIT @limit OFFSET @offset`,
      { parishId, offset, limit }
    );

    return result.rows;
  }

  public static async findByWardId(
    wardId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<IFamily[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IFamily>(
      `SELECT
         f.*,
         (SELECT COUNT(*) FROM parishioners WHERE family_id = f.family_id AND is_active = TRUE) AS member_count
       FROM families f
       WHERE f.ward_id = @wardId AND f.is_active = 1
       ORDER BY f.family_name ASC
       LIMIT @limit OFFSET @offset`,
      { wardId, offset, limit }
    );

    return result.rows;
  }

  public static async getAllByParish(parishId: number): Promise<IFamily[]> {
    const result = await database.executeQuery<IFamily>(
      `SELECT
         f.*,
         (SELECT COUNT(*) FROM parishioners WHERE family_id = f.family_id AND is_active = TRUE) AS member_count
       FROM families f
       WHERE f.parish_id = @parishId AND f.is_active = 1
       ORDER BY f.family_name ASC`,
      { parishId }
    );

    return result.rows;
  }

  public static async countByParishId(parishId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM families WHERE parish_id = @parishId AND is_active = TRUE`,
      { parishId }
    );

    return parseInt(result.rows[0].count as any, 10);
  }

  public static async countByWardId(wardId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM families WHERE ward_id = @wardId AND is_active = TRUE`,
      { wardId }
    );

    return parseInt(result.rows[0].count as any, 10);
  }

  public static async create(familyData: {
    parish_id: number;
    ward_id?: number;
    family_name: string;
    primary_contact_id?: number;
    head_of_family?: string;
    home_phone?: string;
    registration_date?: Date;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  }): Promise<IFamily> {
    const fields: string[] = ['parish_id', 'family_name'];
    const params: Record<string, any> = {
      parish_id: familyData.parish_id,
      family_name: familyData.family_name,
    };

    // Add optional fields
    if (familyData.ward_id !== undefined) {
      fields.push('ward_id');
      params.ward_id = familyData.ward_id;
    }
    if (familyData.primary_contact_id !== undefined) {
      fields.push('primary_contact_id');
      params.primary_contact_id = familyData.primary_contact_id;
    }
    if (familyData.head_of_family !== undefined) {
      fields.push('head_of_family');
      params.head_of_family = familyData.head_of_family;
    }
    if (familyData.home_phone !== undefined) {
      fields.push('home_phone');
      params.home_phone = familyData.home_phone;
    }
    if (familyData.registration_date !== undefined) {
      fields.push('registration_date');
      params.registration_date = familyData.registration_date;
    }
    if (familyData.address_line1 !== undefined) {
      fields.push('address_line1');
      params.address_line1 = familyData.address_line1;
    }
    if (familyData.address_line2 !== undefined) {
      fields.push('address_line2');
      params.address_line2 = familyData.address_line2;
    }
    if (familyData.city !== undefined) {
      fields.push('city');
      params.city = familyData.city;
    }
    if (familyData.state !== undefined) {
      fields.push('state');
      params.state = familyData.state;
    }
    if (familyData.country !== undefined) {
      fields.push('country');
      params.country = familyData.country;
    }
    if (familyData.postal_code !== undefined) {
      fields.push('postal_code');
      params.postal_code = familyData.postal_code;
    }

    const fieldNames = fields.join(', ');
    const fieldParams = fields.map((f) => `@${f}`).join(', ');
    const result = await database.executeQuery<{ family_id: number }>(
      `INSERT INTO families (${fieldNames})
       VALUES (${fieldParams})
       RETURNING family_id`,
      params
    );

    const familyId = result.rows[0].family_id;
    const family = await this.findById(familyId);

    if (!family) {
      throw ApiError.internal('Failed to create family');
    }

    return family;
  }

  public static async update(
    familyId: number,
    updates: Partial<
      Omit<IFamily, 'family_id' | 'parish_id' | 'created_at' | 'updated_at' | 'member_count'>
    > // Exclude member_count from direct update
  ): Promise<IFamily> {
    const existingFamily = await this.findById(familyId);
    if (!existingFamily) {
      throw ApiError.notFound('Family not found');
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { familyId };

    Object.entries(updates).forEach(([key, value]) => {
      // Ensure member_count is not updated directly as it's a derived field
      if (key !== 'member_count' && value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existingFamily;
    }

    await database.executeQuery(
      `UPDATE families SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE family_id = @familyId`,
      params
    );

    const updatedFamily = await this.findById(familyId);
    if (!updatedFamily) {
      throw ApiError.internal('Failed to update family');
    }

    return updatedFamily;
  }

  public static async delete(familyId: number): Promise<void> {
    const family = await this.findById(familyId);
    if (!family) {
      throw ApiError.notFound('Family not found');
    }

    await database.executeQuery(
      `UPDATE families SET is_active = FALSE, updated_at = NOW() WHERE family_id = @familyId`,
      { familyId }
    );
  }

  public static async search(parishId: number, searchTerm: string): Promise<IFamily[]> {
    const result = await database.executeQuery<IFamily>(
      `SELECT
         f.*,
         (SELECT COUNT(*) FROM parishioners WHERE family_id = f.family_id AND is_active = TRUE) AS member_count
       FROM families f
       WHERE f.parish_id = @parishId AND f.is_active = 1 AND (
         f.family_name LIKE '%' + @searchTerm + '%' OR
         f.head_of_family LIKE '%' + @searchTerm + '%' OR
         f.address_line1 LIKE '%' + @searchTerm + '%' OR
         f.city LIKE '%' + @searchTerm + '%' OR
         f.state LIKE '%' + @searchTerm + '%' OR
         f.postal_code LIKE '%' + @searchTerm + '%'
       )
       ORDER BY f.family_name ASC`,
      { parishId, searchTerm }
    );

    return result.rows;
  }
}

export default FamilyModel;
