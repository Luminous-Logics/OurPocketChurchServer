-- =====================================================
-- Template Management Module
-- Migration: Add HTML Templates Table
-- Created: 2025-11-16
-- =====================================================

-- Create templates table
CREATE TABLE templates (
    template_id BIGSERIAL PRIMARY KEY,
    parish_id BIGINT NOT NULL REFERENCES parishes(parish_id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(100) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    category VARCHAR(50),

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique template codes within a parish
    UNIQUE (parish_id, template_code)
);

COMMENT ON TABLE templates IS 'HTML templates for various parish communications and documents';
COMMENT ON COLUMN templates.template_code IS 'Unique code identifier for the template within a parish';
COMMENT ON COLUMN templates.html_content IS 'HTML content of the template';
COMMENT ON COLUMN templates.category IS 'Category of template (e.g., newsletter, bulletin, announcement, certificate)';

-- Create indexes
CREATE INDEX idx_templates_parish_id ON templates(parish_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_created_by ON templates(created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Add Template Management Permissions
-- =====================================================

INSERT INTO permissions (permission_id, permission_name, permission_code, description, module, action, is_active)
VALUES
  (131, 'View Templates', 'VIEW_TEMPLATES', 'Can view HTML templates', 'Templates', 'view', TRUE),
  (132, 'Create Template', 'CREATE_TEMPLATE', 'Can create new HTML templates', 'Templates', 'create', TRUE),
  (133, 'Edit Template', 'EDIT_TEMPLATE', 'Can edit HTML templates', 'Templates', 'edit', TRUE),
  (134, 'Delete Template', 'DELETE_TEMPLATE', 'Can delete HTML templates', 'Templates', 'delete', TRUE),
  (135, 'Manage Templates', 'MANAGE_TEMPLATES', 'Full template management', 'Templates', 'manage', TRUE);

-- Update sequence for permissions
SELECT setval('permissions_permission_id_seq', (SELECT MAX(permission_id) FROM permissions));

-- =====================================================
-- Assign Template Permissions to Roles
-- =====================================================

-- SUPER ADMIN: All template permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  (1, 131), (1, 132), (1, 133), (1, 134), (1, 135);

-- CHURCH ADMIN: All template permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  (2, 131), (2, 132), (2, 133), (2, 134), (2, 135);

-- =====================================================
-- Migration Complete
-- =====================================================
