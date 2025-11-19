-- =====================================================
-- MIGRATION: Add Templates Table for Certificate Templates
-- Created: 2025-11-18
-- Description: Creates the templates table for storing HTML certificate templates
-- with placeholder support
-- =====================================================

-- Create templates table
CREATE TABLE templates (
    template_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id),
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(100) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    placeholders JSONB DEFAULT '[]'::JSONB,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (template_code, parish_id)
);

COMMENT ON TABLE templates IS 'HTML templates for certificates with placeholder support';
COMMENT ON COLUMN templates.html_content IS 'HTML content with placeholders in {{variableName}} format';
COMMENT ON COLUMN templates.placeholders IS 'JSON array of placeholder names extracted from HTML content';
COMMENT ON COLUMN templates.template_code IS 'Unique code for the template within a parish';

-- Create indexes
CREATE INDEX idx_templates_parish_id ON templates(parish_id);
CREATE INDEX idx_templates_template_code ON templates(template_code);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add permissions
INSERT INTO permissions (permission_name, permission_code, description, module, action, is_active)
VALUES
  ('View Templates', 'VIEW_TEMPLATES', 'Can view certificate templates', 'Templates', 'view', TRUE),
  ('Create Template', 'CREATE_TEMPLATE', 'Can create new certificate templates', 'Templates', 'create', TRUE),
  ('Edit Template', 'EDIT_TEMPLATE', 'Can edit certificate templates', 'Templates', 'edit', TRUE),
  ('Delete Template', 'DELETE_TEMPLATE', 'Can delete certificate templates', 'Templates', 'delete', TRUE),
  ('Manage Templates', 'MANAGE_TEMPLATES', 'Full management of certificate templates', 'Templates', 'manage', TRUE);

-- Grant permissions to Super Admin (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id
FROM permissions
WHERE permission_code IN ('VIEW_TEMPLATES', 'CREATE_TEMPLATE', 'EDIT_TEMPLATE', 'DELETE_TEMPLATE', 'MANAGE_TEMPLATES');

-- Grant permissions to Church Admin (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id
FROM permissions
WHERE permission_code IN ('VIEW_TEMPLATES', 'CREATE_TEMPLATE', 'EDIT_TEMPLATE', 'DELETE_TEMPLATE', 'MANAGE_TEMPLATES');

-- =====================================================
-- Migration Complete
-- =====================================================
