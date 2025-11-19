-- =====================================================
-- MIGRATION: Add Certificate Types Table
-- Created: 2025-11-18
-- Description: Creates the certificate_types table for managing
-- different types of certificates (Marriage, Baptism, etc.)
-- =====================================================

-- Create certificate_types table
CREATE TABLE certificate_types (
    certificate_type_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    template_id BIGINT NOT NULL REFERENCES templates(template_id),
    type_name VARCHAR(255) NOT NULL,
    type_code VARCHAR(100) NOT NULL,
    description TEXT,
    prefix VARCHAR(20),
    next_number INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (type_code, parish_id)
);

COMMENT ON TABLE certificate_types IS 'Types of certificates that can be issued (e.g., Marriage, Baptism)';
COMMENT ON COLUMN certificate_types.template_id IS 'Reference to the template used for this certificate type';
COMMENT ON COLUMN certificate_types.prefix IS 'Prefix for certificate number (e.g., MAR, BAP)';
COMMENT ON COLUMN certificate_types.next_number IS 'Next certificate number to be issued';
COMMENT ON COLUMN certificate_types.type_code IS 'Unique code for the certificate type within a parish';

-- Create indexes
CREATE INDEX idx_certificate_types_parish_id ON certificate_types(parish_id);
CREATE INDEX idx_certificate_types_template_id ON certificate_types(template_id);
CREATE INDEX idx_certificate_types_type_code ON certificate_types(type_code);
CREATE INDEX idx_certificate_types_is_active ON certificate_types(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_certificate_types_updated_at
BEFORE UPDATE ON certificate_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add permissions
INSERT INTO permissions (permission_name, permission_code, description, module, action, is_active)
VALUES
  ('View Certificate Types', 'VIEW_CERTIFICATE_TYPES', 'Can view certificate types', 'Certificate Types', 'view', TRUE),
  ('Create Certificate Type', 'CREATE_CERTIFICATE_TYPE', 'Can create new certificate types', 'Certificate Types', 'create', TRUE),
  ('Edit Certificate Type', 'EDIT_CERTIFICATE_TYPE', 'Can edit certificate types', 'Certificate Types', 'edit', TRUE),
  ('Delete Certificate Type', 'DELETE_CERTIFICATE_TYPE', 'Can delete certificate types', 'Certificate Types', 'delete', TRUE),
  ('Manage Certificate Types', 'MANAGE_CERTIFICATE_TYPES', 'Full management of certificate types', 'Certificate Types', 'manage', TRUE);

-- Grant permissions to Super Admin (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id
FROM permissions
WHERE permission_code IN ('VIEW_CERTIFICATE_TYPES', 'CREATE_CERTIFICATE_TYPE', 'EDIT_CERTIFICATE_TYPE', 'DELETE_CERTIFICATE_TYPE', 'MANAGE_CERTIFICATE_TYPES');

-- Grant permissions to Church Admin (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id
FROM permissions
WHERE permission_code IN ('VIEW_CERTIFICATE_TYPES', 'CREATE_CERTIFICATE_TYPE', 'EDIT_CERTIFICATE_TYPE', 'DELETE_CERTIFICATE_TYPE', 'MANAGE_CERTIFICATE_TYPES');

-- =====================================================
-- Migration Complete
-- =====================================================
