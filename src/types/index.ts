/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';

// User Types
export enum UserType {
  SUPER_ADMIN = 'super_admin',
  CHURCH_ADMIN = 'church_admin',
  PARISHIONER = 'parishioner',
}

export interface IUser {
  user_id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_image_url?: string;
  user_type: UserType;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IAuthRequest extends Request {
  user?: ITokenPayload;
}

export interface ITokenPayload {
  user_id: number;
  email: string;
  user_type: UserType;
  parish_id?: number;
  is_church_admin?: boolean;
  permissions?: Array<{
    permission_id: number;
    permission_code: string;
    permission_name: string;
    module: string;
    action: string;
  }>;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  data: {
    token: string;
    expires_in: number; // in seconds
    expires_at: string; // ISO timestamp
    user: {
      user_id: number;
      email: string;
      first_name: string;
      last_name: string;
      user_type: UserType;
    };
  };
}

// Parish
export interface IParish {
  parish_id: number;
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
  timezone: string;
  subscription_plan?: string;
  subscription_expiry?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Parishioner
export interface IParishioner {
  parishioner_id: number;
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
  member_status: string;
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
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // User fields from JOIN
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

// Ward
export interface IWard {
  ward_id: number;
  parish_id: number;
  ward_name: string;
  ward_number?: string;
  description?: string;
  coordinator_id?: number;
  area_coverage?: string;
  total_families: number;
  total_members: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Ward Role
export interface IWardRole {
  ward_role_id: number;
  ward_id: number;
  parishioner_id: number;
  role_id: number;
  role_name: string;
  is_primary: boolean;
  assigned_by?: number;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Ward with Roles (extended interface)
export interface IWardWithRoles extends IWard {
  ward_roles?: Array<IWardRole & {
    parishioner_first_name?: string;
    parishioner_last_name?: string;
    parishioner_email?: string;
    parishioner_phone?: string;
    parishioner_photo_url?: string;
    role_type?: string;
    role_code?: string;
  }>;
}

// Ward Role Assignment Input
export interface IWardRoleInput {
  ward_id: number;
  parishioner_id: number;
  role_id: number;
  role_name?: string;
  is_primary?: boolean;
  assigned_by?: number;
  expires_at?: Date;
  notes?: string;
}

// Family
export interface IFamily {
  family_id: number;
  parish_id: number;
  ward_id?: number;
  family_name: string;
  primary_contact_id?: number;
  home_phone?: string;
  registration_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  head_of_family?: string;
  member_count?: number; // Added member count
  address_line1?: string; // Added address fields from primary contact
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

// Church Admin
export interface IChurchAdmin {
  church_admin_id: number;
  user_id: number;
  parish_id: number;
  role: string;
  department?: string;
  permissions?: string;
  hire_date?: Date;
  is_primary_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Clergy
export interface IClergy {
  clergy_id: number;
  parish_id: number;
  first_name: string;
  last_name: string;
  title: string;
  email?: string;
  phone?: string;
  ordination_date?: Date;
  assignment_start_date?: Date;
  assignment_end_date?: Date;
  specializations?: string;
  bio?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Sacrament
export interface ISacramentType {
  sacrament_type_id: number;
  sacrament_name: string;
  description?: string;
  requires_preparation: boolean;
  preparation_duration_days?: number;
}

export interface ISacrament {
  sacrament_id: number;
  parishioner_id: number;
  sacrament_type_id: number;
  administered_by?: number;
  sacrament_date: Date;
  location?: string;
  certificate_number?: string;
  godparent1_name?: string;
  godparent2_name?: string;
  witness1_name?: string;
  witness2_name?: string;
  notes?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Mass Schedule
export interface IMassSchedule {
  mass_schedule_id: number;
  parish_id: number;
  day_of_week?: number;
  mass_time: string;
  mass_type?: string;
  language?: string;
  celebrant_id?: number;
  location?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ISpecialMass {
  special_mass_id: number;
  parish_id: number;
  mass_date: Date;
  mass_time: string;
  occasion: string;
  celebrant_id?: number;
  location?: string;
  expected_attendance?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IMassIntention {
  intention_id: number;
  mass_schedule_id?: number;
  special_mass_id?: number;
  requested_by?: number;
  intention_for: string;
  intention_type?: string;
  offering_amount?: number;
  is_paid: boolean;
  notes?: string;
  created_at: Date;
}

// Event
export interface IEventCategory {
  category_id: number;
  category_name: string;
  description?: string;
  icon?: string;
}

export interface IEvent {
  event_id: number;
  parish_id: number;
  category_id?: number;
  event_name: string;
  description?: string;
  event_date: Date;
  start_time?: string;
  end_time?: string;
  location?: string;
  organizer_id?: number;
  max_capacity?: number;
  registration_required: boolean;
  registration_deadline?: Date;
  event_status: string;
  is_public: boolean;
  banner_image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IEventRegistration {
  registration_id: number;
  event_id: number;
  parishioner_id: number;
  registration_date: Date;
  number_of_attendees: number;
  attendance_status: string;
  notes?: string;
}

// Donation
export interface IDonationCategory {
  category_id: number;
  category_name: string;
  description?: string;
  is_tax_deductible: boolean;
}

export interface IDonation {
  donation_id: number;
  parish_id: number;
  donor_id?: number;
  family_id?: number;
  category_id?: number;
  amount: number;
  donation_date: Date;
  payment_method?: string;
  transaction_id?: string;
  check_number?: string;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_frequency?: string;
  receipt_issued: boolean;
  receipt_number?: string;
  notes?: string;
  recorded_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Communication
export interface IAnnouncement {
  announcement_id: number;
  parish_id: number;
  created_by: number;
  title: string;
  content: string;
  announcement_type?: string;
  priority: string;
  publish_date: Date;
  expiry_date?: Date;
  target_audience: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IMessage {
  message_id: number;
  parish_id: number;
  sender_id: number;
  recipient_id?: number;
  subject?: string;
  message_body: string;
  message_type: string;
  is_read: boolean;
  sent_at: Date;
  read_at?: Date;
}

export interface INotification {
  notification_id: number;
  user_id: number;
  notification_type?: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: number;
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
}

// Facility
export interface IFacility {
  facility_id: number;
  parish_id: number;
  facility_name: string;
  facility_type?: string;
  capacity?: number;
  description?: string;
  amenities?: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IFacilityBooking {
  booking_id: number;
  facility_id: number;
  booked_by: number;
  booking_date: Date;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: string;
  approved_by?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Prayer Request (Booking System)
export interface IPrayerRequest {
  prayer_request_id: number;
  parish_id: number;
  requested_by?: number; // Optional: links to parishioners table
  requester_name: string; // Name provided in form
  subject: string; // e.g., "Prayer for healing", "Death memory day"
  description: string; // Detailed description
  booking_date: Date; // Date for the prayer slot
  booking_time: string; // Time for the prayer slot (HH:MM format)
  status: string; // 'pending', 'confirmed', 'completed', 'cancelled'
  is_anonymous: boolean; // Whether to show requester's name publicly
  is_urgent: boolean; // Mark as urgent
  is_public: boolean; // Whether this appears on public prayer list
  approved_by?: number; // Church admin who approved/confirmed
  notes?: string; // Admin notes
  created_at: Date;
  updated_at: Date;
}

// Document
export interface IDocument {
  document_id: number;
  parish_id: number;
  uploaded_by: number;
  document_name: string;
  document_type?: string;
  file_url: string;
  file_size?: number;
  category?: string;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// Audiobook
export interface IAudiobook {
  audiobook_id: number;
  parish_id: number;
  title: string;
  author: string;
  narrator?: string;
  description?: string;
  thumbnail_url?: string;
  audio_file_url?: string;
  duration_minutes?: number;
  file_size_mb?: number;
  category?: string;
  language: string;
  publication_year?: number;
  is_active: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Accounts Management
export interface IAccountCategory {
  category_id: number;
  category_name: string;
  category_type: 'income' | 'expense';
  description?: string;
  is_active: boolean;
  is_system: boolean; // System categories cannot be deleted
  created_at: Date;
  updated_at: Date;
}

export interface IAccount {
  account_id: number;
  parish_id: number;
  transaction_date: Date;
  transaction_type: 'income' | 'expense';
  category_id: number;
  amount: number;
  description: string;
  reference_number?: string;
  payment_method?: string;
  balance_after?: number;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface IAccountSummary {
  total_income: number;
  total_expenses: number;
  current_balance: number;
}

// Audit Log
export interface IAuditLog {
  log_id: number;
  user_id?: number;
  action: string;
  table_name?: string;
  record_id?: number;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  timestamp: Date;
}

// Pagination
export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

// API Response
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// =====================================================
// BIBLE MODULE
// =====================================================

// Bible API Response (from bible-api.com)
export interface IBibleAPIResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

// Daily Bible Reading
export interface IDailyBibleReading {
  reading_id: number;
  parish_id: number;
  reading_date: Date;
  book_name: string;
  chapter: number;
  verse_start?: number;
  verse_end?: number;
  translation: string;
  title?: string;
  content?: string;
  is_active: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Bible Bookmark
export interface IBibleBookmark {
  bookmark_id: number;
  user_id: number;
  book_name: string;
  chapter: number;
  verse_start?: number;
  verse_end?: number;
  translation: string;
  note?: string;
  highlight_color?: string;
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

// Bible Reading History
export interface IBibleReadingHistory {
  history_id: number;
  user_id: number;
  book_name: string;
  chapter: number;
  verse_start?: number;
  verse_end?: number;
  translation: string;
  reading_date: Date;
  reading_duration_seconds?: number;
  completed: boolean;
  created_at: Date;
}

// Bible Reading Plan
export interface IBibleReadingPlan {
  plan_id: number;
  plan_name: string;
  description?: string;
  duration_days: number;
  plan_type?: string;
  is_active: boolean;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// Reading Plan Day
export interface IBibleReadingPlanDay {
  plan_day_id: number;
  plan_id: number;
  day_number: number;
  book_name: string;
  chapter: number;
  verse_start?: number;
  verse_end?: number;
  reading_order: number;
}

// User Reading Plan Subscription
export interface IUserReadingPlanSubscription {
  subscription_id: number;
  user_id: number;
  plan_id: number;
  start_date: Date;
  current_day: number;
  completed: boolean;
  completion_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
