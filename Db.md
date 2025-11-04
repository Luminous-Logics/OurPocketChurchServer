-- PostgreSQL Database Schema for Church Management System

-- Create users table
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image_url VARCHAR(500),
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('super_admin', 'church_admin', 'parishioner')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parishes table
CREATE TABLE parishes (
    parish_id BIGSERIAL PRIMARY KEY,
    parish_name VARCHAR(200) NOT NULL,
    diocese VARCHAR(200),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url VARCHAR(500),
    established_date DATE,
    patron_saint VARCHAR(200),
    timezone VARCHAR(50) DEFAULT 'UTC',
    subscription_plan VARCHAR(50) CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    subscription_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create church_admins table
CREATE TABLE church_admins (
    church_admin_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id),
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    permissions TEXT,
    hire_date DATE,
    is_primary_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wards table
CREATE TABLE wards (
    ward_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    ward_name VARCHAR(200) NOT NULL,
    ward_number VARCHAR(50),
    description TEXT,
    coordinator_id BIGINT REFERENCES church_admins(church_admin_id),
    area_coverage TEXT,
    total_families INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create families table
CREATE TABLE families (
    family_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    ward_id BIGINT REFERENCES wards(ward_id),
    family_name VARCHAR(200) NOT NULL,
    primary_contact_id BIGINT,
    home_phone VARCHAR(20),
    phone VARCHAR(20),
    registration_date DATE,
    head_of_family VARCHAR(200),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parishioners table
CREATE TABLE parishioners (
    parishioner_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id),
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    ward_id BIGINT REFERENCES wards(ward_id),
    family_id BIGINT REFERENCES families(family_id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    marital_status VARCHAR(50) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated')),
    occupation VARCHAR(200),
    baptism_date DATE,
    first_communion_date DATE,
    confirmation_date DATE,
    marriage_date DATE,
    member_status VARCHAR(50) DEFAULT 'active' CHECK (member_status IN ('active', 'inactive', 'visitor')),
    photo_url VARCHAR(500),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    registration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for families.primary_contact_id after parishioners table is created
ALTER TABLE families 
ADD CONSTRAINT fk_families_primary_contact 
FOREIGN KEY (primary_contact_id) REFERENCES parishioners(parishioner_id);

-- Create roles table
CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT REFERENCES parishes(parish_id),
    role_name VARCHAR(100) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    role_scope VARCHAR(50) DEFAULT 'GLOBAL',
    is_ward_role BOOLEAN DEFAULT FALSE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_code, parish_id)
);

-- Create permissions table
CREATE TABLE permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles table
CREATE TABLE user_roles (
    user_role_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    assigned_by BIGINT REFERENCES users(user_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, role_id)
);

-- Create role_permissions table
CREATE TABLE role_permissions (
    role_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    permission_id BIGINT NOT NULL REFERENCES permissions(permission_id),
    granted_by BIGINT REFERENCES users(user_id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission_id)
);

-- Create user_permissions table
CREATE TABLE user_permissions (
    user_permission_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    permission_id BIGINT NOT NULL REFERENCES permissions(permission_id),
    permission_type VARCHAR(10) NOT NULL CHECK (permission_type IN ('GRANT', 'REVOKE')),
    assigned_by BIGINT REFERENCES users(user_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, permission_id)
);

-- Create ward_roles table
CREATE TABLE ward_roles (
    ward_role_id BIGSERIAL PRIMARY KEY,
    ward_id BIGINT NOT NULL REFERENCES wards(ward_id),
    parishioner_id BIGINT NOT NULL REFERENCES parishioners(parishioner_id),
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    role_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_by BIGINT REFERENCES users(user_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ward_id, parishioner_id, role_id)
);

-- Create account_categories table
CREATE TABLE account_categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('income', 'expense')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_name, category_type)
);

-- Create accounts table
CREATE TABLE accounts (
    account_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    category_id BIGINT NOT NULL REFERENCES account_categories(category_id),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    payment_method VARCHAR(50),
    balance_after DECIMAL(15,2),
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prayer_requests table
CREATE TABLE prayer_requests (
    prayer_request_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    requested_by BIGINT REFERENCES parishioners(parishioner_id),
    requester_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    booking_date DATE,
    booking_time TIME,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    approved_by BIGINT REFERENCES church_admins(church_admin_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audiobooks table
CREATE TABLE audiobooks (
    audiobook_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    narrator VARCHAR(255),
    description TEXT,
    thumbnail_url VARCHAR(500),
    audio_file_url VARCHAR(500),
    duration_minutes INTEGER,
    file_size_mb DECIMAL(10,2),
    category VARCHAR(100),
    language VARCHAR(50) DEFAULT 'English',
    publication_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_bible_readings table
CREATE TABLE daily_bible_readings (
    reading_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    reading_date DATE NOT NULL,
    book_name VARCHAR(100) NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER,
    verse_end INTEGER,
    translation VARCHAR(20) DEFAULT 'kjv',
    title VARCHAR(255),
    content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (parish_id, reading_date)
);

-- Create bible_bookmarks table
CREATE TABLE bible_bookmarks (
    bookmark_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    book_name VARCHAR(100) NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER,
    verse_end INTEGER,
    translation VARCHAR(20) DEFAULT 'kjv',
    note TEXT,
    highlight_color VARCHAR(20),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bible_reading_history table
CREATE TABLE bible_reading_history (
    history_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    book_name VARCHAR(100) NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER,
    verse_end INTEGER,
    translation VARCHAR(20) DEFAULT 'kjv',
    reading_date DATE NOT NULL,
    reading_duration_seconds INTEGER,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_templates table
CREATE TABLE email_templates (
    template_id BIGSERIAL PRIMARY KEY,
    template_code VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    category VARCHAR(50),
    variables TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_queue table
CREATE TABLE email_queue (
    queue_id BIGSERIAL PRIMARY KEY,
    template_code VARCHAR(100) REFERENCES email_templates(template_code),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    variables TEXT,
    priority INTEGER DEFAULT 5,
    scheduled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create email_logs table
CREATE TABLE email_logs (
    log_id BIGSERIAL PRIMARY KEY,
    template_id BIGINT REFERENCES email_templates(template_id),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    variables TEXT,
    retry_count INTEGER DEFAULT 0,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create otp_codes table
CREATE TABLE otp_codes (
    otp_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    otp_code VARCHAR(6) NOT NULL,
    otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('login', 'password_reset', 'verification')),
    delivery_method VARCHAR(10) NOT NULL CHECK (delivery_method IN ('email', 'sms')),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    ip_address VARCHAR(50),
    attempts INTEGER DEFAULT 0
);

-- Create deleted_parish table
CREATE TABLE deleted_parish (
    deleted_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL,
    parish_name VARCHAR(200) NOT NULL,
    diocese VARCHAR(200),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url VARCHAR(500),
    established_date DATE,
    patron_saint VARCHAR(200),
    timezone VARCHAR(50),
    subscription_plan VARCHAR(50),
    subscription_expiry DATE,
    deleted_reason VARCHAR(255),
    deleted_by BIGINT REFERENCES users(user_id),
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_church_admins_user_id ON church_admins(user_id);
CREATE INDEX idx_church_admins_parish_id ON church_admins(parish_id);
CREATE INDEX idx_parishioners_user_id ON parishioners(user_id);
CREATE INDEX idx_parishioners_parish_id ON parishioners(parish_id);
CREATE INDEX idx_parishioners_ward_id ON parishioners(ward_id);
CREATE INDEX idx_parishioners_family_id ON parishioners(family_id);
CREATE INDEX idx_families_parish_id ON families(parish_id);
CREATE INDEX idx_families_ward_id ON families(ward_id);
CREATE INDEX idx_wards_parish_id ON wards(parish_id);
CREATE INDEX idx_accounts_parish_id ON accounts(parish_id);
CREATE INDEX idx_accounts_transaction_date ON accounts(transaction_date);
CREATE INDEX idx_prayer_requests_parish_id ON prayer_requests(parish_id);
CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parishes_updated_at BEFORE UPDATE ON parishes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_admins_updated_at BEFORE UPDATE ON church_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wards_updated_at BEFORE UPDATE ON wards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parishioners_updated_at BEFORE UPDATE ON parishioners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ward_roles_updated_at BEFORE UPDATE ON ward_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_categories_updated_at BEFORE UPDATE ON account_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON prayer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audiobooks_updated_at BEFORE UPDATE ON audiobooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_bible_readings_updated_at BEFORE UPDATE ON daily_bible_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bible_bookmarks_updated_at BEFORE UPDATE ON bible_bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();






-- =====================================================
-- PostgreSQL SEED DATA SCRIPT
-- System Roles, Permissions, and Sample Data
-- =====================================================

-- =====================================================
-- SYSTEM ROLES
-- =====================================================

INSERT INTO roles (role_id, parish_id, role_name, role_code, description, is_system_role, is_active, priority, role_scope, is_ward_role)
VALUES
  -- System Roles (ID 1-10)
  (1, NULL, 'Super Admin', 'SUPER_ADMIN', 'System administrator with full access to all features and parishes', TRUE, TRUE, 10, 'GLOBAL', FALSE),
  (2, NULL, 'Church Admin', 'CHURCH_ADMIN', 'Parish administrator with extended permissions to manage parish', TRUE, TRUE, 5, 'PARISH', FALSE),
  (3, NULL, 'Family Member', 'FAMILY_MEMBER', 'Regular parish member with basic access to view and manage their own profile', TRUE, TRUE, 1, 'PARISH', FALSE),

  -- Ward Roles (ID 11-20)
  (11, NULL, 'Ward Convener', 'WARD_CONVENER', 'Leader of the ward with overall responsibility', TRUE, TRUE, 7, 'WARD', TRUE);

-- Update sequence for roles
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

\echo 'System roles inserted successfully!'

-- =====================================================
-- SYSTEM PERMISSIONS (Granular access control)
-- =====================================================

INSERT INTO permissions (permission_id, permission_name, permission_code, description, module, action, is_active)
VALUES
  -- Profile Permissions (1-10)
  (1, 'View Own Profile', 'VIEW_OWN_PROFILE', 'Can view their own profile', 'Profile', 'view', TRUE),
  (2, 'Edit Own Profile', 'EDIT_OWN_PROFILE', 'Can edit their own profile information', 'Profile', 'edit', TRUE),

  -- User Management (11-20)
  (11, 'View All Users', 'VIEW_ALL_USERS', 'Can view all user accounts', 'Users', 'view', TRUE),
  (12, 'Create User', 'CREATE_USER', 'Can create new user accounts', 'Users', 'create', TRUE),
  (13, 'Edit User', 'EDIT_USER', 'Can edit user accounts', 'Users', 'edit', TRUE),
  (14, 'Delete User', 'DELETE_USER', 'Can delete user accounts', 'Users', 'delete', TRUE),
  (15, 'Manage User Roles', 'MANAGE_USER_ROLES', 'Can assign/revoke roles to users', 'Users', 'manage', TRUE),

  -- Parish Management (21-30)
  (21, 'View Parishes', 'VIEW_PARISHES', 'Can view parish information', 'Parishes', 'view', TRUE),
  (22, 'Create Parish', 'CREATE_PARISH', 'Can create new parishes', 'Parishes', 'create', TRUE),
  (23, 'Edit Parish', 'EDIT_PARISH', 'Can edit parish information', 'Parishes', 'edit', TRUE),
  (24, 'Delete Parish', 'DELETE_PARISH', 'Can delete parishes', 'Parishes', 'delete', TRUE),
  (25, 'Manage Parish Settings', 'MANAGE_PARISH_SETTINGS', 'Can manage parish configuration', 'Parishes', 'manage', TRUE),

  -- Parishioner Management (31-40)
  (31, 'View Parishioners', 'VIEW_PARISHIONERS', 'Can view parishioner records', 'Parishioners', 'view', TRUE),
  (32, 'Create Parishioner', 'CREATE_PARISHIONER', 'Can create parishioner records', 'Parishioners', 'create', TRUE),
  (33, 'Edit Parishioner', 'EDIT_PARISHIONER', 'Can edit parishioner records', 'Parishioners', 'edit', TRUE),
  (34, 'Delete Parishioner', 'DELETE_PARISHIONER', 'Can delete parishioner records', 'Parishioners', 'delete', TRUE),
  (35, 'Manage Parishioners', 'MANAGE_PARISHIONERS', 'Full management of parishioner records', 'Parishioners', 'manage', TRUE),

  -- Family Management (41-50)
  (41, 'View Families', 'VIEW_FAMILIES', 'Can view family records', 'Families', 'view', TRUE),
  (42, 'Create Family', 'CREATE_FAMILY', 'Can create family records', 'Families', 'create', TRUE),
  (43, 'Edit Family', 'EDIT_FAMILY', 'Can edit family records', 'Families', 'edit', TRUE),
  (44, 'Delete Family', 'DELETE_FAMILY', 'Can delete family records', 'Families', 'delete', TRUE),
  (45, 'Manage Families', 'MANAGE_FAMILIES', 'Full management of family records', 'Families', 'manage', TRUE),

  -- Ward Management (51-60)
  (51, 'View Wards', 'VIEW_WARDS', 'Can view ward information', 'Wards', 'view', TRUE),
  (52, 'Create Ward', 'CREATE_WARD', 'Can create new wards', 'Wards', 'create', TRUE),
  (53, 'Edit Ward', 'EDIT_WARD', 'Can edit ward information', 'Wards', 'edit', TRUE),
  (54, 'Delete Ward', 'DELETE_WARD', 'Can delete wards', 'Wards', 'delete', TRUE),
  (55, 'Manage Wards', 'MANAGE_WARDS', 'Full management of wards', 'Wards', 'manage', TRUE),
  (56, 'Assign Ward Roles', 'ASSIGN_WARD_ROLES', 'Can assign roles to ward members', 'Wards', 'manage', TRUE),

  -- Accounting (61-70)
  (61, 'View Accounts', 'VIEW_ACCOUNTS', 'Can view financial transactions', 'Accounting', 'view', TRUE),
  (62, 'Create Transaction', 'CREATE_TRANSACTION', 'Can create financial transactions', 'Accounting', 'create', TRUE),
  (63, 'Edit Transaction', 'EDIT_TRANSACTION', 'Can edit financial transactions', 'Accounting', 'edit', TRUE),
  (64, 'Delete Transaction', 'DELETE_TRANSACTION', 'Can delete financial transactions', 'Accounting', 'delete', TRUE),
  (65, 'Manage Accounts', 'MANAGE_ACCOUNTS', 'Full accounting management', 'Accounting', 'manage', TRUE),
  (66, 'View Financial Reports', 'VIEW_FINANCIAL_REPORTS', 'Can view financial reports', 'Accounting', 'view', TRUE),
  (67, 'Export Financial Data', 'EXPORT_FINANCIAL_DATA', 'Can export financial data', 'Accounting', 'export', TRUE),

  -- Events & Activities (71-80)
  (71, 'View Events', 'VIEW_EVENTS', 'Can view parish events', 'Events', 'view', TRUE),
  (72, 'Create Event', 'CREATE_EVENT', 'Can create new events', 'Events', 'create', TRUE),
  (73, 'Edit Event', 'EDIT_EVENT', 'Can edit events', 'Events', 'edit', TRUE),
  (74, 'Delete Event', 'DELETE_EVENT', 'Can delete events', 'Events', 'delete', TRUE),
  (75, 'Manage Events', 'MANAGE_EVENTS', 'Full event management', 'Events', 'manage', TRUE),

  -- Prayer Requests (81-90)
  (81, 'View Prayer Requests', 'VIEW_PRAYER_REQUESTS', 'Can view prayer requests', 'Prayers', 'view', TRUE),
  (82, 'Create Prayer Request', 'CREATE_PRAYER_REQUEST', 'Can submit prayer requests', 'Prayers', 'create', TRUE),
  (83, 'Approve Prayer Requests', 'APPROVE_PRAYER_REQUESTS', 'Can approve/reject prayer requests', 'Prayers', 'approve', TRUE),
  (84, 'Manage Prayer Requests', 'MANAGE_PRAYER_REQUESTS', 'Full prayer request management', 'Prayers', 'manage', TRUE),

  -- Bible & Spiritual Resources (91-100)
  (91, 'View Bible', 'VIEW_BIBLE', 'Can access Bible reader', 'Bible', 'view', TRUE),
  (92, 'Manage Daily Readings', 'MANAGE_DAILY_READINGS', 'Can configure daily Bible readings', 'Bible', 'manage', TRUE),
  (93, 'View Audiobooks', 'VIEW_AUDIOBOOKS', 'Can access audiobooks', 'Audiobooks', 'view', TRUE),
  (94, 'Manage Audiobooks', 'MANAGE_AUDIOBOOKS', 'Can upload and manage audiobooks', 'Audiobooks', 'manage', TRUE),

  -- Roles & Permissions (101-110)
  (101, 'View Roles', 'VIEW_ROLES', 'Can view roles', 'Roles', 'view', TRUE),
  (102, 'Create Role', 'CREATE_ROLE', 'Can create custom roles', 'Roles', 'create', TRUE),
  (103, 'Edit Role', 'EDIT_ROLE', 'Can edit roles', 'Roles', 'edit', TRUE),
  (104, 'Delete Role', 'DELETE_ROLE', 'Can delete roles', 'Roles', 'delete', TRUE),
  (105, 'Manage Roles', 'MANAGE_ROLES', 'Full role management', 'Roles', 'manage', TRUE),
  (106, 'Manage Permissions', 'MANAGE_PERMISSIONS', 'Can assign/revoke permissions', 'Permissions', 'manage', TRUE),

  -- Email & Communication (111-120)
  (111, 'Send Emails', 'SEND_EMAILS', 'Can send emails to parishioners', 'Communication', 'send', TRUE),
  (112, 'Manage Email Templates', 'MANAGE_EMAIL_TEMPLATES', 'Can create and edit email templates', 'Communication', 'manage', TRUE),
  (113, 'View Email Logs', 'VIEW_EMAIL_LOGS', 'Can view email sending history', 'Communication', 'view', TRUE),

  -- System Administration (121-130)
  (121, 'View System Logs', 'VIEW_SYSTEM_LOGS', 'Can view system logs', 'System', 'view', TRUE),
  (122, 'Manage System Settings', 'MANAGE_SYSTEM_SETTINGS', 'Can configure system settings', 'System', 'manage', TRUE),
  (123, 'View Analytics', 'VIEW_ANALYTICS', 'Can view analytics and reports', 'Analytics', 'view', TRUE);

-- Update sequence for permissions
SELECT setval('permissions_permission_id_seq', (SELECT MAX(permission_id) FROM permissions));

\echo 'System permissions inserted successfully!'

-- =====================================================
-- ROLE-PERMISSION MAPPINGS
-- =====================================================

-- SUPER ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions WHERE is_active = TRUE;

-- CHURCH ADMIN: Parish management permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  -- Profile
  (2, 1), (2, 2),
  -- Users (view only)
  (2, 11),
  -- Parishes (view only - no create/edit/delete/manage)
  (2, 21),
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
  -- Roles (full management)
  (2, 101), (2, 102), (2, 103), (2, 104), (2, 105), (2, 106),
  -- Email
  (2, 111), (2, 112), (2, 113),
  -- Analytics
  (2, 123);


  INSERT INTO role_permissions (role_id, permission_id)
VALUES
  -- Profile
  (3, 1), (3, 2),
  -- Events (view only)
  (3, 71),
  -- Prayer Requests (view and create own)
  (3, 81), (3, 82),
  -- Bible
  (3, 91),
  -- Audiobooks (view)
  (3, 93);

  INSERT INTO account_categories (category_id, category_name, category_type, description, is_system, is_active)
VALUES
  -- INCOME CATEGORIES (1-20)
  (1, 'Sunday Collection', 'income', 'Regular Sunday mass collection', TRUE, TRUE),
  (2, 'Special Collection', 'income', 'Special collections for specific purposes', TRUE, TRUE),
  (3, 'Tithe', 'income', 'Tithe offerings from parishioners', TRUE, TRUE),
  (4, 'Donations', 'income', 'General donations to the parish', TRUE, TRUE),
  (5, 'Building Fund', 'income', 'Contributions to building/renovation fund', TRUE, TRUE),
  (6, 'Mass Stipends', 'income', 'Offerings for mass intentions', TRUE, TRUE),
  (7, 'Sacrament Fees', 'income', 'Fees for baptism, marriage, etc.', TRUE, TRUE),
  (8, 'Hall Rental', 'income', 'Income from renting parish hall', TRUE, TRUE),
  (9, 'Fundraising Events', 'income', 'Income from parish events', TRUE, TRUE),
  (10, 'Subscription/Membership', 'income', 'Annual membership fees', TRUE, TRUE),
  (11, 'Candle Offerings', 'income', 'Offerings for lighting candles', TRUE, TRUE),
  (12, 'Cemetery Services', 'income', 'Cemetery maintenance and services', TRUE, TRUE),
  (13, 'Investment Income', 'income', 'Income from investments', TRUE, TRUE),
  (14, 'Grant/Aid', 'income', 'Grants and external aid received', TRUE, TRUE),
  (15, 'Sale of Publications', 'income', 'Income from books, bulletins, etc.', TRUE, TRUE),

  -- EXPENSE CATEGORIES (21-60)
  (21, 'Clergy Compensation', 'expense', 'Salaries and benefits for clergy', TRUE, TRUE),
  (22, 'Staff Salaries', 'expense', 'Salaries for parish staff', TRUE, TRUE),
  (23, 'Utilities', 'expense', 'Electricity, water, gas bills', TRUE, TRUE),
  (24, 'Building Maintenance', 'expense', 'Repairs and upkeep of buildings', TRUE, TRUE),
  (25, 'Office Supplies', 'expense', 'Stationery, printing, etc.', TRUE, TRUE),
  (26, 'Liturgical Supplies', 'expense', 'Candles, incense, vestments, etc.', TRUE, TRUE),
  (27, 'Cleaning Supplies', 'expense', 'Cleaning materials and services', TRUE, TRUE),
  (28, 'Insurance', 'expense', 'Property, liability, health insurance', TRUE, TRUE),
  (29, 'Property Tax', 'expense', 'Property taxes and fees', TRUE, TRUE),
  (30, 'Loan Payments', 'expense', 'Mortgage and loan repayments', TRUE, TRUE),
  (31, 'Charity & Outreach', 'expense', 'Charitable programs and donations', TRUE, TRUE),
  (32, 'Education Programs', 'expense', 'Religious education, catechism', TRUE, TRUE),
  (33, 'Youth Ministry', 'expense', 'Youth programs and activities', TRUE, TRUE),
  (34, 'Music Ministry', 'expense', 'Choir, instruments, music', TRUE, TRUE),
  (35, 'Communications', 'expense', 'Phone, internet, website', TRUE, TRUE),
  (36, 'Diocesan Assessment', 'expense', 'Payments to diocese', TRUE, TRUE),
  (37, 'Professional Fees', 'expense', 'Legal, accounting, consulting', TRUE, TRUE),
  (38, 'Food & Refreshments', 'expense', 'For events and gatherings', TRUE, TRUE),
  (39, 'Transportation', 'expense', 'Vehicle maintenance, fuel', TRUE, TRUE),
  (40, 'Books & Publications', 'expense', 'Religious books, bulletins', TRUE, TRUE),
  (41, 'Technology', 'expense', 'Computers, software, AV equipment', TRUE, TRUE),
  (42, 'Advertising', 'expense', 'Marketing and outreach materials', TRUE, TRUE),
  (43, 'Bank Charges', 'expense', 'Banking fees and charges', TRUE, TRUE),
  (44, 'Groundskeeping', 'expense', 'Lawn care, landscaping', TRUE, TRUE),
  (45, 'Security', 'expense', 'Security services and systems', TRUE, TRUE),
  (46, 'Special Events', 'expense', 'Costs for parish events', TRUE, TRUE),
  (47, 'Mission Support', 'expense', 'Support for mission activities', TRUE, TRUE),
  (48, 'Repairs & Renovations', 'expense', 'Major repairs and upgrades', TRUE, TRUE),
  (49, 'Furniture & Fixtures', 'expense', 'Purchase of furniture', TRUE, TRUE),
  (50, 'Miscellaneous', 'expense', 'Other expenses', TRUE, TRUE);

-- Update sequence for account_categories
SELECT setval('account_categories_category_id_seq', (SELECT MAX(category_id) FROM account_categories));


-- =====================================================
-- DEFAULT EMAIL TEMPLATES
-- =====================================================

INSERT INTO email_templates (template_id, template_code, template_name, subject, body_html, body_text, category, variables, description, is_active)
VALUES
  (1, 'OTP_LOGIN', 'OTP for Login', 'Your Login OTP - {{parishName}}',
   '<html><body><h2>Your Login OTP</h2><p>Hello {{firstName}},</p><p>Your OTP code is: <strong>{{otpCode}}</strong></p><p>This code will expire in {{expiryMinutes}} minutes.</p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>{{parishName}}</p></body></html>',
   'Hello {{firstName}}, Your OTP code is: {{otpCode}}. This code will expire in {{expiryMinutes}} minutes.',
   'Authentication', '["firstName", "otpCode", "expiryMinutes", "parishName"]', 'OTP code for passwordless login', TRUE),

  (2, 'OTP_PASSWORD_RESET', 'OTP for Password Reset', 'Reset Your Password - {{parishName}}',
   '<html><body><h2>Password Reset Request</h2><p>Hello {{firstName}},</p><p>You requested to reset your password. Your OTP code is: <strong>{{otpCode}}</strong></p><p>This code will expire in {{expiryMinutes}} minutes.</p><p>If you did not request this, please contact support immediately.</p><p>Best regards,<br>{{parishName}}</p></body></html>',
   'Hello {{firstName}}, Your password reset OTP is: {{otpCode}}. Expires in {{expiryMinutes}} minutes.',
   'Authentication', '["firstName", "otpCode", "expiryMinutes", "parishName"]', 'OTP for password reset', TRUE),

  (3, 'WELCOME_PARISHIONER', 'Welcome to Parish', 'Welcome to {{parishName}}!',
   '<html><body><h2>Welcome to {{parishName}}!</h2><p>Dear {{firstName}} {{lastName}},</p><p>Welcome to our parish community! We are delighted to have you join us.</p><p>Your account has been created successfully. You can now log in to access parish services, view events, and stay connected.</p><p>God bless you,<br>{{parishName}}</p></body></html>',
   'Dear {{firstName}} {{lastName}}, Welcome to {{parishName}}! Your account has been created successfully.',
   'Welcome', '["firstName", "lastName", "parishName"]', 'Welcome email for new parishioners', TRUE),

  (4, 'PASSWORD_CHANGED', 'Password Changed', 'Your Password Has Been Changed - {{parishName}}',
   '<html><body><h2>Password Changed</h2><p>Hello {{firstName}},</p><p>Your password was successfully changed on {{changeDate}}.</p><p>If you did not make this change, please contact support immediately.</p><p>Best regards,<br>{{parishName}}</p></body></html>',
   'Hello {{firstName}}, Your password was changed on {{changeDate}}. Contact support if this was not you.',
   'Security', '["firstName", "changeDate", "parishName"]', 'Notification for password change', TRUE),

  (5, 'PRAYER_REQUEST_SUBMITTED', 'Prayer Request Received', 'Your Prayer Request Has Been Received',
   '<html><body><h2>Prayer Request Received</h2><p>Dear {{requesterName}},</p><p>Thank you for submitting your prayer request. Our parish community will remember you in our prayers.</p><p><strong>Subject:</strong> {{subject}}</p><p>May God bless you abundantly.</p><p>{{parishName}}</p></body></html>',
   'Dear {{requesterName}}, Your prayer request has been received. Subject: {{subject}}. God bless you.',
   'Prayer', '["requesterName", "subject", "parishName"]', 'Confirmation of prayer request submission', TRUE),

  (6, 'EVENT_REMINDER', 'Upcoming Event Reminder', 'Reminder: {{eventName}} - {{eventDate}}',
   '<html><body><h2>Event Reminder</h2><p>Dear {{firstName}},</p><p>This is a reminder about the upcoming event:</p><p><strong>{{eventName}}</strong></p><p><strong>Date:</strong> {{eventDate}}</p><p><strong>Time:</strong> {{eventTime}}</p><p><strong>Location:</strong> {{eventLocation}}</p><p>We look forward to seeing you there!</p><p>{{parishName}}</p></body></html>',
   'Event Reminder: {{eventName}} on {{eventDate}} at {{eventTime}}. Location: {{eventLocation}}.',
   'Events', '["firstName", "eventName", "eventDate", "eventTime", "eventLocation", "parishName"]', 'Reminder for upcoming parish events', TRUE);

-- Update sequence for email_templates
SELECT setval('email_templates_template_id_seq', (SELECT MAX(template_id) FROM email_templates));

