/* eslint-disable @typescript-eslint/no-explicit-any */
import database from '../config/database';
import { IParishioner } from '../types';
import { ApiError } from '../utils/apiError';

export class ParishionerModel {

  public static async findById(parishionerId: number): Promise<IParishioner | null> {
    const result = await database.executeQuery<IParishioner>(
      `SELECT
         p.parishioner_id, p.user_id, p.parish_id, p.ward_id, p.family_id, p.middle_name,
         p.date_of_birth, p.gender, p.marital_status, p.occupation, p.baptism_date,
         p.first_communion_date, p.confirmation_date, p.marriage_date, p.member_status,
         p.photo_url, p.address_line1, p.address_line2, p.city, p.state, p.country,
         p.postal_code, p.emergency_contact_name, p.emergency_contact_phone, p.notes,
         p.registration_date, p.is_active, p.created_at, p.updated_at,
         u.first_name, u.last_name, u.email, u.phone
       FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.parishioner_id = @parishionerId`,
      { parishionerId }
    );

    return result.rows[0] || null;
  }

  public static async findByUserId(userId: number): Promise<IParishioner | null> {
    const result = await database.executeQuery<IParishioner>(
      `SELECT
         p.parishioner_id, p.user_id, p.parish_id, p.ward_id, p.family_id, p.middle_name,
         p.date_of_birth, p.gender, p.marital_status, p.occupation, p.baptism_date,
         p.first_communion_date, p.confirmation_date, p.marriage_date, p.member_status,
         p.photo_url, p.address_line1, p.address_line2, p.city, p.state, p.country,
         p.postal_code, p.emergency_contact_name, p.emergency_contact_phone, p.notes,
         p.registration_date, p.is_active, p.created_at, p.updated_at,
         u.first_name, u.last_name, u.email, u.phone
       FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = @userId`,
      { userId }
    );

    return result.rows[0] || null;
  }

  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<IParishioner[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IParishioner>(
      `SELECT
         p.parishioner_id, p.user_id, p.parish_id, p.ward_id, p.family_id, p.middle_name,
         p.date_of_birth, p.gender, p.marital_status, p.occupation, p.baptism_date,
         p.first_communion_date, p.confirmation_date, p.marriage_date, p.member_status,
         p.photo_url, p.address_line1, p.address_line2, p.city, p.state, p.country,
         p.postal_code, p.emergency_contact_name, p.emergency_contact_phone, p.notes,
         p.registration_date, p.is_active, p.created_at, p.updated_at,
         u.first_name, u.last_name, u.email, u.phone
       FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.parish_id = @parishId AND p.is_active = TRUE
       ORDER BY p.created_at DESC
       LIMIT @limit OFFSET @offset`,
      { parishId, offset, limit }
    );

    return result.rows;
  }

  public static async findByWardId(
    wardId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<IParishioner[]> {
    const offset = (page - 1) * limit;

    const result = await database.executeQuery<IParishioner>(
      `SELECT
         p.parishioner_id, p.user_id, p.parish_id, p.ward_id, p.family_id, p.middle_name,
         p.date_of_birth, p.gender, p.marital_status, p.occupation, p.baptism_date,
         p.first_communion_date, p.confirmation_date, p.marriage_date, p.member_status,
         p.photo_url, p.address_line1, p.address_line2, p.city, p.state, p.country,
         p.postal_code, p.emergency_contact_name, p.emergency_contact_phone, p.notes,
         p.registration_date, p.is_active, p.created_at, p.updated_at,
         u.first_name, u.last_name, u.email, u.phone
       FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.ward_id = @wardId AND p.is_active = TRUE
       ORDER BY p.created_at DESC
       LIMIT @limit OFFSET @offset`,
      { wardId, offset, limit }
    );

    return result.rows;
  }

  public static async findByFamilyId(familyId: number): Promise<IParishioner[]> {
    const result = await database.executeQuery<IParishioner>(
      `SELECT
         p.parishioner_id, p.user_id, p.parish_id, p.ward_id, p.family_id, p.middle_name,
         p.date_of_birth, p.gender, p.marital_status, p.occupation, p.baptism_date,
         p.first_communion_date, p.confirmation_date, p.marriage_date, p.member_status,
         p.photo_url, p.address_line1, p.address_line2, p.city, p.state, p.country,
         p.postal_code, p.emergency_contact_name, p.emergency_contact_phone, p.notes,
         p.registration_date, p.is_active, p.created_at, p.updated_at,
         u.first_name, u.last_name, u.email, u.phone
       FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.family_id = @familyId AND p.is_active = TRUE
       ORDER BY p.date_of_birth ASC`,
      { familyId }
    );

    return result.rows;
  }

  public static async countByParishId(parishId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM parishioners WHERE parish_id = @parishId AND is_active = TRUE`,
      { parishId }
    );

    return result.rows[0].count;
  }

  public static async countByWardId(wardId: number): Promise<number> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM parishioners WHERE ward_id = @wardId AND is_active = TRUE`,
      { wardId }
    );

    return result.rows[0].count;
  }

  public static async getAllByParish(parishId: number): Promise<IParishioner[]> {
    const result = await database.executeQuery<IParishioner>(
      `SELECT
         p.parishioner_id, p.user_id, p.parish_id, p.ward_id, p.family_id, p.middle_name,
         p.date_of_birth, p.gender, p.marital_status, p.occupation, p.baptism_date,
         p.first_communion_date, p.confirmation_date, p.marriage_date, p.member_status,
         p.photo_url, p.address_line1, p.address_line2, p.city, p.state, p.country,
         p.postal_code, p.emergency_contact_name, p.emergency_contact_phone, p.notes,
         p.registration_date, p.is_active, p.created_at, p.updated_at,
         u.first_name, u.last_name, u.email, u.phone
       FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.parish_id = @parishId AND p.is_active = TRUE
       ORDER BY p.created_at DESC`,
      { parishId }
    );

    return result.rows;
  }

  public static async create(parishionerData: {
    user_id: number;
    parish_id: number;
    ward_id?: number;
    family_id?: number;
    middle_name?: string;
    date_of_birth?: Date;
    gender?: string;
    marital_status?: string;
    occupation?: string;
    baptism_date?: Date;
    first_communion_date?: Date;
    confirmation_date?: Date;
    marriage_date?: Date;
    member_status?: string;
    photo_url?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    notes?: string;
    registration_date?: Date;
  }): Promise<IParishioner> {
    const fields: string[] = ['user_id', 'parish_id'];
    const params: Record<string, any> = {
      user_id: parishionerData.user_id,
      parish_id: parishionerData.parish_id,
    };
    // Add optional fields
    if (parishionerData.ward_id !== undefined) {
      fields.push('ward_id');
      params.ward_id = parishionerData.ward_id;
    }
    if (parishionerData.family_id !== undefined) {
      fields.push('family_id');
      params.family_id = parishionerData.family_id;
    }
    if (parishionerData.middle_name !== undefined) {
      fields.push('middle_name');
      params.middle_name = parishionerData.middle_name;
    }
    if (parishionerData.date_of_birth !== undefined) {
      fields.push('date_of_birth');
      params.date_of_birth = parishionerData.date_of_birth;
    }
    if (parishionerData.gender !== undefined) {
      fields.push('gender');
      params.gender = parishionerData.gender;
    }
    if (parishionerData.marital_status !== undefined) {
      fields.push('marital_status');
      params.marital_status = parishionerData.marital_status;
    }
    if (parishionerData.occupation !== undefined) {
      fields.push('occupation');
      params.occupation = parishionerData.occupation;
    }
    if (parishionerData.baptism_date !== undefined) {
      fields.push('baptism_date');
      params.baptism_date = parishionerData.baptism_date;
    }
    if (parishionerData.first_communion_date !== undefined) {
      fields.push('first_communion_date');
      params.first_communion_date = parishionerData.first_communion_date;
    }
    if (parishionerData.confirmation_date !== undefined) {
      fields.push('confirmation_date');
      params.confirmation_date = parishionerData.confirmation_date;
    }
    if (parishionerData.marriage_date !== undefined) {
      fields.push('marriage_date');
      params.marriage_date = parishionerData.marriage_date;
    }
    if (parishionerData.member_status !== undefined) {
      fields.push('member_status');
      params.member_status = parishionerData.member_status;
    }
    if (parishionerData.photo_url !== undefined) {
      fields.push('photo_url');
      params.photo_url = parishionerData.photo_url;
    }
    if (parishionerData.address_line1 !== undefined) {
      fields.push('address_line1');
      params.address_line1 = parishionerData.address_line1;
    }
    if (parishionerData.address_line2 !== undefined) {
      fields.push('address_line2');
      params.address_line2 = parishionerData.address_line2;
    }
    if (parishionerData.city !== undefined) {
      fields.push('city');
      params.city = parishionerData.city;
    }
    if (parishionerData.state !== undefined) {
      fields.push('state');
      params.state = parishionerData.state;
    }
    if (parishionerData.country !== undefined) {
      fields.push('country');
      params.country = parishionerData.country;
    }
    if (parishionerData.postal_code !== undefined) {
      fields.push('postal_code');
      params.postal_code = parishionerData.postal_code;
    }
    if (parishionerData.emergency_contact_name !== undefined) {
      fields.push('emergency_contact_name');
      params.emergency_contact_name = parishionerData.emergency_contact_name;
    }
    if (parishionerData.emergency_contact_phone !== undefined) {
      fields.push('emergency_contact_phone');
      params.emergency_contact_phone = parishionerData.emergency_contact_phone;
    }
    if (parishionerData.notes !== undefined) {
      fields.push('notes');
      params.notes = parishionerData.notes;
    }
    if (parishionerData.registration_date !== undefined) {
      fields.push('registration_date');
      params.registration_date = parishionerData.registration_date;
    }

    const fieldNames = fields.join(', ');
    const fieldParams = fields.map((f) => `@${f}`).join(', ');
    const result = await database.executeQuery<{ parishioner_id: number }>(
      `INSERT INTO parishioners (${fieldNames})
       VALUES (${fieldParams})
       RETURNING parishioner_id`,
      params
    );

    const parishionerId = result.rows[0].parishioner_id;
    const parishioner = await this.findById(parishionerId);

    if (!parishioner) {
      throw ApiError.internal('Failed to create parishioner');
    }

    return parishioner;
  }

  public static async update(
    parishionerId: number,
    updates: Partial<
      Omit<IParishioner, 'parishioner_id' | 'user_id' | 'parish_id' | 'created_at' | 'updated_at'>
    >
  ): Promise<IParishioner> {
    const existingParishioner = await this.findById(parishionerId);
    if (!existingParishioner) {
      throw ApiError.notFound('Parishioner not found');
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = { parishionerId };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updateFields.length === 0) {
      return existingParishioner;
    }
    await database.executeQuery(
      `UPDATE parishioners SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE parishioner_id = @parishionerId`,
      params
    );

    const updatedParishioner = await this.findById(parishionerId);
    if (!updatedParishioner) {
      throw ApiError.internal('Failed to update parishioner');
    }

    return updatedParishioner;
  }

  public static async delete(parishionerId: number): Promise<void> {
    const parishioner = await this.findById(parishionerId);
    if (!parishioner) {
      throw ApiError.notFound('Parishioner not found');
    }

    await database.executeQuery(
      `UPDATE parishioners SET is_active = FALSE, updated_at = NOW() WHERE parishioner_id = @parishionerId`,
      { parishionerId }
    );
  }

  public static async search(parishId: number, searchTerm: string): Promise<IParishioner[]> {
    const result = await database.executeQuery<IParishioner>(
      `SELECT p.* FROM parishioners p
       INNER JOIN users u ON p.user_id = u.user_id
       WHERE p.parish_id = @parishId AND p.is_active = TRUE AND (
         u.first_name LIKE '%' || @searchTerm || '%' OR
         u.last_name LIKE '%' || @searchTerm || '%' OR
         u.email LIKE '%' || @searchTerm || '%' OR
         p.middle_name LIKE '%' || @searchTerm || '%'
       )
       ORDER BY u.first_name, u.last_name ASC`,
      { parishId, searchTerm }
    );

    return result.rows;
  }
}

export default ParishionerModel;
