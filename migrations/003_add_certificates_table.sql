-- =====================================================
-- MIGRATION: Add Certificates Table
-- Created: 2025-11-18
-- Description: Creates the certificates table for storing issued certificates
-- with their placeholder values and generated PDF URLs
-- =====================================================

-- Create certificate status enum
CREATE TYPE certificate_status_enum AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'issued',
    'revoked',
    'cancelled'
);

COMMENT ON TYPE certificate_status_enum IS 'Status of certificates throughout their lifecycle';

-- Create certificates table
CREATE TABLE certificates (
    certificate_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    certificate_type_id BIGINT NOT NULL REFERENCES certificate_types(certificate_type_id),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    parishioner_id BIGINT REFERENCES parishioners(parishioner_id),
    placeholder_values JSONB NOT NULL DEFAULT '{}'::JSONB,
    pdf_url VARCHAR(500),
    pdf_key VARCHAR(500),
    status certificate_status_enum NOT NULL DEFAULT 'draft',
    issued_by BIGINT REFERENCES users(user_id),
    issued_at TIMESTAMP,
    approved_by BIGINT REFERENCES users(user_id),
    approved_at TIMESTAMP,
    revoked_by BIGINT REFERENCES users(user_id),
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    notes TEXT,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE certificates IS 'Issued certificates with placeholder values and PDF storage';
COMMENT ON COLUMN certificates.certificate_number IS 'Unique certificate number (e.g., MAR-2024-001)';
COMMENT ON COLUMN certificates.placeholder_values IS 'JSON object with placeholder values (e.g., {"name": "John Doe", "date": "2024-01-15"})';
COMMENT ON COLUMN certificates.pdf_url IS 'Cloudflare R2 URL for the generated PDF';
COMMENT ON COLUMN certificates.pdf_key IS 'Cloudflare R2 key for the PDF file';
COMMENT ON COLUMN certificates.status IS 'Current status of the certificate';

-- Create indexes
CREATE INDEX idx_certificates_parish_id ON certificates(parish_id);
CREATE INDEX idx_certificates_certificate_type_id ON certificates(certificate_type_id);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_parishioner_id ON certificates(parishioner_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issued_at ON certificates(issued_at);
CREATE INDEX idx_certificates_created_at ON certificates(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON certificates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create certificate_history table for audit trail
CREATE TABLE certificate_history (
    history_id BIGSERIAL PRIMARY KEY,
    certificate_id BIGINT NOT NULL REFERENCES certificates(certificate_id),
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('created', 'updated', 'approved', 'issued', 'revoked', 'cancelled', 'downloaded')
    ),
    old_status certificate_status_enum,
    new_status certificate_status_enum,
    changes JSONB,
    performed_by BIGINT REFERENCES users(user_id),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    notes TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE certificate_history IS 'Audit trail for all certificate actions';
COMMENT ON COLUMN certificate_history.changes IS 'JSON object with field-level changes';

-- Create indexes for history
CREATE INDEX idx_certificate_history_certificate_id ON certificate_history(certificate_id);
CREATE INDEX idx_certificate_history_action ON certificate_history(action);
CREATE INDEX idx_certificate_history_performed_at ON certificate_history(performed_at);
CREATE INDEX idx_certificate_history_performed_by ON certificate_history(performed_by);

-- Function to auto-generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number(
    p_certificate_type_id BIGINT
) RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(20);
    v_next_number INTEGER;
    v_certificate_number VARCHAR(100);
    v_year VARCHAR(4);
BEGIN
    -- Get prefix and increment next_number
    UPDATE certificate_types
    SET next_number = next_number + 1
    WHERE certificate_type_id = p_certificate_type_id
    RETURNING prefix, next_number - 1 INTO v_prefix, v_next_number;

    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

    -- Generate certificate number: PREFIX-YEAR-NUMBER (e.g., MAR-2024-001)
    v_certificate_number := COALESCE(v_prefix || '-', '') || v_year || '-' || LPAD(v_next_number::VARCHAR, 4, '0');

    RETURN v_certificate_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_certificate_number IS 'Generates a unique certificate number based on type prefix and year';

-- Add permissions
INSERT INTO permissions (permission_name, permission_code, description, module, action, is_active)
VALUES
  ('View Certificates', 'VIEW_CERTIFICATES', 'Can view issued certificates', 'Certificates', 'view', TRUE),
  ('Issue Certificate', 'ISSUE_CERTIFICATE', 'Can issue new certificates', 'Certificates', 'create', TRUE),
  ('Approve Certificate', 'APPROVE_CERTIFICATE', 'Can approve pending certificates', 'Certificates', 'approve', TRUE),
  ('Revoke Certificate', 'REVOKE_CERTIFICATE', 'Can revoke issued certificates', 'Certificates', 'revoke', TRUE),
  ('Download Certificate', 'DOWNLOAD_CERTIFICATE', 'Can download certificate PDFs', 'Certificates', 'download', TRUE),
  ('Manage Certificates', 'MANAGE_CERTIFICATES', 'Full management of certificates', 'Certificates', 'manage', TRUE),
  ('View Certificate History', 'VIEW_CERTIFICATE_HISTORY', 'Can view certificate audit history', 'Certificates', 'view', TRUE);

-- Grant permissions to Super Admin (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id
FROM permissions
WHERE permission_code IN (
    'VIEW_CERTIFICATES', 'ISSUE_CERTIFICATE', 'APPROVE_CERTIFICATE', 'REVOKE_CERTIFICATE',
    'DOWNLOAD_CERTIFICATE', 'MANAGE_CERTIFICATES', 'VIEW_CERTIFICATE_HISTORY'
);

-- Grant permissions to Church Admin (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id
FROM permissions
WHERE permission_code IN (
    'VIEW_CERTIFICATES', 'ISSUE_CERTIFICATE', 'APPROVE_CERTIFICATE', 'REVOKE_CERTIFICATE',
    'DOWNLOAD_CERTIFICATE', 'MANAGE_CERTIFICATES', 'VIEW_CERTIFICATE_HISTORY'
);

-- =====================================================
-- Migration Complete
-- =====================================================
