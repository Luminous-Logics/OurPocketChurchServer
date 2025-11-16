# Certificate Management Module

A comprehensive CRUD module for issuing and managing customizable certificates (Death, Marriage, Baptism, etc.) with dynamic placeholders and template support.

## Overview

This module allows parishes to:
- Define certificate types (Death, Marriage, Baptism, Confirmation, etc.)
- Create customizable HTML templates with placeholders
- Issue certificates to parishioners with personalized data
- Auto-generate certificate numbers
- Add church seals and signatures
- Approve certificates through workflow
- Revoke certificates when needed
- Track complete audit history

## Key Features

- ✅ **Certificate Types**: Create unlimited certificate types per parish
- ✅ **Dynamic Placeholders**: Add custom placeholders like `{{date}}`, `{{age}}`, `{{priest_name}}`
- ✅ **Template Integration**: Use HTML templates from the Templates module
- ✅ **Auto-numbering**: Automatic certificate number generation (e.g., `DEATH-2023-001`)
- ✅ **Workflow**: Draft → Pending Approval → Approved → Issued → Revoked
- ✅ **Customization**: Add church seals, signatures, and custom data
- ✅ **Audit Trail**: Complete history of all certificate changes
- ✅ **Role-based Access**: 11 permissions for granular control
- ✅ **Filtering & Search**: Filter by type, status, date range, recipient name

## Database Schema

### Tables Created

#### 1. `certificate_types`
Defines the types of certificates that can be issued.

**Key Fields:**
- `certificate_type_id` - Primary key
- `parish_id` - Foreign key to parishes
- `type_name` - Display name (e.g., "Death Certificate")
- `type_code` - Unique code (e.g., "DEATH")
- `default_template_id` - Optional default template
- `requires_approval` - Whether certificates need approval
- `auto_generate_number` - Enable auto-numbering
- `number_prefix` - Prefix for certificate numbers (e.g., "DEATH-")
- `number_format` - Format: `{PREFIX}{YEAR}-{NUMBER:3}`
- `available_placeholders` - JSON array of placeholder names

#### 2. `certificates`
Individual certificates issued to parishioners.

**Key Fields:**
- `certificate_id` - Primary key
- `parish_id` - Foreign key to parishes
- `certificate_type_id` - Type of certificate
- `certificate_number` - Unique identifier
- `recipient_parishioner_id` - Optional link to parishioner
- `recipient_name` - Name on certificate
- `template_id` - Template used
- `certificate_data` - JSON object with placeholder values
- `generated_html` - Final HTML with replacements
- `seal_image_url` - Church seal image
- `signature_image_url` - Signature image
- `signed_by` - Name of signer
- `issue_date` - Date of issuance
- `status` - Current status (draft, pending_approval, approved, issued, revoked, cancelled)
- `approved_by`, `approved_at` - Approval details
- `revoked_by`, `revoked_at`, `revocation_reason` - Revocation details

#### 3. `certificate_history`
Audit trail of all certificate changes.

**Fields:**
- `history_id` - Primary key
- `certificate_id` - Foreign key
- `action` - Type of action (created, updated, approved, issued, revoked)
- `old_status`, `new_status` - Status changes
- `changed_fields` - JSON array of changed field names
- `old_values`, `new_values` - Before/after values
- `performed_by` - User who made the change
- `performed_at` - Timestamp
- `reason` - Optional reason (e.g., for revocation)

## Permissions

11 new permissions added (IDs 141-151):

| ID | Code | Description |
|----|------|-------------|
| 141 | VIEW_CERTIFICATE_TYPES | View certificate types |
| 142 | CREATE_CERTIFICATE_TYPE | Create certificate types |
| 143 | EDIT_CERTIFICATE_TYPE | Edit certificate types |
| 144 | DELETE_CERTIFICATE_TYPE | Delete certificate types |
| 145 | VIEW_CERTIFICATES | View certificates |
| 146 | CREATE_CERTIFICATE | Create/issue certificates |
| 147 | EDIT_CERTIFICATE | Edit certificates |
| 148 | DELETE_CERTIFICATE | Delete certificates |
| 149 | APPROVE_CERTIFICATE | Approve certificates |
| 150 | REVOKE_CERTIFICATE | Revoke certificates |
| 151 | MANAGE_CERTIFICATES | Full certificate management |

**Assigned to:**
- ✅ Super Admin (all permissions)
- ✅ Church Admin (all permissions)

## Files Created

### 1. Migration
- **`migrations/002_add_certificates_module.sql`** - Complete database schema

### 2. TypeScript Types
- **`src/types/index.ts`** - Added:
  - `CertificateStatus` enum
  - `ICertificateType`, `ICertificateTypeInput`, `ICertificateTypeUpdate`
  - `ICertificate`, `ICertificateInput`, `ICertificateUpdate`
  - `ICertificateHistory`

### 3. Models
- **`src/models/CertificateType.ts`** - Certificate type operations
- **`src/models/Certificate.ts`** - Certificate operations with:
  - Placeholder replacement engine
  - Auto-numbering function
  - Audit logging
  - Approval workflow
  - Revocation handling

### 4. Validators (To be created)
- **`src/validators/certificate.validator.ts`** - Joi validation schemas

### 5. Controllers (To be created)
- **`src/controllers/certificateType.controller.ts`** - Certificate type handlers
- **`src/controllers/certificate.controller.ts`** - Certificate handlers

### 6. Routes (To be created)
- **`src/routes/certificate.routes.ts`** - API endpoints

## Installation & Setup

### Step 1: Run Database Migration

```bash
psql -U your_username -d your_database -f migrations/002_add_certificates_module.sql
```

### Step 2: Complete Implementation

The validators, controllers, and routes still need to be created. These will be added in the next step.

## Usage Examples

### Example 1: Death Certificate

#### Step 1: Create Certificate Type

```json
{
  "parish_id": 1,
  "type_name": "Death Certificate",
  "type_code": "DEATH",
  "description": "Certificate for deceased parishioners",
  "number_prefix": "DEATH-",
  "number_format": "{PREFIX}{YEAR}-{NUMBER:3}",
  "auto_generate_number": true,
  "requires_approval": true,
  "available_placeholders": [
    "recipient_name",
    "date_of_death",
    "age",
    "burial_place",
    "burial_date",
    "priest_name",
    "certificate_date",
    "certificate_number"
  ]
}
```

#### Step 2: Create Template (Using Templates Module)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Death Certificate</title>
    <style>
        body { font-family: Arial; padding: 40px; }
        .certificate { border: 3px solid #000; padding: 30px; }
        .header { text-align: center; font-size: 24px; font-weight: bold; }
        .seal { position: absolute; right: 50px; top: 50px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">Certificate of Death</div>
        <div class="seal">
            <img src="{{seal_url}}" width="100" />
        </div>

        <p><strong>This is to certify that</strong></p>
        <h2>{{recipient_name}}</h2>

        <p><strong>Date of Death:</strong> {{date_of_death}}</p>
        <p><strong>Age:</strong> {{age}} years</p>
        <p><strong>Burial Place:</strong> {{burial_place}}</p>
        <p><strong>Burial Date:</strong> {{burial_date}}</p>

        <br/><br/>
        <p><strong>Issued by:</strong> {{priest_name}}</p>
        <p><strong>Date:</strong> {{certificate_date}}</p>
        <p><strong>Certificate No:</strong> {{certificate_number}}</p>

        <div style="margin-top: 50px;">
            <img src="{{signature_url}}" width="150" />
            <p>Priest Signature</p>
        </div>
    </div>
</body>
</html>
```

#### Step 3: Issue Certificate

```json
{
  "parish_id": 1,
  "certificate_type_id": 1,
  "recipient_name": "Michael Smith",
  "recipient_parishioner_id": 25,
  "template_id": 5,
  "issue_date": "2023-07-20",
  "status": "draft",
  "certificate_data": {
    "date_of_death": "Jul 15, 2023",
    "age": "75",
    "burial_place": "Parish Cemetery",
    "burial_date": "Jul 18, 2023",
    "priest_name": "Fr. John Smith",
    "certificate_date": "Jul 20, 2023",
    "seal_url": "https://parish.com/seal.png",
    "signature_url": "https://parish.com/signature.png"
  },
  "seal_image_url": "https://parish.com/seal.png",
  "signature_image_url": "https://parish.com/signature.png",
  "signed_by": "Fr. John Smith",
  "notes": "Family requested additional copy"
}
```

**Generated Certificate Number:** `DEATH-2023-001`

### Example 2: Teacher Recognition Certificate

#### Certificate Type
```json
{
  "type_name": "Recognition Certificate",
  "type_code": "RECOGNITION",
  "number_prefix": "CERT-",
  "number_format": "{PREFIX}{YEAR}-{NUMBER:3}",
  "available_placeholders": [
    "recipient_name",
    "recognition_type",
    "date",
    "certificate_number",
    "signed_by"
  ]
}
```

#### Certificate Data
```json
{
  "recipient_name": "Mary Johnson",
  "certificate_data": {
    "recognition_type": "Teacher Recognition",
    "date": "Sep 10, 2023",
    "certificate_number": "CERT-2023-002",
    "signed_by": "Parish Administrator"
  }
}
```

## Certificate Workflow

### Status Flow

```
DRAFT
  ↓
PENDING_APPROVAL (if requires_approval = true)
  ↓
APPROVED
  ↓
ISSUED
  ↓
[REVOKED] (if needed)
```

### Actions by Status

| Status | Allowed Actions |
|--------|----------------|
| DRAFT | Edit, Delete, Submit for Approval |
| PENDING_APPROVAL | Approve, Reject |
| APPROVED | Issue |
| ISSUED | View, Download, Revoke |
| REVOKED | View only |

## Placeholder System

### How Placeholders Work

1. **Define Available Placeholders** in certificate type:
   ```json
   ["recipient_name", "date", "age", "priest_name"]
   ```

2. **Use in Template** with double curly braces:
   ```html
   <p>Name: {{recipient_name}}</p>
   <p>Date: {{date}}</p>
   ```

3. **Provide Values** when issuing certificate:
   ```json
   {
     "certificate_data": {
       "recipient_name": "John Doe",
       "date": "Jan 15, 2024",
       "age": "45",
       "priest_name": "Fr. Michael"
     }
   }
   ```

4. **System Generates** final HTML with replacements

### Common Placeholders

**Personal Information:**
- `recipient_name`, `age`, `gender`, `address`

**Dates:**
- `date`, `birth_date`, `death_date`, `marriage_date`, `issue_date`

**Locations:**
- `parish_name`, `church_name`, `burial_place`, `ceremony_location`

**Officials:**
- `priest_name`, `bishop_name`, `witness1_name`, `witness2_name`

**Certificate Details:**
- `certificate_number`, `issue_date`, `seal_url`, `signature_url`

## Auto-Numbering System

### Number Format Tokens

- `{PREFIX}` - Certificate type prefix
- `{YEAR}` - Current year (YYYY)
- `{MONTH}` - Current month (MM)
- `{NUMBER}` - Sequential number
- `{NUMBER:X}` - Sequential number with X digits (e.g., `{NUMBER:3}` → 001)

### Examples

| Format | Example Output |
|--------|----------------|
| `{PREFIX}{YEAR}-{NUMBER:3}` | DEATH-2024-001 |
| `{PREFIX}{YEAR}{MONTH}-{NUMBER:4}` | MARRIAGE-202401-0001 |
| `CERT-{YEAR}-{NUMBER}` | CERT-2024-1 |
| `{PREFIX}{NUMBER:5}` | BAPTISM-00001 |

### How It Works

The PostgreSQL function `generate_certificate_number()` automatically:
1. Gets the format from certificate type
2. Finds the next available number for this year
3. Formats the number with leading zeros
4. Returns the complete certificate number

## API Endpoints (To be created)

### Certificate Types
- `GET /api/certificates/types/parish/:parishId` - List types
- `GET /api/certificates/types/:id` - Get single type
- `POST /api/certificates/types` - Create type
- `PUT /api/certificates/types/:id` - Update type
- `DELETE /api/certificates/types/:id` - Delete type

### Certificates
- `GET /api/certificates/parish/:parishId` - List certificates
- `GET /api/certificates/:id` - Get single certificate
- `GET /api/certificates/number/:certificateNumber` - Get by number
- `POST /api/certificates` - Issue certificate
- `PUT /api/certificates/:id` - Update certificate
- `POST /api/certificates/:id/approve` - Approve certificate
- `POST /api/certificates/:id/revoke` - Revoke certificate
- `GET /api/certificates/:id/history` - Get audit history
- `DELETE /api/certificates/:id` - Delete draft certificate

## Security Features

✅ **Authentication Required** - All endpoints require JWT
✅ **Permission-based Access** - 11 granular permissions
✅ **Parish Isolation** - Certificates are parish-specific
✅ **Input Validation** - Joi schema validation
✅ **SQL Injection Protection** - Parameterized queries
✅ **Workflow Enforcement** - Status-based restrictions
✅ **Audit Trail** - Complete history logging
✅ **Template Validation** - Ensures templates belong to parish

## Advanced Features

### 1. Seal & Signature Images

Upload church seal and signature images, then reference them:

```json
{
  "seal_image_url": "https://cdn.parish.com/seal.png",
  "signature_image_url": "https://cdn.parish.com/signature.png",
  "signed_by": "Fr. John Smith"
}
```

Use in template:
```html
<img src="{{seal_url}}" />
<img src="{{signature_url}}" />
```

### 2. Public Certificates

Set `is_public: true` to make certificates viewable without authentication (useful for verification).

### 3. Parishioner Linking

Link certificates to parishioner records:

```json
{
  "recipient_parishioner_id": 123,
  "recipient_name": "John Doe"
}
```

### 4. Certificate History

Track every change made to a certificate:

```http
GET /api/certificates/123/history
```

Returns:
```json
[
  {
    "action": "created",
    "performed_by_name": "Admin User",
    "performed_at": "2024-01-01T10:00:00Z"
  },
  {
    "action": "approved",
    "old_status": "pending_approval",
    "new_status": "approved",
    "performed_by_name": "Fr. John",
    "performed_at": "2024-01-01T11:00:00Z"
  },
  {
    "action": "issued",
    "old_status": "approved",
    "new_status": "issued",
    "performed_by_name": "Admin User",
    "performed_at": "2024-01-01T12:00:00Z"
  }
]
```

## Best Practices

### 1. Certificate Type Design
- Use clear, descriptive names
- Define all needed placeholders upfront
- Set meaningful prefixes (e.g., "DEATH-", "MARRIAGE-")
- Enable auto-numbering for consistency

### 2. Template Design
- Include all essential information
- Use semantic HTML
- Make templates print-friendly
- Include church branding (seal, logo)
- Leave space for signatures

### 3. Certificate Issuance
- Always review before approving
- Verify recipient information
- Use consistent date formats
- Add meaningful notes for future reference

### 4. Revocation
- Always provide a reason when revoking
- Keep revoked certificates for audit trail
- Don't delete issued certificates

## Future Enhancements

Possible improvements:
- [ ] PDF generation from HTML certificates
- [ ] Bulk certificate issuance
- [ ] Email delivery to recipients
- [ ] QR code for certificate verification
- [ ] Certificate expiration dates
- [ ] Multi-language certificate support
- [ ] Certificate templates marketplace
- [ ] Digital signatures (cryptographic)
- [ ] Certificate analytics dashboard

## Troubleshooting

### Certificate Number Already Exists
- Ensure auto_generate_number is enabled
- Check for manual duplicates
- Verify database function is working

### Template Placeholders Not Replacing
- Check placeholder names match exactly
- Verify JSON structure in certificate_data
- Ensure template uses `{{placeholder}}` format

### Cannot Delete Certificate Type
- Check if any certificates use this type
- Use soft delete (set is_active = false) instead

## Support

- Review migration file for database schema
- Check model files for business logic
- Verify permissions are assigned to roles
- Check logs for detailed error messages

---

**Created:** 2025-11-16
**Version:** 1.0.0
**Status:** In Progress (Validators, Controllers, Routes pending)
