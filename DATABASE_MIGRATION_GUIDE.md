# Database Migration Guide - Parish Nexus Flow

Complete guide for migrating the Parish Nexus Flow database to a test server or production environment.

**Database Type:** Microsoft SQL Server
**Last Updated:** 2025-10-25
**Document Version:** 1.0

---

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Step 1: Create Database Schema](#step-1-create-database-schema)
4. [Step 2: Insert System Seed Data](#step-2-insert-system-seed-data)
5. [Step 3: Insert Sample/Test Data](#step-3-insert-sample-test-data)
6. [Step 4: Verify Migration](#step-4-verify-migration)
7. [Environment Configuration](#environment-configuration)
8. [Post-Migration Tasks](#post-migration-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Database Schema Overview

### Tables by Category

#### **Users & Authentication (5 tables)**
- `users` - Core user accounts
- `otp_codes` - OTP for passwordless login
- `email_templates` - Email templates with Handlebars
- `email_logs` - Sent email tracking
- `email_queue` - Email queue for batch processing

#### **Roles & Permissions (5 tables)**
- `roles` - Role definitions (RBAC)
- `permissions` - Permission definitions
- `role_permissions` - Maps permissions to roles
- `user_roles` - Assigns roles to users
- `user_permissions` - Direct permission grants/revokes

#### **Parish Management (6 tables)**
- `parishes` - Parish/church information
- `church_admins` - Church staff
- `wards` - Geographical divisions
- `families` - Family groups
- `parishioners` - Parish members
- `ward_roles` - Ward-specific role assignments

#### **Accounting (2 tables)**
- `account_categories` - Transaction categories (GLOBAL)
- `accounts` - Financial transactions

#### **Bible & Spiritual Resources (4 tables)**
- `daily_bible_readings` - Daily readings
- `bible_bookmarks` - User bookmarks
- `bible_reading_history` - Reading tracking
- `audiobooks` - Spiritual audio resources

#### **Prayer Requests (1 table)**
- `prayer_requests` - Prayer requests

**Total: 23 Tables**

---

## Pre-Migration Checklist

### Requirements

- [ ] SQL Server instance running (2016 or later recommended)
- [ ] Database created (e.g., `ParishNexusDB`)
- [ ] User account with `db_owner` permissions
- [ ] Backup of existing data (if migrating from another system)
- [ ] Connection string ready for application configuration

### Recommended SQL Server Configuration

```sql
-- Set database to use SQL_Latin1_General_CP1_CI_AS collation
ALTER DATABASE ParishNexusDB COLLATE SQL_Latin1_General_CP1_CI_AS;

-- Set recovery model (SIMPLE for development, FULL for production)
ALTER DATABASE ParishNexusDB SET RECOVERY SIMPLE; -- Development
-- ALTER DATABASE ParishNexusDB SET RECOVERY FULL; -- Production
```

---

## Step 1: Create Database Schema

### Run this SQL script to create all tables

```sql
-- =====================================================
-- PARISH NEXUS FLOW - DATABASE SCHEMA
-- Database Type: SQL Server
-- =====================================================

USE OurPocketChurch;
GO

-- =====================================================
-- TABLE 1: USERS
-- =====================================================

CREATE TABLE users (
  user_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  email NVARCHAR(255) UNIQUE NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  phone NVARCHAR(20),
  profile_image_url NVARCHAR(500),
  user_type NVARCHAR(50) NOT NULL CHECK (user_type IN ('super_admin', 'church_admin', 'parishioner')),
  is_active BIT DEFAULT 1,
  email_verified BIT DEFAULT 0,
  last_login DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- =====================================================
-- TABLE 2: OTP_CODES
-- =====================================================

CREATE TABLE otp_codes (
  otp_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('login', 'password_reset', 'verification')),
  delivery_method VARCHAR(10) NOT NULL CHECK (delivery_method IN ('email', 'sms')),
  phone VARCHAR(20),
  email VARCHAR(255),
  is_verified BIT DEFAULT 0,
  expires_at DATETIME2 NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE(),
  verified_at DATETIME2,
  ip_address VARCHAR(50),
  attempts INT DEFAULT 0,
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_user_type_verified ON otp_codes(user_id, otp_type, is_verified);
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);

-- =====================================================
-- TABLE 3: EMAIL_TEMPLATES
-- =====================================================

CREATE TABLE email_templates (
  template_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  template_code VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category VARCHAR(50),
  variables TEXT, -- JSON array of variable names
  description TEXT,
  is_active BIT DEFAULT 1,
  created_by BIGINT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_email_template_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- =====================================================
-- TABLE 4: EMAIL_LOGS
-- =====================================================

CREATE TABLE email_logs (
  log_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  template_id BIGINT,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  provider VARCHAR(50), -- 'smtp', 'sendgrid', 'ses'
  provider_message_id VARCHAR(255),
  error_message TEXT,
  sent_at DATETIME2,
  delivered_at DATETIME2,
  opened_at DATETIME2,
  clicked_at DATETIME2,
  variables TEXT,
  retry_count INT DEFAULT 0,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_email_log_template FOREIGN KEY (template_id) REFERENCES email_templates(template_id)
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

-- =====================================================
-- TABLE 5: EMAIL_QUEUE
-- =====================================================

CREATE TABLE email_queue (
  queue_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  template_code VARCHAR(100),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  variables TEXT,
  priority INT DEFAULT 5, -- 1=highest, 10=lowest
  scheduled_at DATETIME2,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  created_at DATETIME2 DEFAULT GETDATE(),
  processed_at DATETIME2,
  CONSTRAINT fk_email_queue_template FOREIGN KEY (template_code) REFERENCES email_templates(template_code)
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);

-- =====================================================
-- TABLE 6: PARISHES
-- =====================================================

CREATE TABLE parishes (
  parish_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_name NVARCHAR(200) NOT NULL,
  diocese NVARCHAR(200),
  address_line1 NVARCHAR(255),
  address_line2 NVARCHAR(255),
  city NVARCHAR(100),
  state NVARCHAR(100),
  country NVARCHAR(100),
  postal_code NVARCHAR(20),
  phone NVARCHAR(20),
  email NVARCHAR(255),
  website_url NVARCHAR(500),
  established_date DATE,
  patron_saint NVARCHAR(200),
  timezone NVARCHAR(50) DEFAULT 'UTC',
  subscription_plan NVARCHAR(50) CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  subscription_expiry DATE,
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

-- =====================================================
-- TABLE 7: ROLES
-- =====================================================

CREATE TABLE roles (
  role_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT,
  role_name VARCHAR(100) NOT NULL,
  role_code VARCHAR(50) NOT NULL,
  description TEXT,
  is_system_role BIT DEFAULT 0, -- System roles cannot be deleted
  is_active BIT DEFAULT 1,
  priority INT DEFAULT 0,
  role_scope VARCHAR(50) DEFAULT 'GLOBAL',
  is_ward_role BIT DEFAULT 0,
  created_by BIGINT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_role_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_role_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
  CONSTRAINT uq_role_code_parish UNIQUE (role_code, parish_id)
);

CREATE INDEX idx_roles_parish_id ON roles(parish_id);

-- =====================================================
-- TABLE 8: PERMISSIONS
-- =====================================================

CREATE TABLE permissions (
  permission_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  permission_code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- 'users', 'parishes', 'events', etc.
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_permissions_code ON permissions(permission_code);
CREATE INDEX idx_permissions_module ON permissions(module);

-- =====================================================
-- TABLE 9: ROLE_PERMISSIONS
-- =====================================================

CREATE TABLE role_permissions (
  role_permission_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  granted_by BIGINT,
  granted_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permission_granted_by FOREIGN KEY (granted_by) REFERENCES users(user_id),
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- =====================================================
-- TABLE 10: USER_ROLES
-- =====================================================

CREATE TABLE user_roles (
  user_role_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  assigned_by BIGINT,
  assigned_at DATETIME2 DEFAULT GETDATE(),
  expires_at DATETIME2,
  is_active BIT DEFAULT 1,
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
  CONSTRAINT fk_user_role_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(user_id),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- =====================================================
-- TABLE 11: USER_PERMISSIONS
-- =====================================================

CREATE TABLE user_permissions (
  user_permission_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  permission_type VARCHAR(10) NOT NULL CHECK (permission_type IN ('GRANT', 'REVOKE')),
  assigned_by BIGINT,
  assigned_at DATETIME2 DEFAULT GETDATE(),
  expires_at DATETIME2,
  reason TEXT,
  is_active BIT DEFAULT 1,
  CONSTRAINT fk_user_permission_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permission_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id),
  CONSTRAINT fk_user_permission_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(user_id),
  CONSTRAINT uq_user_permission UNIQUE (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);

-- =====================================================
-- TABLE 12: CHURCH_ADMINS
-- =====================================================

CREATE TABLE church_admins (
  church_admin_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT UNIQUE NOT NULL,
  parish_id BIGINT NOT NULL,
  role NVARCHAR(100) NOT NULL, -- 'Pastor', 'Administrator', 'Secretary'
  department NVARCHAR(100),
  permissions NVARCHAR(MAX), -- JSON array
  hire_date DATE,
  is_primary_admin BIT DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_church_admin_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_church_admin_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id)
);

CREATE INDEX idx_church_admins_user_id ON church_admins(user_id);
CREATE INDEX idx_church_admins_parish_id ON church_admins(parish_id);

-- =====================================================
-- TABLE 13: WARDS
-- =====================================================

CREATE TABLE wards (
  ward_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT NOT NULL,
  ward_name NVARCHAR(200) NOT NULL,
  ward_number NVARCHAR(50),
  description NVARCHAR(MAX),
  coordinator_id BIGINT,
  area_coverage NVARCHAR(MAX),
  total_families INT DEFAULT 0,
  total_members INT DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_ward_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_ward_coordinator FOREIGN KEY (coordinator_id) REFERENCES church_admins(church_admin_id)
);

CREATE INDEX idx_wards_parish_id ON wards(parish_id);
CREATE INDEX idx_wards_ward_number ON wards(ward_number);

-- =====================================================
-- TABLE 14: FAMILIES
-- =====================================================

CREATE TABLE families (
  family_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT NOT NULL,
  ward_id BIGINT,
  family_name NVARCHAR(200) NOT NULL,
  primary_contact_id BIGINT, -- FK will be added after parishioners table
  home_phone NVARCHAR(20),
  registration_date DATE,
  [head_of_family] NVARCHAR(200) NULL,
 address_line1 NVARCHAR(255),
    address_line2 NVARCHAR(255),
    city NVARCHAR(100),
    state NVARCHAR(100),
    country NVARCHAR(100),
    postal_code NVARCHAR(20),
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_family_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_family_ward FOREIGN KEY (ward_id) REFERENCES wards(ward_id)
);

CREATE INDEX idx_families_parish_id ON families(parish_id);
CREATE INDEX idx_families_ward_id ON families(ward_id);

-- =====================================================
-- TABLE 15: PARISHIONERS
-- =====================================================

CREATE TABLE parishioners (
  parishioner_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT UNIQUE NOT NULL,
  parish_id BIGINT NOT NULL,
  ward_id BIGINT,
  family_id BIGINT,
  middle_name NVARCHAR(100),
  date_of_birth DATE,
  gender NVARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  marital_status NVARCHAR(50) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated')),
  occupation NVARCHAR(200),
  baptism_date DATE,
  first_communion_date DATE,
  confirmation_date DATE,
  marriage_date DATE,
  member_status NVARCHAR(50) DEFAULT 'active' CHECK (member_status IN ('active', 'inactive', 'visitor')),
  photo_url NVARCHAR(500),
  address_line1 NVARCHAR(255),
  address_line2 NVARCHAR(255),
  city NVARCHAR(100),
  state NVARCHAR(100),
  country NVARCHAR(100),
  postal_code NVARCHAR(20),
  emergency_contact_name NVARCHAR(200),
  emergency_contact_phone NVARCHAR(20),
  notes NVARCHAR(MAX),
    phone  VARCHAR(20) NULL,
 last_name VARCHAR(100) NULL,
 first_name VARCHAR(100) NULL,
  email VARCHAR(255) NULL,

  registration_date DATE,
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_parishioner_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_parishioner_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_parishioner_ward FOREIGN KEY (ward_id) REFERENCES wards(ward_id),
  CONSTRAINT fk_parishioner_family FOREIGN KEY (family_id) REFERENCES families(family_id)
);

CREATE INDEX idx_parishioners_user_id ON parishioners(user_id);
CREATE INDEX idx_parishioners_parish_id ON parishioners(parish_id);
CREATE INDEX idx_parishioners_ward_id ON parishioners(ward_id);
CREATE INDEX idx_parishioners_family_id ON parishioners(family_id);

-- Add foreign key constraint for families.primary_contact_id after parishioners table is created
ALTER TABLE families
ADD CONSTRAINT fk_family_primary_contact FOREIGN KEY (primary_contact_id) REFERENCES parishioners(parishioner_id);

-- =====================================================
-- TABLE 16: WARD_ROLES
-- =====================================================

CREATE TABLE ward_roles (
  ward_role_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  ward_id BIGINT NOT NULL,
  parishioner_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  is_primary BIT DEFAULT 0,
  assigned_by BIGINT,
  assigned_at DATETIME2 DEFAULT GETDATE(),
  expires_at DATETIME2,
  is_active BIT DEFAULT 1,
  notes TEXT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_ward_role_ward FOREIGN KEY (ward_id) REFERENCES wards(ward_id),
  CONSTRAINT fk_ward_role_parishioner FOREIGN KEY (parishioner_id) REFERENCES parishioners(parishioner_id),
  CONSTRAINT fk_ward_role_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
  CONSTRAINT fk_ward_role_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(user_id),
  CONSTRAINT uq_ward_role UNIQUE (ward_id, parishioner_id, role_id)
);

-- =====================================================
-- TABLE 17: ACCOUNT_CATEGORIES (GLOBAL)
-- =====================================================

CREATE TABLE account_categories (
  category_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('income', 'expense')),
  description TEXT,
  is_active BIT DEFAULT 1,
  is_system BIT DEFAULT 1, -- System categories cannot be deleted
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT uq_category_name_type UNIQUE (category_name, category_type)
);

-- =====================================================
-- TABLE 18: ACCOUNTS
-- =====================================================

CREATE TABLE accounts (
  account_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category_id BIGINT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  payment_method VARCHAR(50),
  balance_after DECIMAL(15,2),
  created_by BIGINT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_account_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_account_category FOREIGN KEY (category_id) REFERENCES account_categories(category_id),
  CONSTRAINT fk_account_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE INDEX idx_accounts_parish_id ON accounts(parish_id);
CREATE INDEX idx_accounts_transaction_date ON accounts(transaction_date);
CREATE INDEX idx_accounts_transaction_type ON accounts(transaction_type);

-- =====================================================
-- TABLE 19: DAILY_BIBLE_READINGS
-- =====================================================

CREATE TABLE daily_bible_readings (
  reading_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT NOT NULL,
  reading_date DATE NOT NULL,
  book_name VARCHAR(100) NOT NULL,
  chapter INT NOT NULL,
  verse_start INT,
  verse_end INT,
  translation VARCHAR(20) DEFAULT 'kjv',
  title VARCHAR(255),
  content TEXT,
  is_active BIT DEFAULT 1,
  created_by BIGINT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_bible_reading_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_bible_reading_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
  CONSTRAINT uq_parish_reading_date UNIQUE (parish_id, reading_date)
);

CREATE INDEX idx_bible_readings_parish_id ON daily_bible_readings(parish_id);
CREATE INDEX idx_bible_readings_reading_date ON daily_bible_readings(reading_date);

-- =====================================================
-- TABLE 20: BIBLE_BOOKMARKS
-- =====================================================

CREATE TABLE bible_bookmarks (
  bookmark_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT NOT NULL,
  book_name VARCHAR(100) NOT NULL,
  chapter INT NOT NULL,
  verse_start INT,
  verse_end INT,
  translation VARCHAR(20) DEFAULT 'kjv',
  note TEXT,
  highlight_color VARCHAR(20),
  is_favorite BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_bookmarks_user_id ON bible_bookmarks(user_id);
CREATE INDEX idx_bookmarks_user_book_chapter ON bible_bookmarks(user_id, book_name, chapter);

-- =====================================================
-- TABLE 21: BIBLE_READING_HISTORY
-- =====================================================

CREATE TABLE bible_reading_history (
  history_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  user_id BIGINT NOT NULL,
  book_name VARCHAR(100) NOT NULL,
  chapter INT NOT NULL,
  verse_start INT,
  verse_end INT,
  translation VARCHAR(20) DEFAULT 'kjv',
  reading_date DATE NOT NULL,
  reading_duration_seconds INT,
  completed BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_reading_history_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_reading_history_user_id ON bible_reading_history(user_id);
CREATE INDEX idx_reading_history_reading_date ON bible_reading_history(reading_date);
CREATE INDEX idx_reading_history_user_date ON bible_reading_history(user_id, reading_date);

-- =====================================================
-- TABLE 22: AUDIOBOOKS
-- =====================================================

CREATE TABLE audiobooks (
  audiobook_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  narrator VARCHAR(255),
  description TEXT,
  thumbnail_url VARCHAR(500),
  audio_file_url VARCHAR(500),
  duration_minutes INT,
  file_size_mb DECIMAL(10,2),
  category VARCHAR(100),
  language VARCHAR(50) DEFAULT 'English',
  publication_year INT,
  is_active BIT DEFAULT 1,
  created_by BIGINT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_audiobook_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_audiobook_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE INDEX idx_audiobooks_parish_id ON audiobooks(parish_id);
CREATE INDEX idx_audiobooks_is_active ON audiobooks(is_active);
CREATE INDEX idx_audiobooks_category ON audiobooks(category);

-- =====================================================
-- TABLE 23: PRAYER_REQUESTS
-- =====================================================

CREATE TABLE prayer_requests (
  prayer_request_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
  parish_id BIGINT NOT NULL,
  requested_by BIGINT,
  requester_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  booking_date DATE,
  booking_time TIME,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  is_anonymous BIT DEFAULT 0,
  is_urgent BIT DEFAULT 0,
  is_public BIT DEFAULT 1,
  approved_by BIGINT,
  notes TEXT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_prayer_request_parish FOREIGN KEY (parish_id) REFERENCES parishes(parish_id),
  CONSTRAINT fk_prayer_request_requested_by FOREIGN KEY (requested_by) REFERENCES parishioners(parishioner_id),
  CONSTRAINT fk_prayer_request_approved_by FOREIGN KEY (approved_by) REFERENCES church_admins(church_admin_id)
);

CREATE INDEX idx_prayer_requests_parish_id ON prayer_requests(parish_id);
CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX idx_prayer_requests_booking_date ON prayer_requests(booking_date);

GO
CREATE TABLE deleted_parish (
    deleted_id BIGINT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    parish_id BIGINT NOT NULL,
    parish_name NVARCHAR(200) NOT NULL,
    diocese NVARCHAR(200),
    address_line1 NVARCHAR(255),
    address_line2 NVARCHAR(255),
    city NVARCHAR(100),
    state NVARCHAR(100),
    country NVARCHAR(100),
    postal_code NVARCHAR(20),
    phone NVARCHAR(20),
    email NVARCHAR(255),
    website_url NVARCHAR(500),
    established_date DATE,
    patron_saint NVARCHAR(200),
    timezone NVARCHAR(50),
    subscription_plan NVARCHAR(50),
    subscription_expiry DATE,
    deleted_reason NVARCHAR(255),
    deleted_by BIGINT,
    deleted_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2,
    updated_at DATETIME2,
    CONSTRAINT FK_deleted_parish_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id)
);

-- Optional comment
EXEC sys.sp_addextendedproperty 
    @name = N'MS_Descriptio_

PRINT 'Database schema created successfully!';
```

---

## Step 2: Insert System Seed Data

### REQUIRED SEED DATA - Run these in order

#### 2.1 System Roles

```sql
-- =====================================================
-- SYSTEM ROLES (Required for application to function)
-- =====================================================

SET IDENTITY_INSERT roles ON;

INSERT INTO roles (role_id, parish_id, role_name, role_code, description, is_system_role, is_active, priority, role_scope, is_ward_role)
VALUES
  -- System Roles (ID 1-10)
  (1, NULL, 'Super Admin', 'SUPER_ADMIN', 'System administrator with full access to all features and parishes', 1, 1, 10, 'GLOBAL', 0),
  (2, NULL, 'Church Admin', 'CHURCH_ADMIN', 'Parish administrator with extended permissions to manage parish', 1, 1, 5, 'PARISH', 0),
  (3, NULL, 'Family Member', 'FAMILY_MEMBER', 'Regular parish member with basic access to view and manage their own profile', 1, 1, 1, 'PARISH', 0),

  -- Ward Roles (ID 11-20)
  (11, NULL, 'Ward Convener', 'WARD_CONVENER', 'Leader of the ward with overall responsibility', 1, 1, 7, 'WARD', 1);

SET IDENTITY_INSERT roles OFF;

PRINT 'System roles inserted successfully!';
```

#### 2.2 System Permissions

```sql
-- =====================================================
-- SYSTEM PERMISSIONS (Granular access control)
-- =====================================================

SET IDENTITY_INSERT permissions ON;

INSERT INTO permissions (permission_id, permission_name, permission_code, description, module, action, is_active)
VALUES
  -- Profile Permissions (1-10)
  (1, 'View Own Profile', 'VIEW_OWN_PROFILE', 'Can view their own profile', 'Profile', 'view', 1),
  (2, 'Edit Own Profile', 'EDIT_OWN_PROFILE', 'Can edit their own profile information', 'Profile', 'edit', 1),

  -- User Management (11-20)
  (11, 'View All Users', 'VIEW_ALL_USERS', 'Can view all user accounts', 'Users', 'view', 1),
  (12, 'Create User', 'CREATE_USER', 'Can create new user accounts', 'Users', 'create', 1),
  (13, 'Edit User', 'EDIT_USER', 'Can edit user accounts', 'Users', 'edit', 1),
  (14, 'Delete User', 'DELETE_USER', 'Can delete user accounts', 'Users', 'delete', 1),
  (15, 'Manage User Roles', 'MANAGE_USER_ROLES', 'Can assign/revoke roles to users', 'Users', 'manage', 1),

  -- Parish Management (21-30)
  (21, 'View Parishes', 'VIEW_PARISHES', 'Can view parish information', 'Parishes', 'view', 1),
  (22, 'Create Parish', 'CREATE_PARISH', 'Can create new parishes', 'Parishes', 'create', 1),
  (23, 'Edit Parish', 'EDIT_PARISH', 'Can edit parish information', 'Parishes', 'edit', 1),
  (24, 'Delete Parish', 'DELETE_PARISH', 'Can delete parishes', 'Parishes', 'delete', 1),
  (25, 'Manage Parish Settings', 'MANAGE_PARISH_SETTINGS', 'Can manage parish configuration', 'Parishes', 'manage', 1),

  -- Parishioner Management (31-40)
  (31, 'View Parishioners', 'VIEW_PARISHIONERS', 'Can view parishioner records', 'Parishioners', 'view', 1),
  (32, 'Create Parishioner', 'CREATE_PARISHIONER', 'Can create parishioner records', 'Parishioners', 'create', 1),
  (33, 'Edit Parishioner', 'EDIT_PARISHIONER', 'Can edit parishioner records', 'Parishioners', 'edit', 1),
  (34, 'Delete Parishioner', 'DELETE_PARISHIONER', 'Can delete parishioner records', 'Parishioners', 'delete', 1),
  (35, 'Manage Parishioners', 'MANAGE_PARISHIONERS', 'Full management of parishioner records', 'Parishioners', 'manage', 1),

  -- Family Management (41-50)
  (41, 'View Families', 'VIEW_FAMILIES', 'Can view family records', 'Families', 'view', 1),
  (42, 'Create Family', 'CREATE_FAMILY', 'Can create family records', 'Families', 'create', 1),
  (43, 'Edit Family', 'EDIT_FAMILY', 'Can edit family records', 'Families', 'edit', 1),
  (44, 'Delete Family', 'DELETE_FAMILY', 'Can delete family records', 'Families', 'delete', 1),
  (45, 'Manage Families', 'MANAGE_FAMILIES', 'Full management of family records', 'Families', 'manage', 1),

  -- Ward Management (51-60)
  (51, 'View Wards', 'VIEW_WARDS', 'Can view ward information', 'Wards', 'view', 1),
  (52, 'Create Ward', 'CREATE_WARD', 'Can create new wards', 'Wards', 'create', 1),
  (53, 'Edit Ward', 'EDIT_WARD', 'Can edit ward information', 'Wards', 'edit', 1),
  (54, 'Delete Ward', 'DELETE_WARD', 'Can delete wards', 'Wards', 'delete', 1),
  (55, 'Manage Wards', 'MANAGE_WARDS', 'Full management of wards', 'Wards', 'manage', 1),
  (56, 'Assign Ward Roles', 'ASSIGN_WARD_ROLES', 'Can assign roles to ward members', 'Wards', 'manage', 1),

  -- Accounting (61-70)
  (61, 'View Accounts', 'VIEW_ACCOUNTS', 'Can view financial transactions', 'Accounting', 'view', 1),
  (62, 'Create Transaction', 'CREATE_TRANSACTION', 'Can create financial transactions', 'Accounting', 'create', 1),
  (63, 'Edit Transaction', 'EDIT_TRANSACTION', 'Can edit financial transactions', 'Accounting', 'edit', 1),
  (64, 'Delete Transaction', 'DELETE_TRANSACTION', 'Can delete financial transactions', 'Accounting', 'delete', 1),
  (65, 'Manage Accounts', 'MANAGE_ACCOUNTS', 'Full accounting management', 'Accounting', 'manage', 1),
  (66, 'View Financial Reports', 'VIEW_FINANCIAL_REPORTS', 'Can view financial reports', 'Accounting', 'view', 1),
  (67, 'Export Financial Data', 'EXPORT_FINANCIAL_DATA', 'Can export financial data', 'Accounting', 'export', 1),

  -- Events & Activities (71-80)
  (71, 'View Events', 'VIEW_EVENTS', 'Can view parish events', 'Events', 'view', 1),
  (72, 'Create Event', 'CREATE_EVENT', 'Can create new events', 'Events', 'create', 1),
  (73, 'Edit Event', 'EDIT_EVENT', 'Can edit events', 'Events', 'edit', 1),
  (74, 'Delete Event', 'DELETE_EVENT', 'Can delete events', 'Events', 'delete', 1),
  (75, 'Manage Events', 'MANAGE_EVENTS', 'Full event management', 'Events', 'manage', 1),

  -- Prayer Requests (81-90)
  (81, 'View Prayer Requests', 'VIEW_PRAYER_REQUESTS', 'Can view prayer requests', 'Prayers', 'view', 1),
  (82, 'Create Prayer Request', 'CREATE_PRAYER_REQUEST', 'Can submit prayer requests', 'Prayers', 'create', 1),
  (83, 'Approve Prayer Requests', 'APPROVE_PRAYER_REQUESTS', 'Can approve/reject prayer requests', 'Prayers', 'approve', 1),
  (84, 'Manage Prayer Requests', 'MANAGE_PRAYER_REQUESTS', 'Full prayer request management', 'Prayers', 'manage', 1),

  -- Bible & Spiritual Resources (91-100)
  (91, 'View Bible', 'VIEW_BIBLE', 'Can access Bible reader', 'Bible', 'view', 1),
  (92, 'Manage Daily Readings', 'MANAGE_DAILY_READINGS', 'Can configure daily Bible readings', 'Bible', 'manage', 1),
  (93, 'View Audiobooks', 'VIEW_AUDIOBOOKS', 'Can access audiobooks', 'Audiobooks', 'view', 1),
  (94, 'Manage Audiobooks', 'MANAGE_AUDIOBOOKS', 'Can upload and manage audiobooks', 'Audiobooks', 'manage', 1),

  -- Roles & Permissions (101-110)
  (101, 'View Roles', 'VIEW_ROLES', 'Can view roles', 'Roles', 'view', 1),
  (102, 'Create Role', 'CREATE_ROLE', 'Can create custom roles', 'Roles', 'create', 1),
  (103, 'Edit Role', 'EDIT_ROLE', 'Can edit roles', 'Roles', 'edit', 1),
  (104, 'Delete Role', 'DELETE_ROLE', 'Can delete roles', 'Roles', 'delete', 1),
  (105, 'Manage Roles', 'MANAGE_ROLES', 'Full role management', 'Roles', 'manage', 1),
  (106, 'Manage Permissions', 'MANAGE_PERMISSIONS', 'Can assign/revoke permissions', 'Permissions', 'manage', 1),

  -- Email & Communication (111-120)
  (111, 'Send Emails', 'SEND_EMAILS', 'Can send emails to parishioners', 'Communication', 'send', 1),
  (112, 'Manage Email Templates', 'MANAGE_EMAIL_TEMPLATES', 'Can create and edit email templates', 'Communication', 'manage', 1),
  (113, 'View Email Logs', 'VIEW_EMAIL_LOGS', 'Can view email sending history', 'Communication', 'view', 1),

  -- System Administration (121-130)
  (121, 'View System Logs', 'VIEW_SYSTEM_LOGS', 'Can view system logs', 'System', 'view', 1),
  (122, 'Manage System Settings', 'MANAGE_SYSTEM_SETTINGS', 'Can configure system settings', 'System', 'manage', 1),
  (123, 'View Analytics', 'VIEW_ANALYTICS', 'Can view analytics and reports', 'Analytics', 'view', 1);

SET IDENTITY_INSERT permissions OFF;

PRINT 'System permissions inserted successfully!';
```

#### 2.3 Role-Permission Mappings

```sql
-- =====================================================
-- ROLE-PERMISSION MAPPINGS
-- =====================================================

-- SUPER ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions WHERE is_active = 1;

-- CHURCH ADMIN: Parish management permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  -- Profile
  (2, 1), (2, 2),
  -- Users (view only)
  (2, 11),
  -- Parishes (view own)
  (2, 21), (2, 23), (2, 25),
  -- Parishioners (full management)
  (2, 31), (2, 32), (2, 33), (2, 34), (2, 35),
  -- Families (full management)
  (2, 41), (2, 42), (2, 43), (2, 44), (2, 45),
  -- Wards (full management)
  (2, 51), (2, 52), (2, 53), (2, 54), (2, 55), (2, 56),
  -- Accounting (full management)
  (2, 61), (2, 62), (2, 63), (2, 64), (2, 65), (2, 66), (2, 67),
  -- Events
  (2, 71), (2, 72), (2, 73), (2, 74), (2, 75),
  -- Prayer Requests
  (2, 81), (2, 83), (2, 84),
  -- Bible
  (2, 91), (2, 92),
  -- Audiobooks
  (2, 93), (2, 94),
  -- Roles (view only)
  (2, 101),
  -- Email
  (2, 111), (2, 112), (2, 113),
  -- Analytics
  (2, 123);

-- PARISH PRIEST: Spiritual and administrative
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  -- Profile
  (3, 1), (3, 2),
  -- Parishioners (view and edit)
  (3, 31), (3, 33),
  -- Families (view)
  (3, 41),
  -- Wards (view)
  (3, 51),
  -- Accounting (view)
  (3, 61), (3, 66),
  -- Events (full)
  (3, 71), (3, 72), (3, 73), (3, 74), (3, 75),
  -- Prayer Requests (full)
  (3, 81), (3, 83), (3, 84),
  -- Bible
  (3, 91), (3, 92),
  -- Audiobooks
  (3, 93), (3, 94),
  -- Email
  (3, 111),
  -- Analytics
  (3, 123);

-- FAMILY MEMBER (Parishioner): Basic permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  -- Profile
  (4, 1), (4, 2),
  -- Events (view only)
  (4, 71),
  -- Prayer Requests (view and create own)
  (4, 81), (4, 82),
  -- Bible
  (4, 91),
  -- Audiobooks (view)
  (4, 93);


PRINT 'Role-permission mappings created successfully!';
```

#### 2.4 Account Categories (GLOBAL)

```sql
-- =====================================================
-- ACCOUNT CATEGORIES (Shared by all parishes)
-- =====================================================

SET IDENTITY_INSERT account_categories ON;

INSERT INTO account_categories (category_id, category_name, category_type, description, is_system, is_active)
VALUES
  -- INCOME CATEGORIES (1-20)
  (1, 'Sunday Collection', 'income', 'Regular Sunday mass collection', 1, 1),
  (2, 'Special Collection', 'income', 'Special collections for specific purposes', 1, 1),
  (3, 'Tithe', 'income', 'Tithe offerings from parishioners', 1, 1),
  (4, 'Donations', 'income', 'General donations to the parish', 1, 1),
  (5, 'Building Fund', 'income', 'Contributions to building/renovation fund', 1, 1),
  (6, 'Mass Stipends', 'income', 'Offerings for mass intentions', 1, 1),
  (7, 'Sacrament Fees', 'income', 'Fees for baptism, marriage, etc.', 1, 1),
  (8, 'Hall Rental', 'income', 'Income from renting parish hall', 1, 1),
  (9, 'Fundraising Events', 'income', 'Income from parish events', 1, 1),
  (10, 'Subscription/Membership', 'income', 'Annual membership fees', 1, 1),
  (11, 'Candle Offerings', 'income', 'Offerings for lighting candles', 1, 1),
  (12, 'Cemetery Services', 'income', 'Cemetery maintenance and services', 1, 1),
  (13, 'Investment Income', 'income', 'Income from investments', 1, 1),
  (14, 'Grant/Aid', 'income', 'Grants and external aid received', 1, 1),
  (15, 'Sale of Publications', 'income', 'Income from books, bulletins, etc.', 1, 1),

  -- EXPENSE CATEGORIES (21-60)
  (21, 'Clergy Compensation', 'expense', 'Salaries and benefits for clergy', 1, 1),
  (22, 'Staff Salaries', 'expense', 'Salaries for parish staff', 1, 1),
  (23, 'Utilities', 'expense', 'Electricity, water, gas bills', 1, 1),
  (24, 'Building Maintenance', 'expense', 'Repairs and upkeep of buildings', 1, 1),
  (25, 'Office Supplies', 'expense', 'Stationery, printing, etc.', 1, 1),
  (26, 'Liturgical Supplies', 'expense', 'Candles, incense, vestments, etc.', 1, 1),
  (27, 'Cleaning Supplies', 'expense', 'Cleaning materials and services', 1, 1),
  (28, 'Insurance', 'expense', 'Property, liability, health insurance', 1, 1),
  (29, 'Property Tax', 'expense', 'Property taxes and fees', 1, 1),
  (30, 'Loan Payments', 'expense', 'Mortgage and loan repayments', 1, 1),
  (31, 'Charity & Outreach', 'expense', 'Charitable programs and donations', 1, 1),
  (32, 'Education Programs', 'expense', 'Religious education, catechism', 1, 1),
  (33, 'Youth Ministry', 'expense', 'Youth programs and activities', 1, 1),
  (34, 'Music Ministry', 'expense', 'Choir, instruments, music', 1, 1),
  (35, 'Communications', 'expense', 'Phone, internet, website', 1, 1),
  (36, 'Diocesan Assessment', 'expense', 'Payments to diocese', 1, 1),
  (37, 'Professional Fees', 'expense', 'Legal, accounting, consulting', 1, 1),
  (38, 'Food & Refreshments', 'expense', 'For events and gatherings', 1, 1),
  (39, 'Transportation', 'expense', 'Vehicle maintenance, fuel', 1, 1),
  (40, 'Books & Publications', 'expense', 'Religious books, bulletins', 1, 1),
  (41, 'Technology', 'expense', 'Computers, software, AV equipment', 1, 1),
  (42, 'Advertising', 'expense', 'Marketing and outreach materials', 1, 1),
  (43, 'Bank Charges', 'expense', 'Banking fees and charges', 1, 1),
  (44, 'Groundskeeping', 'expense', 'Lawn care, landscaping', 1, 1),
  (45, 'Security', 'expense', 'Security services and systems', 1, 1),
  (46, 'Special Events', 'expense', 'Costs for parish events', 1, 1),
  (47, 'Mission Support', 'expense', 'Support for mission activities', 1, 1),
  (48, 'Repairs & Renovations', 'expense', 'Major repairs and upgrades', 1, 1),
  (49, 'Furniture & Fixtures', 'expense', 'Purchase of furniture', 1, 1),
  (50, 'Miscellaneous', 'expense', 'Other expenses', 1, 1);

SET IDENTITY_INSERT account_categories OFF;

PRINT 'Account categories inserted successfully!';
```

#### 2.5 Default Email Templates

```sql
-- =====================================================
-- DEFAULT EMAIL TEMPLATES
-- =====================================================

SET IDENTITY_INSERT email_templates ON;

INSERT INTO email_templates (template_id, template_code, template_name, subject, body_html, body_text, category, variables, description, is_active)
VALUES
  (1, 'OTP_LOGIN', 'OTP for Login', 'Your Login OTP - {{parishName}}',
   '<html><body><h2>Your Login OTP</h2><p>Hello {{firstName}},</p><p>Your OTP code is: <strong>{{otpCode}}</strong></p><p>This code will expire in {{expiryMinutes}} minutes.</p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>{{parishName}}</p></body></html>',
   'Hello {{firstName}}, Your OTP code is: {{otpCode}}. This code will expire in {{expiryMinutes}} minutes.',
   'Authentication', '["firstName", "otpCode", "expiryMinutes", "parishName"]', 'OTP code for passwordless login', 1),

  (2, 'OTP_PASSWORD_RESET', 'OTP for Password Reset', 'Reset Your Password - {{parishName}}',
   '<html><body><h2>Password Reset Request</h2><p>Hello {{firstName}},</p><p>You requested to reset your password. Your OTP code is: <strong>{{otpCode}}</strong></p><p>This code will expire in {{expiryMinutes}} minutes.</p><p>If you did not request this, please contact support immediately.</p><p>Best regards,<br>{{parishName}}</p></body></html>',
   'Hello {{firstName}}, Your password reset OTP is: {{otpCode}}. Expires in {{expiryMinutes}} minutes.',
   'Authentication', '["firstName", "otpCode", "expiryMinutes", "parishName"]', 'OTP for password reset', 1),

  (3, 'WELCOME_PARISHIONER', 'Welcome to Parish', 'Welcome to {{parishName}}!',
   '<html><body><h2>Welcome to {{parishName}}!</h2><p>Dear {{firstName}} {{lastName}},</p><p>Welcome to our parish community! We are delighted to have you join us.</p><p>Your account has been created successfully. You can now log in to access parish services, view events, and stay connected.</p><p>God bless you,<br>{{parishName}}</p></body></html>',
   'Dear {{firstName}} {{lastName}}, Welcome to {{parishName}}! Your account has been created successfully.',
   'Welcome', '["firstName", "lastName", "parishName"]', 'Welcome email for new parishioners', 1),

  (4, 'PASSWORD_CHANGED', 'Password Changed', 'Your Password Has Been Changed - {{parishName}}',
   '<html><body><h2>Password Changed</h2><p>Hello {{firstName}},</p><p>Your password was successfully changed on {{changeDate}}.</p><p>If you did not make this change, please contact support immediately.</p><p>Best regards,<br>{{parishName}}</p></body></html>',
   'Hello {{firstName}}, Your password was changed on {{changeDate}}. Contact support if this was not you.',
   'Security', '["firstName", "changeDate", "parishName"]', 'Notification for password change', 1),

  (5, 'PRAYER_REQUEST_SUBMITTED', 'Prayer Request Received', 'Your Prayer Request Has Been Received',
   '<html><body><h2>Prayer Request Received</h2><p>Dear {{requesterName}},</p><p>Thank you for submitting your prayer request. Our parish community will remember you in our prayers.</p><p><strong>Subject:</strong> {{subject}}</p><p>May God bless you abundantly.</p><p>{{parishName}}</p></body></html>',
   'Dear {{requesterName}}, Your prayer request has been received. Subject: {{subject}}. God bless you.',
   'Prayer', '["requesterName", "subject", "parishName"]', 'Confirmation of prayer request submission', 1),

  (6, 'EVENT_REMINDER', 'Upcoming Event Reminder', 'Reminder: {{eventName}} - {{eventDate}}',
   '<html><body><h2>Event Reminder</h2><p>Dear {{firstName}},</p><p>This is a reminder about the upcoming event:</p><p><strong>{{eventName}}</strong></p><p><strong>Date:</strong> {{eventDate}}</p><p><strong>Time:</strong> {{eventTime}}</p><p><strong>Location:</strong> {{eventLocation}}</p><p>We look forward to seeing you there!</p><p>{{parishName}}</p></body></html>',
   'Event Reminder: {{eventName}} on {{eventDate}} at {{eventTime}}. Location: {{eventLocation}}.',
   'Events', '["firstName", "eventName", "eventDate", "eventTime", "eventLocation", "parishName"]', 'Reminder for upcoming parish events', 1);

SET IDENTITY_INSERT email_templates OFF;

PRINT 'Email templates inserted successfully!';
```

---

## Step 3: Insert Sample/Test Data

### Sample Data for Testing (Optional but Recommended)

```sql
-- =====================================================
-- SAMPLE TEST DATA
-- =====================================================

-- Sample Parish
SET IDENTITY_INSERT parishes ON;

INSERT INTO parishes (parish_id, parish_name, diocese, address_line1, city, state, country, postal_code, phone, email, website_url, established_date, patron_saint, timezone, subscription_plan, is_active)
VALUES
  (1, 'St. Mary''s Cathedral', 'Archdiocese of Example', '123 Main Street', 'Example City', 'EX', 'USA', '12345', '+1-555-0100', 'contact@stmarys.org', 'https://www.stmarys.org', '1950-01-15', 'St. Mary', 'America/New_York', 'premium', 1);

SET IDENTITY_INSERT parishes OFF;

PRINT 'Sample parish created!';

-- Sample Super Admin User
SET IDENTITY_INSERT users ON;

INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, user_type, is_active, email_verified)
VALUES
  -- Password: Admin@123
  (1, 'admin@parishnexus.com', '$2a$10$YourHashedPasswordHere', 'System', 'Administrator', '+1-555-0001', 'super_admin', 1, 1);

SET IDENTITY_INSERT users OFF;

PRINT 'Sample super admin user created (Please update password hash!)';

-- Assign role to super admin
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (1, 1, GETDATE());

PRINT 'Role assigned to super admin!';

-- Sample Wards
SET IDENTITY_INSERT wards ON;

INSERT INTO wards (ward_id, parish_id, ward_name, ward_number, description, is_active)
VALUES
  (1, 1, 'St. Joseph Ward', '1', 'First ward of the parish', 1),
  (2, 1, 'St. Francis Ward', '2', 'Second ward of the parish', 1),
  (3, 1, 'St. Teresa Ward', '3', 'Third ward of the parish', 1);

SET IDENTITY_INSERT wards OFF;

PRINT 'Sample wards created!';
```

---

## Step 4: Verify Migration

### Verification Queries

```sql
-- Check table counts
SELECT 'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'parishes', COUNT(*) FROM parishes
UNION ALL
SELECT 'account_categories', COUNT(*) FROM account_categories
UNION ALL
SELECT 'email_templates', COUNT(*) FROM email_templates;

-- Verify system roles
SELECT role_id, role_code, role_name, is_system_role, is_ward_role, priority
FROM roles
WHERE is_system_role = 1
ORDER BY priority DESC;

-- Verify permissions per role
SELECT r.role_code, COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_code
ORDER BY permission_count DESC;

-- Check foreign key constraints
SELECT
    OBJECT_NAME(f.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME (f.referenced_object_id) AS ReferenceTableName,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferenceColumnName
FROM sys.foreign_keys AS f
INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
ORDER BY TableName;
```

### Expected Results

- **Tables:** 23 tables created
- **System Roles:** 14 roles (4 system + 10 ward roles)
- **Permissions:** 123 permissions
- **Role-Permission Mappings:**
  - Super Admin: 123 permissions
  - Church Admin: ~50 permissions
  - Parish Priest: ~25 permissions
  - Family Member: ~6 permissions
- **Account Categories:** 50 categories (15 income + 35 expense)
- **Email Templates:** 6 templates

---

## Environment Configuration

### Update .env File

```env
# Database Configuration
DB_SERVER=your-sql-server-host
DB_PORT=1433
DB_DATABASE=ParishNexusDB
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# JWT Configuration
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=30d

# Environment
NODE_ENV=production

# Email Configuration (AWS SES or SMTP)
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_SES_SENDER_EMAIL=noreply@yourdomain.com

# Optional: SMTP Configuration
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-password

# Application
PORT=5000
API_PREFIX=/api/v1

# Bible API Configuration
BIBLE_API_KEY=your-bible-api-key
```

---

## Post-Migration Tasks

### 1. Create First Super Admin User

```sql
-- Update the password hash for the default admin user
-- Use bcrypt to hash your password (rounds=10)
-- Example: bcrypt.hash('YourSecurePassword123!', 10)

UPDATE users
SET password_hash = '$2a$10$YOUR_HASHED_PASSWORD_HERE'
WHERE user_id = 1;
```

### 2. Test Database Connection

```bash
# Run from your project directory
npm run dev

# You should see:
# Database connected successfully!
# Server running on port 5000
```

### 3. Test API Endpoints

```bash
# Test registration
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "parishioner",
    "parish_id": 1
  }'

# Test login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@parishnexus.com",
    "password": "Admin@123"
  }'
```

### 4. Set Up Scheduled Jobs (Optional)

If using email queue or background jobs:

```sql
-- Create a SQL Server Agent Job to process email queue every 5 minutes
-- Or use Node.js cron jobs in your application
```

### 5. Configure Backups

```sql
-- Set up automated backups (Full backup weekly, differential daily)
BACKUP DATABASE ParishNexusDB
TO DISK = 'C:\Backups\ParishNexusDB_Full.bak'
WITH INIT, COMPRESSION, STATS = 10;
```

---

## Troubleshooting

### Common Issues

#### 1. Foreign Key Constraint Errors

```sql
-- Check if tables were created in the correct order
-- If not, drop and recreate following the order in Step 1
```

#### 2. Permission Denied Errors

```sql
-- Grant necessary permissions to database user
USE ParishNexusDB;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [your_db_user];
GO
```

#### 3. Identity Insert Errors

```sql
-- If you get identity insert errors, ensure you're using:
SET IDENTITY_INSERT table_name ON;
-- ... your INSERT statements ...
SET IDENTITY_INSERT table_name OFF;
```

#### 4. Connection Timeout

Update connection settings in [src/config/database.ts](src/config/database.ts):

```typescript
const config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000, // Increase if needed
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};
```

---

## Migration Checklist

- [ ] SQL Server instance configured
- [ ] Database created (ParishNexusDB)
- [ ] All 23 tables created successfully
- [ ] System roles inserted (14 roles)
- [ ] Permissions inserted (123 permissions)
- [ ] Role-permission mappings created
- [ ] Account categories inserted (50 categories)
- [ ] Email templates inserted (6 templates)
- [ ] Sample parish created
- [ ] Super admin user created and password hash updated
- [ ] Super admin role assigned
- [ ] Database connection tested from application
- [ ] .env file configured correctly
- [ ] API endpoints tested successfully
- [ ] Foreign key constraints verified
- [ ] Indexes created
- [ ] Backup strategy configured

---

## Next Steps

1. **Create Additional Parishes:** Use the Parish API to create more parishes
2. **Add Church Admins:** Register users with `user_type: 'church_admin'`
3. **Import Parishioners:** Use bulk import or API to add parishioners
4. **Configure Email Templates:** Customize email templates for your needs
5. **Set Up Custom Roles:** Create parish-specific roles if needed
6. **Test All Features:** Verify all modules work correctly
7. **Monitor Performance:** Check query performance and optimize if needed

---

## Support

For issues or questions:
- Review the codebase documentation
- Check logs in `logs/` directory
- Verify environment configuration
- Test queries directly in SQL Server Management Studio

---

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Prepared by:** Parish Nexus Flow Development Team
