# Template Management Module

A complete CRUD module for managing HTML templates in the Parish Management System.

## Overview

This module allows parishes to create, manage, and organize HTML templates for various purposes such as newsletters, bulletins, announcements, certificates, and more.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Soft delete and hard delete support
- ✅ Template categorization
- ✅ Search functionality
- ✅ Pagination support
- ✅ Parish-specific templates
- ✅ Unique template codes per parish
- ✅ Role-based access control
- ✅ Complete API documentation (Swagger)
- ✅ Input validation with Joi
- ✅ TypeScript support

## Files Created

### 1. Database Migration
**File:** `migrations/001_add_templates_table.sql`

Creates the `templates` table with the following structure:
- `template_id` (Primary Key)
- `parish_id` (Foreign Key to parishes)
- `template_name` (Template name)
- `template_code` (Unique code within parish)
- `description` (Optional description)
- `html_content` (HTML content)
- `category` (Template category)
- `is_active` (Active status)
- `created_by` (User who created it)
- `created_at` & `updated_at` (Timestamps)

Also creates 5 new permissions:
- `VIEW_TEMPLATES` (131)
- `CREATE_TEMPLATE` (132)
- `EDIT_TEMPLATE` (133)
- `DELETE_TEMPLATE` (134)
- `MANAGE_TEMPLATES` (135)

### 2. TypeScript Types
**File:** `src/types/index.ts`

Added interfaces:
- `ITemplate` - Main template interface
- `ITemplateInput` - Input data for creating templates
- `ITemplateUpdate` - Update data for templates

### 3. Model Layer
**File:** `src/models/Template.ts`

Database operations:
- `findById(templateId)` - Get template by ID
- `findByParishId(parishId, page, limit, category, isActive)` - List templates with pagination
- `countByParishId(parishId, category, isActive)` - Count templates
- `findByCode(parishId, templateCode)` - Find by unique code
- `create(templateData)` - Create new template
- `update(templateId, updateData)` - Update template
- `softDelete(templateId)` - Soft delete (set is_active = false)
- `hardDelete(templateId)` - Permanent deletion
- `search(parishId, searchTerm, page, limit)` - Search templates
- `getCategories(parishId)` - Get all unique categories

### 4. Validators
**File:** `src/validators/template.validator.ts`

Joi validation schemas:
- `createTemplateSchema` - Validate template creation
- `updateTemplateSchema` - Validate template updates
- `templateIdSchema` - Validate template ID param
- `templatesByParishSchema` - Validate parish listing params
- `searchTemplatesSchema` - Validate search params
- `templateCategoriesSchema` - Validate categories params

**Template Code Format:** Must be uppercase letters, numbers, and underscores only (e.g., `WEEKLY_BULLETIN`, `NEWSLETTER_2024`)

### 5. Controller
**File:** `src/controllers/template.controller.ts`

HTTP request handlers:
- `getByParishId` - List templates for a parish
- `getById` - Get single template
- `create` - Create new template
- `update` - Update template
- `delete` - Soft delete template
- `hardDelete` - Permanently delete template
- `search` - Search templates
- `getCategories` - Get template categories

### 6. Routes
**File:** `src/routes/template.routes.ts`

API endpoints with authentication and authorization:

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/templates/parish/:parishId` | VIEW_TEMPLATES | List templates for parish |
| GET | `/api/templates/parish/:parishId/search` | VIEW_TEMPLATES | Search templates |
| GET | `/api/templates/parish/:parishId/categories` | VIEW_TEMPLATES | Get categories |
| GET | `/api/templates/:id` | VIEW_TEMPLATES | Get single template |
| POST | `/api/templates` | CREATE_TEMPLATE | Create template |
| PUT | `/api/templates/:id` | EDIT_TEMPLATE | Update template |
| DELETE | `/api/templates/:id` | DELETE_TEMPLATE | Soft delete |
| DELETE | `/api/templates/:id/permanent` | MANAGE_TEMPLATES | Hard delete |

All routes require authentication via JWT token.

### 7. Routes Registration
**File:** `src/routes/index.ts`

Template routes are registered at `/api/templates`

## Installation & Setup

### Step 1: Run Database Migration

Execute the migration file to create the templates table and permissions:

```bash
# Using psql
psql -U your_username -d your_database -f migrations/001_add_templates_table.sql

# Or using your database client
```

### Step 2: Restart the Server

The code changes are already integrated. Just restart your server:

```bash
npm run dev
```

## API Usage Examples

### 1. Create a Template

```bash
POST /api/templates
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "parish_id": 1,
  "template_name": "Weekly Bulletin Template",
  "template_code": "WEEKLY_BULLETIN",
  "description": "Template for weekly parish bulletin",
  "html_content": "<html><body><h1>{{title}}</h1><p>{{content}}</p></body></html>",
  "category": "bulletin",
  "is_active": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "template_id": 1,
    "parish_id": 1,
    "template_name": "Weekly Bulletin Template",
    "template_code": "WEEKLY_BULLETIN",
    "description": "Template for weekly parish bulletin",
    "html_content": "<html><body><h1>{{title}}</h1><p>{{content}}</p></body></html>",
    "category": "bulletin",
    "is_active": true,
    "created_by": 5,
    "created_at": "2025-11-16T10:00:00Z",
    "updated_at": "2025-11-16T10:00:00Z"
  }
}
```

### 2. List Templates for a Parish

```bash
GET /api/templates/parish/1?page=1&limit=20&category=bulletin&isActive=true
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "template_id": 1,
      "parish_id": 1,
      "template_name": "Weekly Bulletin Template",
      "template_code": "WEEKLY_BULLETIN",
      "html_content": "<html>...</html>",
      "category": "bulletin",
      "is_active": true,
      "created_at": "2025-11-16T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalRecords": 1,
    "totalPages": 1
  }
}
```

### 3. Get Single Template

```bash
GET /api/templates/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "template_id": 1,
    "parish_id": 1,
    "template_name": "Weekly Bulletin Template",
    "template_code": "WEEKLY_BULLETIN",
    "html_content": "<html>...</html>",
    "category": "bulletin",
    "is_active": true
  }
}
```

### 4. Update Template

```bash
PUT /api/templates/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "template_name": "Updated Bulletin Template",
  "html_content": "<html><body><h1>{{title}}</h1><p>{{body}}</p></body></html>"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template updated successfully",
  "data": {
    "template_id": 1,
    "template_name": "Updated Bulletin Template",
    "html_content": "<html><body><h1>{{title}}</h1><p>{{body}}</p></body></html>",
    "updated_at": "2025-11-16T11:00:00Z"
  }
}
```

### 5. Search Templates

```bash
GET /api/templates/parish/1/search?q=bulletin&page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "template_id": 1,
      "template_name": "Weekly Bulletin Template",
      "template_code": "WEEKLY_BULLETIN",
      "category": "bulletin"
    }
  ]
}
```

### 6. Get Template Categories

```bash
GET /api/templates/parish/1/categories
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": ["bulletin", "newsletter", "announcement", "certificate"]
}
```

### 7. Delete Template (Soft Delete)

```bash
DELETE /api/templates/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### 8. Permanently Delete Template

```bash
DELETE /api/templates/1/permanent
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template permanently deleted"
}
```

## Permissions

Users need the following permissions to access template endpoints:

- **VIEW_TEMPLATES** - Required to view templates
- **CREATE_TEMPLATE** - Required to create templates
- **EDIT_TEMPLATE** - Required to update templates
- **DELETE_TEMPLATE** - Required to soft delete templates
- **MANAGE_TEMPLATES** - Required to permanently delete templates

By default, these permissions are assigned to:
- ✅ Super Admin (all permissions)
- ✅ Church Admin (all permissions)

## Template Code Guidelines

Template codes must follow these rules:
- Uppercase letters only
- Numbers allowed
- Underscores allowed for separation
- No spaces or special characters
- Must be unique within a parish
- Maximum 100 characters

**Good Examples:**
- `WEEKLY_BULLETIN`
- `CHRISTMAS_NEWSLETTER_2024`
- `BAPTISM_CERTIFICATE`
- `WEDDING_INVITATION`

**Bad Examples:**
- `weekly bulletin` (lowercase, space)
- `newsletter-2024` (hyphen not allowed)
- `Bulletin Template` (mixed case, space)

## Suggested Template Categories

While categories are optional and can be any string, here are some common suggestions:

- `bulletin` - Weekly/monthly bulletins
- `newsletter` - Parish newsletters
- `announcement` - Special announcements
- `certificate` - Sacrament certificates
- `invitation` - Event invitations
- `letter` - Official letters
- `report` - Reports and statements
- `form` - Forms and applications
- `flyer` - Event flyers
- `program` - Event programs

## Template Variables

The HTML content can include variables using double curly braces `{{variable}}`. Common variables might include:

- `{{parish_name}}`
- `{{title}}`
- `{{content}}`
- `{{date}}`
- `{{event_name}}`
- `{{recipient_name}}`

## Security Features

✅ **Authentication Required** - All endpoints require valid JWT token
✅ **Permission-based Access** - Role-based access control
✅ **Input Validation** - Joi schema validation
✅ **SQL Injection Protection** - Parameterized queries
✅ **XSS Protection** - HTML content is stored as-is (sanitize on render)
✅ **Parish Isolation** - Templates are parish-specific

## Error Handling

The module uses standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Template code already exists for this parish"
}
```

Common error codes:
- **400** - Bad Request (invalid data)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (template doesn't exist)
- **409** - Conflict (duplicate template code)
- **500** - Internal Server Error

## Testing

You can test the API using:

1. **Postman/Insomnia** - Import the Swagger documentation
2. **Swagger UI** - Visit `/api-docs` on your server
3. **cURL** - Use the examples above

## Swagger Documentation

Full API documentation is available at:
```
http://localhost:3000/api-docs
```

Look for the "Templates" tag in Swagger UI for interactive documentation.

## Future Enhancements

Possible future improvements:
- [ ] Template versioning
- [ ] Template preview rendering
- [ ] Template cloning/duplication
- [ ] Template sharing between parishes
- [ ] Template marketplace
- [ ] Variable validation
- [ ] HTML sanitization options
- [ ] Template usage analytics

## Support

For issues or questions:
1. Check the API documentation at `/api-docs`
2. Review this README
3. Check the server logs for errors
4. Verify database migration was successful

## License

Part of the Parish Nexus Flow API system.

---

**Created:** 2025-11-16
**Version:** 1.0.0
