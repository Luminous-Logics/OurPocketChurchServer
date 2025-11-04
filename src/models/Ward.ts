import database from '../config/database';
import { IWard } from '../types';
import { ApiError } from '../utils/apiError';

export class WardModel {
  /**
   * Find ward by ID
   */
  public static async findById(wardId: number): Promise<IWard | null> {
    const result = await database.executeQuery<IWard>(
      `SELECT * FROM wards WHERE ward_id = @wardId`,
      { wardId }
    );

    return result.rows[0] || null;
  }

  /**
   * Find all wards by parish ID
   */
  public static async findByParishId(parishId: number, page: number = 1, limit: number = 20): Promise<IWard[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IWard>(
      `SELECT * FROM wards
       WHERE parish_id = @parishId AND is_active = TRUE
       ORDER BY ward_name ASC
       LIMIT @limit OFFSET @offset`,
      { parishId, offset, limit }
    );

    return result.rows;
  }

  /**
   * Find ward by ward number within a parish
   */
  public static async findByWardNumber(parishId: number, wardNumber: string): Promise<IWard | null> {
    const result = await database.executeQuery<IWard>(
      `SELECT * FROM wards WHERE parish_id = @parishId AND ward_number = @wardNumber`,
      { parishId, wardNumber }
    );

    return result.rows[0] || null;
  }

  /**
   * Get all wards for a parish (no pagination)
   */
  public static async getAllByParish(parishId: number): Promise<IWard[]> {
    const result = await database.executeQuery<IWard>(
      `SELECT * FROM wards WHERE parish_id = @parishId AND is_active = TRUE ORDER BY ward_name ASC`,
      { parishId }
    );

    return result.rows;
  }

  /**
   * Count wards by parish ID
   */
  public static async countByParishId(parishId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM wards WHERE parish_id = @parishId AND is_active = TRUE`,
      { parishId }
    );

    return result.rows[0].count;
  }

  /**
   * Create a new ward
   */
  public static async create(wardData: {
    parish_id: number;
    ward_name: string;
    ward_number?: string;
    description?: string;
    coordinator_id?: number;
    area_coverage?: string;
  }): Promise<IWard> {
    // Check if ward number already exists in this parish
    if (wardData.ward_number) {
      const existing = await this.findByWardNumber(wardData.parish_id, wardData.ward_number);
      if (existing) {
        throw ApiError.conflict('Ward number already exists in this parish');
      }
    }

    // Build dynamic INSERT query
    const fields: string[] = ['parish_id', 'ward_name'];
    const params: Record<string, any> = {
      parish_id: wardData.parish_id,
      ward_name: wardData.ward_name,
    };

    // Add optional fields
    if (wardData.ward_number !== undefined) {
      fields.push('ward_number');
      params.ward_number = wardData.ward_number;
    }
    if (wardData.description !== undefined) {
      fields.push('description');
      params.description = wardData.description;
    }
    if (wardData.coordinator_id !== undefined) {
      fields.push('coordinator_id');
      params.coordinator_id = wardData.coordinator_id;
    }
    if (wardData.area_coverage !== undefined) {
      fields.push('area_coverage');
      params.area_coverage = wardData.area_coverage;
    }

    const fieldNames = fields.join(', ');
    const fieldParams = fields.map((f) => `@${f}`).join(', ');

    const result = await database.executeQuery<{ ward_id: number }>(
      `INSERT INTO wards (${fieldNames})
       VALUES (${fieldParams})
       RETURNING ward_id`,
      params
    );

    const wardId = result.rows[0].ward_id;
    const ward = await this.findById(wardId);

    if (!ward) {
      throw ApiError.internal('Failed to create ward');
    }

    return ward;
  }

  /**
   * Update ward
   */
  public static async update(
    wardId: number,
    updates: Partial<Omit<IWard, 'ward_id' | 'parish_id' | 'created_at' | 'updated_at' | 'total_families' | 'total_members'>>
  ): Promise<IWard> {
    const existingWard = await this.findById(wardId);
    if (!existingWard) {
      throw ApiError.notFound('Ward not found');
    }

    // Check if ward_number is being updated and if it conflicts
    if (updates.ward_number && updates.ward_number !== existingWard.ward_number) {
      const duplicate = await this.findByWardNumber(existingWard.parish_id, updates.ward_number);
      if (duplicate && duplicate.ward_id !== wardId) {
        throw ApiError.conflict('Ward number already exists in this parish');
      }
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { wardId };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existingWard;
    }

    await database.executeQuery(
      `UPDATE wards SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE ward_id = @wardId`,
      params
    );

    const updatedWard = await this.findById(wardId);
    if (!updatedWard) {
      throw ApiError.internal('Failed to update ward');
    }

    return updatedWard;
  }

  /**
   * Delete ward (soft delete)
   */
  public static async delete(wardId: number): Promise<void> {
    const ward = await this.findById(wardId);
    if (!ward) {
      throw ApiError.notFound('Ward not found');
    }

    await database.executeQuery(
      `UPDATE wards SET is_active = FALSE, updated_at = NOW() WHERE ward_id = @wardId`,
      { wardId }
    );
  }

  /**
   * Update total families and members count
   */
  public static async updateCounts(wardId: number, totalFamilies: number, totalMembers: number): Promise<void> {
    await database.executeQuery(
      `UPDATE wards SET total_families = @totalFamilies, total_members = @totalMembers, updated_at = NOW()
       WHERE ward_id = @wardId`,
      { wardId, totalFamilies, totalMembers }
    );
  }

  /**
   * Search wards by name within a parish
   */
  public static async search(parishId: number, searchTerm: string): Promise<IWard[]> {
    const result = await database.executeQuery<IWard>(
      `SELECT * FROM wards
       WHERE parish_id = @parishId AND is_active = TRUE AND (
         ward_name LIKE '%' || @searchTerm || '%' OR
         ward_number LIKE '%' || @searchTerm || '%' OR
         area_coverage LIKE '%' || @searchTerm || '%'
       )
       ORDER BY ward_name ASC`,
      { parishId, searchTerm }
    );

    return result.rows;
  }
}

export default WardModel;
