-- =====================================================
-- PostgreSQL Database Schema for Parish Management System
-- Complete schema with Razorpay Subscription Integration
-- Last Updated: 2025-11-05
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUM TYPES
-- =====================================================

CREATE TYPE subscription_status_enum AS ENUM (
    'PENDING',      -- Parish registered, awaiting first subscription payment
    'ACTIVE',       -- Subscription is active and paid, full access granted
    'SUSPENDED',    -- Subscription payment failed or expired, access restricted
    'CANCELLED'     -- Subscription cancelled by parish or admin
);

COMMENT ON TYPE subscription_status_enum IS 'Parish subscription status for access control';

-- =====================================================
-- STEP 2: CREATE CORE TABLES
-- =====================================================

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

COMMENT ON TABLE users IS 'User accounts for system access';
COMMENT ON COLUMN users.user_type IS 'User role: super_admin (system admin), church_admin (parish admin), parishioner (member)';

-- =====================================================
-- SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE subscription_plans (
    plan_id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium', 'enterprise')),
    razorpay_plan_id VARCHAR(255) UNIQUE, -- Razorpay plan ID
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'quarterly')),

    -- Feature limits
    features JSONB, -- JSON array of feature descriptions
    max_parishioners INTEGER NOT NULL DEFAULT 0,
    max_families INTEGER NOT NULL DEFAULT 0,
    max_wards INTEGER,
    max_admins INTEGER NOT NULL DEFAULT 1,
    max_users INTEGER,
    max_storage_gb INTEGER NOT NULL DEFAULT 1,

    -- Trial settings
    trial_period_days INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subscription_plans IS 'Subscription plans available for parishes';
COMMENT ON COLUMN subscription_plans.razorpay_plan_id IS 'Razorpay plan ID for subscription creation';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of features included in this plan';
COMMENT ON COLUMN subscription_plans.billing_cycle IS 'Billing frequency: monthly, yearly, quarterly';

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

    -- Subscription management columns
    is_subscription_managed BOOLEAN DEFAULT TRUE,  -- TRUE if using Razorpay subscriptions
    current_plan_id BIGINT REFERENCES subscription_plans(plan_id),  -- Current active plan
    subscription_status subscription_status_enum NOT NULL DEFAULT 'PENDING',  -- Payment status

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: ACTIVE subscriptions must have a plan
    CONSTRAINT chk_active_subscription_has_plan CHECK (
        subscription_status != 'ACTIVE' OR
        (subscription_status = 'ACTIVE' AND current_plan_id IS NOT NULL)
    )
);

COMMENT ON TABLE parishes IS 'Parish organizations with mandatory subscription management';
COMMENT ON COLUMN parishes.is_subscription_managed IS 'TRUE if subscription is managed through Razorpay';
COMMENT ON COLUMN parishes.current_plan_id IS 'Current active subscription plan (references subscription_plans table)';
COMMENT ON COLUMN parishes.subscription_status IS 'Current subscription status - PENDING (awaiting payment), ACTIVE (paid), SUSPENDED (payment failed), CANCELLED';

-- =====================================================
-- PARISH SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE parish_subscriptions (
    subscription_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL UNIQUE REFERENCES parishes(parish_id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES subscription_plans(plan_id),

    -- Payment method
    payment_method VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (payment_method IN ('online', 'cash')),

    -- Razorpay references
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    razorpay_customer_id VARCHAR(255),

    -- Billing contact
    billing_contact_user_id BIGINT REFERENCES users(user_id),
    billing_email VARCHAR(255),
    billing_phone VARCHAR(20),

    -- Billing address
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100) DEFAULT 'India',
    billing_postal_code VARCHAR(20),

    -- Tax information
    tax_identification_number VARCHAR(50), -- GSTIN for India
    company_name VARCHAR(200), -- Legal entity name

    -- Subscription status
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        subscription_status IN ('created', 'authenticated', 'active', 'paused', 'halted', 'cancelled', 'expired', 'pending')
    ),

    -- Subscription dates
    start_date DATE NOT NULL,
    trial_start_date DATE,
    trial_end_date DATE,
    current_period_start DATE,
    current_period_end DATE,
    next_billing_date DATE,
    last_payment_date DATE,
    cancellation_date DATE,
    expiry_date DATE,

    -- Cancellation details
    cancellation_reason TEXT,
    cancelled_by BIGINT REFERENCES users(user_id),

    -- Settings
    auto_renewal BOOLEAN DEFAULT TRUE,

    -- Metrics
    payment_failed_count INTEGER DEFAULT 0,
    total_paid DECIMAL(15,2) DEFAULT 0,
    total_invoices INTEGER DEFAULT 0,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE parish_subscriptions IS 'Parish subscription records linked to Razorpay';
COMMENT ON COLUMN parish_subscriptions.payment_method IS 'Payment method: online (Razorpay) or cash (manual payment verification)';
COMMENT ON COLUMN parish_subscriptions.subscription_status IS 'created: Created but not authenticated | authenticated: Authorized but not started | active: Currently active | paused: Temporarily paused | halted: Halted due to payment failure | cancelled: Cancelled by user | expired: Subscription expired';
COMMENT ON COLUMN parish_subscriptions.razorpay_subscription_id IS 'Unique subscription ID from Razorpay';
COMMENT ON COLUMN parish_subscriptions.razorpay_customer_id IS 'Razorpay customer ID for the parish';

-- =====================================================
-- SUBSCRIPTION PAYMENTS TABLE
-- =====================================================

CREATE TABLE subscription_payments (
    payment_id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL REFERENCES parish_subscriptions(subscription_id) ON DELETE CASCADE,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id) ON DELETE CASCADE,

    -- Razorpay references
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    razorpay_invoice_id VARCHAR(255),

    -- Payment details
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    amount_paid DECIMAL(15,2),
    amount_due DECIMAL(15,2),

    -- Tax details
    tax_amount DECIMAL(15,2),

    -- Payment method and status
    payment_method VARCHAR(50), -- card, netbanking, upi, wallet, etc.
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('created', 'authorized', 'captured', 'failed', 'refunded', 'pending')
    ),

    -- Invoice details
    invoice_number VARCHAR(100) UNIQUE,
    receipt_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    paid_on DATE,

    -- Additional info
    description TEXT,
    notes TEXT,
    failure_reason TEXT,

    -- Refund details
    refund_amount DECIMAL(15,2),
    refund_date DATE,
    refund_reason TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subscription_payments IS 'Payment transactions for parish subscriptions';
COMMENT ON COLUMN subscription_payments.payment_status IS 'created: Payment created | authorized: Payment authorized | captured: Payment successful | failed: Payment failed | refunded: Payment refunded';

-- =====================================================
-- RAZORPAY WEBHOOK LOGS TABLE
-- =====================================================

CREATE TABLE razorpay_webhook_logs (
    log_id BIGSERIAL PRIMARY KEY,

    -- Webhook event details
    event_id VARCHAR(255) UNIQUE, -- Razorpay event ID
    event_type VARCHAR(100) NOT NULL, -- subscription.activated, payment.captured, etc.
    entity_type VARCHAR(50) NOT NULL, -- subscription, payment, invoice, etc.
    entity_id VARCHAR(255) NOT NULL, -- ID of the entity

    -- Payload
    payload JSONB NOT NULL, -- Full webhook payload as JSON

    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Related records
    parish_id BIGINT REFERENCES parishes(parish_id),
    subscription_id BIGINT REFERENCES parish_subscriptions(subscription_id),
    payment_id BIGINT REFERENCES subscription_payments(payment_id),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

COMMENT ON TABLE razorpay_webhook_logs IS 'Logs all webhook events received from Razorpay for audit and debugging';
COMMENT ON COLUMN razorpay_webhook_logs.event_type IS 'Type of webhook event (e.g., subscription.activated, payment.captured)';
COMMENT ON COLUMN razorpay_webhook_logs.payload IS 'Complete webhook payload as JSON for debugging';

-- =====================================================
-- SUBSCRIPTION HISTORY TABLE (Audit Trail)
-- =====================================================

CREATE TABLE subscription_history (
    history_id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL REFERENCES parish_subscriptions(subscription_id) ON DELETE CASCADE,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),

    -- Change details
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('created', 'activated', 'paused', 'resumed', 'cancelled', 'expired', 'plan_changed', 'payment_failed', 'payment_succeeded')
    ),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_plan_id BIGINT REFERENCES subscription_plans(plan_id),
    new_plan_id BIGINT REFERENCES subscription_plans(plan_id),

    -- Details
    description TEXT,
    metadata JSONB,

    -- Actor
    performed_by BIGINT REFERENCES users(user_id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subscription_history IS 'Audit trail of all subscription changes';

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

COMMENT ON TABLE church_admins IS 'Parish administrators with extended permissions';

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

COMMENT ON TABLE wards IS 'Geographical divisions within parishes';

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

COMMENT ON TABLE families IS 'Family units within parishes';

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

COMMENT ON TABLE parishioners IS 'Individual parish members';

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

COMMENT ON TABLE roles IS 'User roles for access control';

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

COMMENT ON TABLE permissions IS 'Granular permissions for system access';

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

COMMENT ON TABLE user_roles IS 'User role assignments';

-- Create role_permissions table
CREATE TABLE role_permissions (
    role_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    permission_id BIGINT NOT NULL REFERENCES permissions(permission_id),
    granted_by BIGINT REFERENCES users(user_id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Permissions assigned to roles';

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

COMMENT ON TABLE user_permissions IS 'Direct user permission grants/revokes';

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

COMMENT ON TABLE ward_roles IS 'Ward-specific role assignments';

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

COMMENT ON TABLE account_categories IS 'Categories for financial transactions';

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

COMMENT ON TABLE accounts IS 'Financial transactions for parishes';

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

COMMENT ON TABLE prayer_requests IS 'Prayer requests from parishioners';

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

COMMENT ON TABLE audiobooks IS 'Religious audiobooks available to parishioners';

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

COMMENT ON TABLE daily_bible_readings IS 'Daily Bible readings for parishes';

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

COMMENT ON TABLE bible_bookmarks IS 'User Bible bookmarks and highlights';

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

COMMENT ON TABLE bible_reading_history IS 'User Bible reading history';

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

COMMENT ON TABLE email_templates IS 'Email templates for system notifications';

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

COMMENT ON TABLE email_queue IS 'Email queue for scheduled sending';

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

COMMENT ON TABLE email_logs IS 'Email delivery logs';

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

COMMENT ON TABLE otp_codes IS 'One-time password codes for authentication';

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

    -- Subscription columns
    is_subscription_managed BOOLEAN DEFAULT TRUE,
    current_plan_id INTEGER,
    subscription_status VARCHAR(20),

    -- Deletion metadata
    deleted_reason VARCHAR(255),
    deleted_by BIGINT REFERENCES users(user_id),
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE deleted_parish IS 'Archive of deleted parishes for audit trail';
COMMENT ON COLUMN deleted_parish.is_subscription_managed IS 'TRUE if parish used Razorpay subscriptions';
COMMENT ON COLUMN deleted_parish.current_plan_id IS 'Last active subscription plan ID before deletion';
COMMENT ON COLUMN deleted_parish.subscription_status IS 'Subscription status at time of deletion (PENDING/ACTIVE/SUSPENDED/CANCELLED)';

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Parishes indexes
CREATE INDEX idx_parishes_current_plan_id ON parishes(current_plan_id);
CREATE INDEX idx_parishes_subscription_status ON parishes(subscription_status);

-- Subscription plans indexes
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_billing_cycle ON subscription_plans(billing_cycle);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);

-- Parish subscriptions indexes
CREATE INDEX idx_parish_subscriptions_parish_id ON parish_subscriptions(parish_id);
CREATE INDEX idx_parish_subscriptions_razorpay_subscription_id ON parish_subscriptions(razorpay_subscription_id);
CREATE INDEX idx_parish_subscriptions_status ON parish_subscriptions(subscription_status);
CREATE INDEX idx_parish_subscriptions_next_billing_date ON parish_subscriptions(next_billing_date);
CREATE INDEX idx_parish_subscriptions_expiry_date ON parish_subscriptions(expiry_date);

-- Subscription payments indexes
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_parish_id ON subscription_payments(parish_id);
CREATE INDEX idx_subscription_payments_razorpay_payment_id ON subscription_payments(razorpay_payment_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(payment_status);
CREATE INDEX idx_subscription_payments_paid_on ON subscription_payments(paid_on);
CREATE INDEX idx_subscription_payments_invoice_number ON subscription_payments(invoice_number);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_event_id ON razorpay_webhook_logs(event_id);
CREATE INDEX idx_webhook_logs_event_type ON razorpay_webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_entity_id ON razorpay_webhook_logs(entity_id);
CREATE INDEX idx_webhook_logs_processed ON razorpay_webhook_logs(processed);
CREATE INDEX idx_webhook_logs_created_at ON razorpay_webhook_logs(created_at);

-- Subscription history indexes
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_parish_id ON subscription_history(parish_id);
CREATE INDEX idx_subscription_history_action ON subscription_history(action);
CREATE INDEX idx_subscription_history_performed_at ON subscription_history(performed_at);

-- Church admins indexes
CREATE INDEX idx_church_admins_user_id ON church_admins(user_id);
CREATE INDEX idx_church_admins_parish_id ON church_admins(parish_id);

-- Parishioners indexes
CREATE INDEX idx_parishioners_user_id ON parishioners(user_id);
CREATE INDEX idx_parishioners_parish_id ON parishioners(parish_id);
CREATE INDEX idx_parishioners_ward_id ON parishioners(ward_id);
CREATE INDEX idx_parishioners_family_id ON parishioners(family_id);

-- Families indexes
CREATE INDEX idx_families_parish_id ON families(parish_id);
CREATE INDEX idx_families_ward_id ON families(ward_id);

-- Wards indexes
CREATE INDEX idx_wards_parish_id ON wards(parish_id);

-- Accounts indexes
CREATE INDEX idx_accounts_parish_id ON accounts(parish_id);
CREATE INDEX idx_accounts_transaction_date ON accounts(transaction_date);

-- Prayer requests indexes
CREATE INDEX idx_prayer_requests_parish_id ON prayer_requests(parish_id);
CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);

-- Email queue indexes
CREATE INDEX idx_email_queue_status ON email_queue(status);

-- OTP codes indexes
CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

-- =====================================================
-- STEP 4: CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at column on row update';

-- Function to get active subscription for a parish
CREATE OR REPLACE FUNCTION get_active_subscription(p_parish_id BIGINT)
RETURNS TABLE (
    subscription_id BIGINT,
    plan_name VARCHAR(100),
    plan_code VARCHAR(50),
    subscription_status VARCHAR(50),
    current_period_end DATE,
    is_trial BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.subscription_id,
        sp.plan_name,
        sp.plan_code,
        ps.subscription_status,
        ps.current_period_end,
        (ps.trial_end_date IS NOT NULL AND CURRENT_DATE <= ps.trial_end_date) AS is_trial
    FROM parish_subscriptions ps
    JOIN subscription_plans sp ON ps.plan_id = sp.plan_id
    WHERE ps.parish_id = p_parish_id
      AND ps.subscription_status IN ('active', 'authenticated')
    ORDER BY ps.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_subscription IS 'Returns the active subscription details for a parish';

-- Function to check if parish can add more parishioners based on plan limits
CREATE OR REPLACE FUNCTION can_add_parishioner(p_parish_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_max_allowed INTEGER;
    v_subscription_status VARCHAR(50);
BEGIN
    -- Get current parishioner count
    SELECT COUNT(*) INTO v_current_count
    FROM parishioners
    WHERE parish_id = p_parish_id AND is_active = TRUE;

    -- Get subscription limit and status
    SELECT sp.max_parishioners, ps.subscription_status
    INTO v_max_allowed, v_subscription_status
    FROM parish_subscriptions ps
    JOIN subscription_plans sp ON ps.plan_id = sp.plan_id
    WHERE ps.parish_id = p_parish_id
      AND ps.subscription_status IN ('active', 'authenticated')
    ORDER BY ps.created_at DESC
    LIMIT 1;

    -- If no subscription found or not active, deny
    IF v_subscription_status IS NULL OR v_subscription_status NOT IN ('active', 'authenticated') THEN
        RETURN FALSE;
    END IF;

    -- If unlimited (max_parishioners = 0), allow
    IF v_max_allowed = 0 THEN
        RETURN TRUE;
    END IF;

    -- Check if within limit
    RETURN v_current_count < v_max_allowed;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_add_parishioner IS 'Checks if parish can add more parishioners based on subscription plan limits';

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parishes_updated_at BEFORE UPDATE ON parishes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parish_subscriptions_updated_at BEFORE UPDATE ON parish_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at BEFORE UPDATE ON subscription_payments
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
-- STEP 6: INSERT SEED DATA
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

-- =====================================================
-- SYSTEM PERMISSIONS
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
  -- Parishes (view only)
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

-- FAMILY MEMBER: Basic permissions
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

-- =====================================================
-- ACCOUNT CATEGORIES
-- =====================================================

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
-- EMAIL TEMPLATES
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

-- =====================================================
-- SUBSCRIPTION PLANS (Razorpay Integration)
-- =====================================================

INSERT INTO subscription_plans (
    plan_id, plan_name, plan_code, tier, razorpay_plan_id, description, amount, currency, billing_cycle,
    features, max_parishioners, max_families, max_wards, max_admins, max_users, max_storage_gb,
    trial_period_days, is_active, is_featured, display_order
) VALUES
(1, 'Basic Plan', 'BASIC_MONTHLY', 'basic', 'plan_RbwIrFegTqBODg',
 'Perfect for small parishes getting started with digital management',
 1000.00, 'INR', 'monthly',
 '["Up to 500 parishioners", "Up to 100 families", "Up to 5 wards", "Up to 3 admin users", "5GB storage", "Basic reporting", "Email support"]'::JSONB,
 500, 100, 5, 3, 3, 5,
 15, TRUE, FALSE, 1),

(2, 'Standard Plan', 'STANDARD_MONTHLY', 'standard', 'plan_RbwMT3pylzkmEx',
 'Ideal for growing parishes with advanced needs',
 2499.00, 'INR', 'monthly',
 '["Up to 2000 parishioners", "Up to 500 families", "Up to 20 wards", "Up to 10 admin users", "50GB storage", "Advanced reporting", "Priority email support", "Custom roles", "SMS notifications"]'::JSONB,
 2000, 500, 20, 10, 10, 50,
 15, TRUE, TRUE, 2),

(3, 'Premium Plan', 'PREMIUM_MONTHLY', 'premium', 'plan_RbwOGqCPrETQZ2',
 'For large parishes requiring unlimited access and premium features',
 4999.00, 'INR', 'monthly',
 '["Unlimited parishioners", "Unlimited families", "Unlimited wards", "Unlimited users", "200GB storage", "Advanced analytics", "24/7 priority support", "Custom branding", "API access", "Dedicated account manager", "Custom integrations"]'::JSONB,
 0, 0, NULL, 0, NULL, 200,
 30, TRUE, TRUE, 3),

(4, 'Basic Plan (Yearly)', 'BASIC_YEARLY', 'basic', NULL,
 'Basic plan billed annually - Save 20%',
 9590.00, 'INR', 'yearly',
 '["Up to 500 parishioners", "Up to 100 families", "Up to 5 wards", "Up to 3 admin users", "5GB storage", "Basic reporting", "Email support", "Save 2 months!"]'::JSONB,
 500, 100, 5, 3, 3, 5,
 15, FALSE, FALSE, 4),

(5, 'Standard Plan (Yearly)', 'STANDARD_YEARLY', 'standard', NULL,
 'Standard plan billed annually - Save 20%',
 23990.00, 'INR', 'yearly',
 '["Up to 2000 parishioners", "Up to 500 families", "Up to 20 wards", "Up to 10 admin users", "50GB storage", "Advanced reporting", "Priority email support", "Custom roles", "SMS notifications", "Save 2 months!"]'::JSONB,
 2000, 500, 20, 10, 10, 50,
 15, FALSE, TRUE, 5),

(6, 'Premium Plan (Yearly)', 'PREMIUM_YEARLY', 'premium', NULL,
 'Premium plan billed annually - Save 20%',
 47990.00, 'INR', 'yearly',
 '["Unlimited parishioners", "Unlimited families", "Unlimited wards", "Unlimited users", "200GB storage", "Advanced analytics", "24/7 priority support", "Custom branding", "API access", "Dedicated account manager", "Custom integrations", "Save 2 months!"]'::JSONB,
 0, 0, NULL, 0, NULL, 200,
 30, FALSE, TRUE, 6);

-- Update sequence
SELECT setval('subscription_plans_plan_id_seq', (SELECT MAX(plan_id) FROM subscription_plans));

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================

-- Display summary
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Parish Management System Database';
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Roles seeded: 4';
    RAISE NOTICE 'Permissions seeded: 123';
    RAISE NOTICE 'Subscription plans: 6 (3 active monthly, 3 inactive yearly)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Configure Razorpay environment variables';
    RAISE NOTICE '2. Set up Razorpay webhook endpoint';
    RAISE NOTICE '3. Create your first super admin user';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- RAZORPAY CONFIGURATION NOTES
-- =====================================================
--
-- Environment Variables Required:
-- RAZORPAY_KEY_ID=your_razorpay_key_id
-- RAZORPAY_KEY_SECRET=your_razorpay_key_secret
-- RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
--
-- Webhook URL: https://yourdomain.com/api/v1/webhooks/razorpay
--
-- Webhook Events to Enable:
-- - subscription.activated
-- - subscription.charged
-- - subscription.completed
-- - subscription.cancelled
-- - subscription.paused
-- - subscription.resumed
-- - subscription.halted
-- - payment.captured
-- - payment.failed
--
-- Active Monthly Plans (Razorpay):
-- - Basic Plan: ₹1,000/month (plan_RbwIrFegTqBODg)
-- - Standard Plan: ₹2,499/month (plan_RbwMT3pylzkmEx)
-- - Premium Plan: ₹4,999/month (plan_RbwOGqCPrETQZ2)
--
-- Yearly plans are disabled until created in Razorpay Dashboard
-- =====================================================
