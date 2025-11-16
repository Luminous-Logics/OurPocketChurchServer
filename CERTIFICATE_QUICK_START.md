# Certificate Management Module - Quick Start Guide

## 🎉 Module Complete!

The Certificate Management Module is now fully implemented and ready to use.

## 📦 What Was Created

### Database (1 file)
- ✅ **migrations/002_add_certificates_module.sql** - Complete database schema
  - 3 tables: `certificate_types`, `certificates`, `certificate_history`
  - 11 permissions (IDs 141-151)
  - Auto-numbering function
  - Triggers and indexes

### TypeScript Types (1 file)
- ✅ **src/types/index.ts** - Updated with:
  - `CertificateStatus` enum
  - `ICertificateType`, `ICertificateTypeInput`, `ICertificateTypeUpdate`
  - `ICertificate`, `ICertificateInput`, `ICertificateUpdate`
  - `ICertificateHistory`

### Models (2 files)
- ✅ **src/models/CertificateType.ts** - Certificate type operations
- ✅ **src/models/Certificate.ts** - Certificate operations with:
  - Placeholder replacement engine
  - Auto-numbering
  - Audit logging
  - Workflow management

### Validators (1 file)
- ✅ **src/validators/certificate.validator.ts** - All Joi schemas

### Controllers (2 files)
- ✅ **src/controllers/certificateType.controller.ts** - Certificate type handlers
- ✅ **src/controllers/certificate.controller.ts** - Certificate handlers

### Routes (1 file)
- ✅ **src/routes/certificate.routes.ts** - Complete API with Swagger docs

### Updated Files (2 files)
- ✅ **src/routes/index.ts** - Routes registered
- ✅ **src/types/index.ts** - Types added

### Documentation (2 files)
- ✅ **CERTIFICATE_MODULE_README.md** - Complete documentation
- ✅ **CERTIFICATE_QUICK_START.md** - This file

## 🚀 Getting Started

### Step 1: Run Database Migration

```bash
psql -U your_username -d your_database -f migrations/002_add_certificates_module.sql
```

### Step 2: Restart Server

```bash
npm run dev
```

### Step 3: Access API

The certificate module is now available at:
- Base URL: `http://localhost:3000/api/certificates`
- Swagger Docs: `http://localhost:3000/api-docs`

## 📋 Quick Example: Death Certificate

### 1. Create Certificate Type

```bash
POST /api/certificates/types
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

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
    "certificate_date"
  ]
}
```

### 2. Create HTML Template (Using Template Module)

```bash
POST /api/templates
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "parish_id": 1,
  "template_name": "Death Certificate Template",
  "template_code": "DEATH_CERT",
  "category": "certificate",
  "html_content": "<!DOCTYPE html><html><head><style>body{font-family:Arial;padding:40px}.certificate{border:3px solid #000;padding:30px}.header{text-align:center;font-size:24px;font-weight:bold}</style></head><body><div class=\"certificate\"><div class=\"header\">Certificate of Death</div><h2>{{recipient_name}}</h2><p><strong>Date of Death:</strong> {{date_of_death}}</p><p><strong>Age:</strong> {{age}} years</p><p><strong>Burial Place:</strong> {{burial_place}}</p><p><strong>Burial Date:</strong> {{burial_date}}</p><p><strong>Issued by:</strong> {{priest_name}}</p><p><strong>Date:</strong> {{certificate_date}}</p><p><strong>Certificate No:</strong> {{certificate_number}}</p></div></body></html>"
}
```

### 3. Issue Certificate

```bash
POST /api/certificates
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "parish_id": 1,
  "certificate_type_id": 1,
  "recipient_name": "Michael Smith",
  "recipient_parishioner_id": 25,
  "template_id": 1,
  "issue_date": "2024-01-20",
  "status": "draft",
  "certificate_data": {
    "date_of_death": "Jul 15, 2023",
    "age": "75",
    "burial_place": "Parish Cemetery",
    "burial_date": "Jul 18, 2023",
    "priest_name": "Fr. John Smith",
    "certificate_date": "Jul 20, 2023"
  },
  "seal_image_url": "https://your-cdn.com/seal.png",
  "signature_image_url": "https://your-cdn.com/signature.png",
  "signed_by": "Fr. John Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate created successfully",
  "data": {
    "certificate_id": 1,
    "certificate_number": "DEATH-2024-001",
    "recipient_name": "Michael Smith",
    "status": "draft",
    "generated_html": "<html>...with all placeholders replaced...</html>"
  }
}
```

### 4. Approve Certificate (if requires_approval = true)

```bash
POST /api/certificates/1/approve
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. View Certificate History

```bash
GET /api/certificates/1/history
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔑 API Endpoints Summary

### Certificate Types
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/certificates/types/parish/:parishId` | VIEW_CERTIFICATE_TYPES | List types |
| GET | `/certificates/types/:id` | VIEW_CERTIFICATE_TYPES | Get single type |
| POST | `/certificates/types` | CREATE_CERTIFICATE_TYPE | Create type |
| PUT | `/certificates/types/:id` | EDIT_CERTIFICATE_TYPE | Update type |
| DELETE | `/certificates/types/:id` | DELETE_CERTIFICATE_TYPE | Deactivate type |
| DELETE | `/certificates/types/:id/permanent` | MANAGE_CERTIFICATES | Delete type |

### Certificates
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/certificates/parish/:parishId` | VIEW_CERTIFICATES | List certificates |
| GET | `/certificates/:id` | VIEW_CERTIFICATES | Get single certificate |
| GET | `/certificates/number/:certificateNumber` | VIEW_CERTIFICATES | Get by number |
| POST | `/certificates` | CREATE_CERTIFICATE | Issue certificate |
| PUT | `/certificates/:id` | EDIT_CERTIFICATE | Update certificate |
| POST | `/certificates/:id/approve` | APPROVE_CERTIFICATE | Approve |
| POST | `/certificates/:id/revoke` | REVOKE_CERTIFICATE | Revoke |
| GET | `/certificates/:id/history` | VIEW_CERTIFICATES | Get history |
| DELETE | `/certificates/:id` | DELETE_CERTIFICATE | Delete draft |

## 🎯 Key Features

### 1. Placeholder System
Define placeholders in certificate type, use in template, provide values when issuing:

```
Available: ["name", "date", "age"]
Template: "Name: {{name}}, Date: {{date}}, Age: {{age}}"
Data: {"name": "John", "date": "Jan 15", "age": "45"}
Result: "Name: John, Date: Jan 15, Age: 45"
```

### 2. Auto-Numbering
Automatic certificate number generation with customizable formats:

```
Format: "{PREFIX}{YEAR}-{NUMBER:3}"
Prefix: "DEATH-"
Output: DEATH-2024-001, DEATH-2024-002, etc.
```

### 3. Workflow
Status progression with approval control:

```
DRAFT → PENDING_APPROVAL → APPROVED → ISSUED → [REVOKED]
```

### 4. Audit Trail
Every change is logged in `certificate_history`:

```json
{
  "action": "approved",
  "old_status": "pending_approval",
  "new_status": "approved",
  "performed_by_name": "Fr. John Smith",
  "performed_at": "2024-01-15T10:30:00Z"
}
```

## 🔒 Permissions

All permissions are assigned to Super Admin and Church Admin by default:

| ID | Code | Description |
|----|------|-------------|
| 141 | VIEW_CERTIFICATE_TYPES | View types |
| 142 | CREATE_CERTIFICATE_TYPE | Create types |
| 143 | EDIT_CERTIFICATE_TYPE | Edit types |
| 144 | DELETE_CERTIFICATE_TYPE | Delete types |
| 145 | VIEW_CERTIFICATES | View certificates |
| 146 | CREATE_CERTIFICATE | Create certificates |
| 147 | EDIT_CERTIFICATE | Edit certificates |
| 148 | DELETE_CERTIFICATE | Delete certificates |
| 149 | APPROVE_CERTIFICATE | Approve certificates |
| 150 | REVOKE_CERTIFICATE | Revoke certificates |
| 151 | MANAGE_CERTIFICATES | Full management |

## 💡 Common Use Cases

### Death Certificates
```json
{
  "type_code": "DEATH",
  "available_placeholders": [
    "recipient_name", "date_of_death", "age",
    "burial_place", "burial_date", "priest_name"
  ]
}
```

### Marriage Certificates
```json
{
  "type_code": "MARRIAGE",
  "available_placeholders": [
    "groom_name", "bride_name", "marriage_date",
    "church_name", "priest_name", "witness1", "witness2"
  ]
}
```

### Baptism Certificates
```json
{
  "type_code": "BAPTISM",
  "available_placeholders": [
    "child_name", "baptism_date", "parents_names",
    "godparents_names", "priest_name"
  ]
}
```

### Recognition/Achievement Certificates
```json
{
  "type_code": "RECOGNITION",
  "available_placeholders": [
    "recipient_name", "achievement", "date",
    "organization", "signed_by"
  ]
}
```

## 🛠️ Advanced Features

### 1. Seal & Signature Images
Upload images and reference in templates:

```html
<img src="{{seal_url}}" width="100" />
<img src="{{signature_url}}" width="150" />
```

Provide URLs when issuing:
```json
{
  "seal_image_url": "https://cdn.parish.com/seal.png",
  "signature_image_url": "https://cdn.parish.com/signature.png"
}
```

### 2. Link to Parishioners
```json
{
  "recipient_parishioner_id": 123,
  "recipient_name": "John Doe"
}
```

### 3. Public Certificates
Make certificates viewable without authentication:
```json
{
  "is_public": true
}
```

### 4. Custom Number Formats

| Format | Example |
|--------|---------|
| `{PREFIX}{YEAR}-{NUMBER:3}` | DEATH-2024-001 |
| `{PREFIX}{YEAR}{MONTH}-{NUMBER:4}` | MARRIAGE-202401-0001 |
| `CERT-{YEAR}-{NUMBER}` | CERT-2024-1 |

## 📊 Filtering & Searching

### Filter Certificates
```bash
GET /api/certificates/parish/1?
  certificateTypeId=1&
  status=issued&
  recipientName=Smith&
  issueDateFrom=2024-01-01&
  issueDateTo=2024-12-31&
  page=1&
  limit=20
```

## ⚠️ Important Notes

1. **Only draft certificates can be deleted** - Others must be revoked
2. **Certificate types with existing certificates cannot be hard deleted** - Use soft delete
3. **Certificate numbers are unique** - Auto-generation prevents duplicates
4. **Revocation requires a reason** - For audit purposes
5. **Template placeholders are case-sensitive** - Use exact names

## 🐛 Troubleshooting

### Certificate Number Already Exists
- Enable `auto_generate_number` in certificate type
- Don't provide manual `certificate_number` when creating

### Placeholders Not Replacing
- Check placeholder names match exactly
- Verify `certificate_data` is a valid JSON object
- Ensure template uses `{{placeholder}}` format

### Cannot Approve Certificate
- Check status is `pending_approval`
- Verify user has `APPROVE_CERTIFICATE` permission

### Cannot Delete Certificate Type
- Check if certificates exist using this type
- Use soft delete (set `is_active = false`) instead

## 📚 Additional Resources

- **Full Documentation:** [CERTIFICATE_MODULE_README.md](CERTIFICATE_MODULE_README.md)
- **Template Module:** [TEMPLATE_MODULE_README.md](TEMPLATE_MODULE_README.md)
- **API Documentation:** http://localhost:3000/api-docs
- **Database Schema:** [migrations/002_add_certificates_module.sql](migrations/002_add_certificates_module.sql)

## ✅ Verification Checklist

Before using in production:

- [ ] Run database migration
- [ ] Restart server
- [ ] Test certificate type creation
- [ ] Test template creation
- [ ] Test certificate issuance
- [ ] Test approval workflow
- [ ] Test revocation
- [ ] Review audit history
- [ ] Verify permissions
- [ ] Test filtering and search

## 🎉 You're All Set!

The Certificate Management Module is ready to use. Start by creating your first certificate type and template!

---

**Module Version:** 1.0.0
**Created:** 2025-11-16
**Status:** ✅ Complete and Ready
