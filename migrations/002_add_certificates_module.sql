-- =====================================================
-- Certificate Management Module
-- Migration: Add Certificate Types and Certificates Tables
-- Created: 2025-11-16
-- =====================================================

-- =====================================================
-- CERTIFICATE TYPES TABLE
-- =====================================================
-- Defines different types of certificates that can be issued
-- Examples: Baptism, Marriage, Death, Confirmation, etc.

CREATE TABLE certificate_types (
    certificate_type_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id) ON DELETE CASCADE,
    type_name VARCHAR(100) NOT NULL,
    type_code VARCHAR(50) NOT NULL,
    description TEXT,

    -- Template reference (optional - can use templates from templates table)
    default_template_id BIGINT REFERENCES templates(template_id) ON DELETE SET NULL,

    -- Certificate settings
    requires_approval BOOLEAN DEFAULT TRUE,
    auto_generate_number BOOLEAN DEFAULT TRUE,
    number_prefix VARCHAR(20), -- e.g., "DEATH-", "MARRIAGE-", "BAPTISM-"
    number_format VARCHAR(50) DEFAULT '{PREFIX}{YEAR}-{NUMBER:3}', -- Format: PREFIX-YYYY-001

    -- Available placeholders for this certificate type (JSON array)
    -- Example: ["recipient_name", "date", "age", "burial_place", "priest_name"]
    available_placeholders JSONB DEFAULT '[]'::JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique type codes within a parish
    UNIQUE (parish_id, type_code)
);

COMMENT ON TABLE certificate_types IS 'Types of certificates that can be issued by the parish';
COMMENT ON COLUMN certificate_types.type_code IS 'Unique code identifier for the certificate type (e.g., DEATH, MARRIAGE, BAPTISM)';
COMMENT ON COLUMN certificate_types.available_placeholders IS 'JSON array of placeholder field names available for this certificate type';
COMMENT ON COLUMN certificate_types.number_format IS 'Format for auto-generated certificate numbers. Tokens: {PREFIX}, {YEAR}, {MONTH}, {NUMBER:digits}';

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
-- Individual certificates issued to parishioners

CREATE TABLE certificates (
    certificate_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id) ON DELETE CASCADE,
    certificate_type_id BIGINT NOT NULL REFERENCES certificate_types(certificate_type_id) ON DELETE RESTRICT,

    -- Certificate identification
    certificate_number VARCHAR(100) UNIQUE NOT NULL,

    -- Recipient information
    recipient_parishioner_id BIGINT REFERENCES parishioners(parishioner_id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL, -- Can be different from parishioner name

    -- Template used for this certificate
    template_id BIGINT REFERENCES templates(template_id) ON DELETE SET NULL,

    -- Certificate data (key-value pairs for placeholders)
    -- Example: {"date": "Jul 20, 2023", "age": "75", "burial_place": "Parish Cemetery", "priest": "Fr. John"}
    certificate_data JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Generated content
    generated_html TEXT, -- Final HTML with placeholders replaced

    -- Seal/Signature
    seal_image_url VARCHAR(500), -- URL to church seal image
    signature_image_url VARCHAR(500), -- URL to signature image
    signed_by VARCHAR(255), -- Name of the person who signed (e.g., "Fr. John Smith")
    signed_by_user_id BIGINT REFERENCES users(user_id),

    -- Issue details
    issue_date DATE NOT NULL,
    issued_by BIGINT REFERENCES users(user_id),

    -- Approval workflow
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'pending_approval', 'approved', 'issued', 'revoked', 'cancelled')
    ),
    approved_by BIGINT REFERENCES users(user_id),
    approved_at TIMESTAMP,

    -- Revocation details
    revoked_at TIMESTAMP,
    revoked_by BIGINT REFERENCES users(user_id),
    revocation_reason TEXT,

    -- Notes and metadata
    notes TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether certificate is publicly viewable

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE certificates IS 'Individual certificates issued to parishioners';
COMMENT ON COLUMN certificates.certificate_number IS 'Unique certificate number (auto-generated or manual)';
COMMENT ON COLUMN certificates.certificate_data IS 'JSON object containing all placeholder values for this certificate';
COMMENT ON COLUMN certificates.generated_html IS 'Final HTML content with all placeholders replaced';
COMMENT ON COLUMN certificates.status IS 'Certificate status: draft, pending_approval, approved, issued, revoked, cancelled';

-- =====================================================
-- CERTIFICATE HISTORY TABLE (Audit Trail)
-- =====================================================

CREATE TABLE certificate_history (
    history_id BIGSERIAL PRIMARY KEY,
    certificate_id BIGINT NOT NULL REFERENCES certificates(certificate_id) ON DELETE CASCADE,

    -- Change details
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('created', 'updated', 'approved', 'issued', 'revoked', 'cancelled', 'data_changed')
    ),
    old_status VARCHAR(50),
    new_status VARCHAR(50),

    -- What changed
    changed_fields JSONB, -- Array of field names that changed
    old_values JSONB, -- Old values of changed fields
    new_values JSONB, -- New values of changed fields

    -- Actor and reason
    performed_by BIGINT REFERENCES users(user_id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

COMMENT ON TABLE certificate_history IS 'Audit trail of all certificate changes';

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Certificate Types indexes
CREATE INDEX idx_certificate_types_parish_id ON certificate_types(parish_id);
CREATE INDEX idx_certificate_types_type_code ON certificate_types(type_code);
CREATE INDEX idx_certificate_types_is_active ON certificate_types(is_active);

-- Certificates indexes
CREATE INDEX idx_certificates_parish_id ON certificates(parish_id);
CREATE INDEX idx_certificates_certificate_type_id ON certificates(certificate_type_id);
CREATE INDEX idx_certificates_recipient_parishioner_id ON certificates(recipient_parishioner_id);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date);
CREATE INDEX idx_certificates_issued_by ON certificates(issued_by);
CREATE INDEX idx_certificates_recipient_name ON certificates(recipient_name);

-- Certificate History indexes
CREATE INDEX idx_certificate_history_certificate_id ON certificate_history(certificate_id);
CREATE INDEX idx_certificate_history_action ON certificate_history(action);
CREATE INDEX idx_certificate_history_performed_at ON certificate_history(performed_at);

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_certificate_types_updated_at BEFORE UPDATE ON certificate_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-generate certificate number
-- =====================================================

CREATE OR REPLACE FUNCTION generate_certificate_number(
    p_parish_id BIGINT,
    p_certificate_type_id BIGINT
)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_number_format VARCHAR(50);
    v_prefix VARCHAR(20);
    v_current_year VARCHAR(4);
    v_current_month VARCHAR(2);
    v_next_number INTEGER;
    v_certificate_number VARCHAR(100);
    v_auto_generate BOOLEAN;
BEGIN
    -- Get certificate type settings
    SELECT number_format, number_prefix, auto_generate_number
    INTO v_number_format, v_prefix, v_auto_generate
    FROM certificate_types
    WHERE certificate_type_id = p_certificate_type_id;

    -- If auto-generation is disabled, return NULL
    IF NOT v_auto_generate THEN
        RETURN NULL;
    END IF;

    -- Get current year and month
    v_current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_current_month := TO_CHAR(CURRENT_DATE, 'MM');

    -- Get next certificate number for this type and year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(
                certificate_number
                FROM LENGTH(COALESCE(v_prefix, '')) + LENGTH(v_current_year) + 2
            ) AS INTEGER
        )
    ), 0) + 1
    INTO v_next_number
    FROM certificates
    WHERE parish_id = p_parish_id
      AND certificate_type_id = p_certificate_type_id
      AND certificate_number LIKE COALESCE(v_prefix, '') || v_current_year || '%';

    -- Build certificate number based on format
    v_certificate_number := v_number_format;
    v_certificate_number := REPLACE(v_certificate_number, '{PREFIX}', COALESCE(v_prefix, ''));
    v_certificate_number := REPLACE(v_certificate_number, '{YEAR}', v_current_year);
    v_certificate_number := REPLACE(v_certificate_number, '{MONTH}', v_current_month);

    -- Handle {NUMBER:X} format (e.g., {NUMBER:3} -> 001)
    IF v_certificate_number LIKE '%{NUMBER:%}%' THEN
        DECLARE
            v_digits INTEGER;
            v_formatted_number VARCHAR(20);
        BEGIN
            -- Extract digit count from {NUMBER:X}
            v_digits := CAST(
                SUBSTRING(v_certificate_number FROM '{NUMBER:([0-9]+)}')
                AS INTEGER
            );
            -- Format number with leading zeros
            v_formatted_number := LPAD(v_next_number::TEXT, v_digits, '0');
            -- Replace placeholder
            v_certificate_number := REGEXP_REPLACE(
                v_certificate_number,
                '\{NUMBER:[0-9]+\}',
                v_formatted_number
            );
        END;
    ELSE
        v_certificate_number := REPLACE(v_certificate_number, '{NUMBER}', v_next_number::TEXT);
    END IF;

    RETURN v_certificate_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_certificate_number IS 'Auto-generates certificate numbers based on certificate type format';

-- =====================================================
-- ADD CERTIFICATE PERMISSIONS
-- =====================================================

INSERT INTO permissions (permission_id, permission_name, permission_code, description, module, action, is_active)
VALUES
  -- Certificate Types
  (141, 'View Certificate Types', 'VIEW_CERTIFICATE_TYPES', 'Can view certificate types', 'Certificates', 'view', TRUE),
  (142, 'Create Certificate Type', 'CREATE_CERTIFICATE_TYPE', 'Can create certificate types', 'Certificates', 'create', TRUE),
  (143, 'Edit Certificate Type', 'EDIT_CERTIFICATE_TYPE', 'Can edit certificate types', 'Certificates', 'edit', TRUE),
  (144, 'Delete Certificate Type', 'DELETE_CERTIFICATE_TYPE', 'Can delete certificate types', 'Certificates', 'delete', TRUE),

  -- Certificates
  (145, 'View Certificates', 'VIEW_CERTIFICATES', 'Can view certificates', 'Certificates', 'view', TRUE),
  (146, 'Create Certificate', 'CREATE_CERTIFICATE', 'Can create/issue certificates', 'Certificates', 'create', TRUE),
  (147, 'Edit Certificate', 'EDIT_CERTIFICATE', 'Can edit certificates', 'Certificates', 'edit', TRUE),
  (148, 'Delete Certificate', 'DELETE_CERTIFICATE', 'Can delete certificates', 'Certificates', 'delete', TRUE),
  (149, 'Approve Certificate', 'APPROVE_CERTIFICATE', 'Can approve certificates', 'Certificates', 'approve', TRUE),
  (150, 'Revoke Certificate', 'REVOKE_CERTIFICATE', 'Can revoke issued certificates', 'Certificates', 'revoke', TRUE),
  (151, 'Manage Certificates', 'MANAGE_CERTIFICATES', 'Full certificate management', 'Certificates', 'manage', TRUE);

-- Update sequence for permissions
SELECT setval('permissions_permission_id_seq', (SELECT MAX(permission_id) FROM permissions));

-- =====================================================
-- ASSIGN CERTIFICATE PERMISSIONS TO ROLES
-- =====================================================

-- SUPER ADMIN: All certificate permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  (1, 141), (1, 142), (1, 143), (1, 144),
  (1, 145), (1, 146), (1, 147), (1, 148), (1, 149), (1, 150), (1, 151);

-- CHURCH ADMIN: All certificate permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  (2, 141), (2, 142), (2, 143), (2, 144),
  (2, 145), (2, 146), (2, 147), (2, 148), (2, 149), (2, 150), (2, 151);

-- =====================================================
-- SEED DATA: Common Certificate Types
-- =====================================================

-- Note: These are examples. Actual certificate types should be created by each parish
-- with their own templates and placeholders

-- Example: Death Certificate Type
INSERT INTO certificate_types (
    parish_id, type_name, type_code, description,
    number_prefix, number_format,
    available_placeholders,
    created_by
)
SELECT
    p.parish_id,
    'Death Certificate',
    'DEATH',
    'Certificate issued for deceased parishioners',
    'DEATH-',
    '{PREFIX}{YEAR}-{NUMBER:3}',
    '[
        "recipient_name",
        "date_of_death",
        "age",
        "burial_place",
        "burial_date",
        "priest_name",
        "certificate_date",
        "certificate_number"
    ]'::JSONB,
    NULL
FROM parishes p
WHERE p.parish_id = 1 -- Only for demo, remove this in production
LIMIT 1;

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Certificate Management Module';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- certificate_types';
    RAISE NOTICE '- certificates';
    RAISE NOTICE '- certificate_history';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '- generate_certificate_number()';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Permissions added: 11';
    RAISE NOTICE '(IDs 141-151)';
    RAISE NOTICE '========================================';
END $$;
