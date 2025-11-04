import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Parish Nexus Flow API',
    version: '1.0.0',
    description:
      'A comprehensive Parish Management System API built with Node.js, Express, TypeScript, and SQL Server. ' +
      'This API provides endpoints for managing parishes, parishioners, events, donations, sacraments, and more.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@parishnexusflow.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/${config.apiVersion}`,
      description: 'Development server',
    },
    {
      url: `https://api.parishnexusflow.com/api/${config.apiVersion}`,
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Parishes',
      description: 'Parish management endpoints',
    },
    {
      name: 'Wards',
      description: 'Ward (geographical division) management endpoints',
    },
    {
      name: 'Families',
      description: 'Family management endpoints',
    },
    {
      name: 'Parishioners',
      description: 'Parishioner management endpoints',
    },
    {
      name: 'Events',
      description: 'Event and activity management endpoints',
    },
    {
      name: 'Donations',
      description: 'Donation and financial tracking endpoints',
    },
    {
      name: 'Sacraments',
      description: 'Sacrament record management endpoints',
    },
    {
      name: 'Mass Schedule',
      description: 'Mass schedule and intention management endpoints',
    },
    {
      name: 'Health',
      description: 'API health and status endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from login endpoint',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          user_id: {
            type: 'integer',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          first_name: {
            type: 'string',
            example: 'John',
          },
          last_name: {
            type: 'string',
            example: 'Doe',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          profile_image_url: {
            type: 'string',
            example: 'https://example.com/image.jpg',
          },
          user_type: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'CHURCH_ADMIN', 'parishioner'],
            example: 'parishioner',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          email_verified: {
            type: 'boolean',
            example: true,
          },
          last_login: {
            type: 'string',
            format: 'date-time',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      UserRegistration: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name', 'user_type'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'SecurePass123!',
            description: 'Must be at least 8 characters with uppercase, lowercase, number, and special character',
          },
          first_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'John',
          },
          last_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'Doe',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          user_type: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'CHURCH_ADMIN', 'parishioner'],
            example: 'parishioner',
          },
          parish_id: {
            type: 'integer',
            example: 1,
          },
          profile_image_url:{
            type: 'string',
            example: 'https://example.com/image.jpg',
          
          }
        },
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'SecurePass123!',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                description: 'JWT token valid for 30 days',
              },
              user: {
                type: 'object',
                properties: {
                  user_id: {
                    type: 'integer',
                    example: 1,
                  },
                  email: {
                    type: 'string',
                    example: 'user@example.com',
                  },
                  first_name: {
                    type: 'string',
                    example: 'John',
                  },
                  last_name: {
                    type: 'string',
                    example: 'Doe',
                  },
                  user_type: {
                    type: 'string',
                    example: 'parishioner',
                  },
                },
              },
            },
          },
        },
      },
      ChangePassword: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            example: 'OldPass123!',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'NewPass123!',
          },
        },
      },
      Parish: {
        type: 'object',
        properties: {
          parish_id: {
            type: 'integer',
            example: 1,
          },
          parish_name: {
            type: 'string',
            example: 'St. Mary Parish',
          },
          diocese: {
            type: 'string',
            example: 'Diocese of Springfield',
          },
          address_line1: {
            type: 'string',
            example: '123 Church Street',
          },
          address_line2: {
            type: 'string',
            example: 'Suite 100',
          },
          city: {
            type: 'string',
            example: 'Springfield',
          },
          state: {
            type: 'string',
            example: 'Illinois',
          },
          country: {
            type: 'string',
            example: 'USA',
          },
          postal_code: {
            type: 'string',
            example: '62701',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'info@stmary.org',
          },
          website_url: {
            type: 'string',
            format: 'uri',
            example: 'https://www.stmary.org',
          },
          established_date: {
            type: 'string',
            format: 'date',
            example: '1950-01-15',
          },
          patron_saint: {
            type: 'string',
            example: 'St. Mary',
          },
          timezone: {
            type: 'string',
            example: 'America/Chicago',
          },
          subscription_plan: {
            type: 'string',
            example: 'premium',
          },
          subscription_expiry: {
            type: 'string',
            format: 'date',
            example: '2025-12-31',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateParish: {
        type: 'object',
        required: ['parish_name'],
        properties: {
          parish_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            example: 'St. Mary Parish',
            description: 'Name of the parish',
          },
          diocese: {
            type: 'string',
            maxLength: 200,
            example: 'Diocese of Springfield',
            description: 'Diocese the parish belongs to',
          },
          address_line1: {
            type: 'string',
            maxLength: 200,
            example: '123 Church Street',
            description: 'Primary address line',
          },
          address_line2: {
            type: 'string',
            maxLength: 200,
            example: 'Suite 100',
            description: 'Secondary address line',
          },
          city: {
            type: 'string',
            maxLength: 100,
            example: 'Springfield',
          },
          state: {
            type: 'string',
            maxLength: 100,
            example: 'Illinois',
          },
          country: {
            type: 'string',
            maxLength: 100,
            example: 'USA',
          },
          postal_code: {
            type: 'string',
            maxLength: 20,
            example: '62701',
          },
          phone: {
            type: 'string',
            maxLength: 20,
            example: '+1234567890',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'info@stmary.org',
          },
          website_url: {
            type: 'string',
            format: 'uri',
            example: 'https://www.stmary.org',
          },
          established_date: {
            type: 'string',
            format: 'date',
            example: '1950-01-15',
            description: 'Date the parish was established',
          },
          patron_saint: {
            type: 'string',
            maxLength: 200,
            example: 'St. Mary',
            description: 'Patron saint of the parish',
          },
          timezone: {
            type: 'string',
            maxLength: 50,
            example: 'America/Chicago',
            default: 'UTC',
            description: 'Timezone for the parish',
          },
          subscription_plan: {
            type: 'string',
            maxLength: 50,
            example: 'premium',
            description: 'Subscription plan (e.g., basic, premium, enterprise)',
          },
          subscription_expiry: {
            type: 'string',
            format: 'date',
            example: '2025-12-31',
            description: 'Date when the subscription expires',
          },
          admin_email: {
            type: 'string',
            format: 'email',
            example: 'admin@stmary.org',
            description: '(Optional) Email for the church admin account - if provided, creates a church admin user',
          },
          admin_password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'SecurePass123!',
            description: '(Optional) Password for the church admin - required if admin_email is provided',
          },
          admin_first_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'John',
            description: '(Optional) First name of the church admin - required if admin_email is provided',
          },
          admin_last_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'Smith',
            description: '(Optional) Last name of the church admin - required if admin_email is provided',
          },
          admin_phone: {
            type: 'string',
            example: '+1234567890',
            description: '(Optional) Phone number for the church admin',
          },
          admin_role: {
            type: 'string',
            maxLength: 100,
            example: 'Pastor',
            description: '(Optional) Role/title of the church admin (e.g., Pastor, Administrator, Secretary)',
          },
          admin_department: {
            type: 'string',
            maxLength: 100,
            example: 'Administration',
            description: '(Optional) Department of the church admin (e.g., Administration, Finance)',
          },
        },
        description: 'Creates a new parish. Optionally creates a church admin account if admin details are provided (admin_email, admin_password, admin_first_name, and admin_last_name are required together).',
      },
      UpdateParish: {
        type: 'object',
        properties: {
          parish_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            example: 'St. Mary Parish',
          },
          diocese: {
            type: 'string',
            maxLength: 200,
            example: 'Diocese of Springfield',
          },
          address_line1: {
            type: 'string',
            maxLength: 200,
            example: '123 Church Street',
          },
          address_line2: {
            type: 'string',
            maxLength: 200,
            example: 'Suite 100',
          },
          city: {
            type: 'string',
            maxLength: 100,
            example: 'Springfield',
          },
          state: {
            type: 'string',
            maxLength: 100,
            example: 'Illinois',
          },
          country: {
            type: 'string',
            maxLength: 100,
            example: 'USA',
          },
          postal_code: {
            type: 'string',
            maxLength: 20,
            example: '62701',
          },
          phone: {
            type: 'string',
            maxLength: 20,
            example: '+1234567890',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'info@stmary.org',
          },
          website_url: {
            type: 'string',
            format: 'uri',
            example: 'https://www.stmary.org',
          },
          established_date: {
            type: 'string',
            format: 'date',
            example: '1950-01-15',
          },
          patron_saint: {
            type: 'string',
            maxLength: 200,
            example: 'St. Mary',
          },
          timezone: {
            type: 'string',
            maxLength: 50,
            example: 'America/Chicago',
          },
          subscription_plan: {
            type: 'string',
            maxLength: 50,
            example: 'premium',
          },
          subscription_expiry: {
            type: 'string',
            format: 'date',
            example: '2025-12-31',
          },
          is_active: {
            type: 'boolean',
            example: true,
            description: 'Whether the parish is active',
          },
        },
        description: 'At least one field must be provided for update',
      },
      PaginatedParishResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Parish',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: {
                type: 'integer',
                example: 1,
              },
              pageSize: {
                type: 'integer',
                example: 20,
              },
              totalRecords: {
                type: 'integer',
                example: 100,
              },
              totalPages: {
                type: 'integer',
                example: 5,
              },
            },
          },
        },
      },
      Ward: {
        type: 'object',
        properties: {
          ward_id: {
            type: 'integer',
            example: 1,
          },
          parish_id: {
            type: 'integer',
            example: 1,
          },
          ward_name: {
            type: 'string',
            example: 'Ward 1 - North',
          },
          ward_number: {
            type: 'string',
            example: 'W001',
          },
          description: {
            type: 'string',
            example: 'Northern area of the parish covering downtown neighborhoods',
          },
          coordinator_id: {
            type: 'integer',
            example: 1,
            description: 'Parishioner ID who coordinates this ward (a regular parish member chosen as ward leader)',
          },
          area_coverage: {
            type: 'string',
            example: 'Main Street, Oak Avenue, Maple Drive neighborhoods',
          },
          total_families: {
            type: 'integer',
            example: 50,
          },
          total_members: {
            type: 'integer',
            example: 200,
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateWard: {
        type: 'object',
        required: ['parish_id', 'ward_name'],
        properties: {
          parish_id: {
            type: 'integer',
            example: 1,
            description: 'ID of the parish this ward belongs to',
          },
          ward_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            example: 'Ward 1 - North',
            description: 'Name of the ward',
          },
          ward_number: {
            type: 'string',
            maxLength: 50,
            example: 'W001',
            description: 'Ward number or code (must be unique within parish)',
          },
          description: {
            type: 'string',
            example: 'Northern area of the parish',
            description: 'Description of the ward',
          },
          coordinator_id: {
            type: 'integer',
            example: 1,
            description: '(Optional) Parishioner ID of the member who will coordinate this ward (must be an active parishioner from the same parish)',
          },
          area_coverage: {
            type: 'string',
            example: 'Main Street, Oak Avenue neighborhoods',
            description: 'Geographic boundaries or neighborhoods covered',
          },
        },
      },
      UpdateWard: {
        type: 'object',
        properties: {
          ward_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            example: 'Ward 1 - North',
          },
          ward_number: {
            type: 'string',
            maxLength: 50,
            example: 'W001',
          },
          description: {
            type: 'string',
            example: 'Northern area of the parish',
          },
          coordinator_id: {
            type: 'integer',
            example: 1,
            nullable: true,
            description: 'Parishioner ID - set to null to remove coordinator (must be an active parishioner from the same parish)',
          },
          area_coverage: {
            type: 'string',
            example: 'Main Street, Oak Avenue neighborhoods',
          },
          is_active: {
            type: 'boolean',
            example: true,
            description: 'Whether the ward is active',
          },
        },
        description: 'At least one field must be provided for update',
      },
      PaginatedWardResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Ward',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: {
                type: 'integer',
                example: 1,
              },
              pageSize: {
                type: 'integer',
                example: 20,
              },
              totalRecords: {
                type: 'integer',
                example: 50,
              },
              totalPages: {
                type: 'integer',
                example: 3,
              },
            },
          },
        },
      },
      Family: {
        type: 'object',
        properties: {
          family_id: {
            type: 'integer',
            example: 1,
          },
          parish_id: {
            type: 'integer',
            example: 1,
          },
          ward_id: {
            type: 'integer',
            example: 1,
            nullable: true,
          },
          family_name: {
            type: 'string',
            example: 'The Smith Family',
          },
          primary_contact_id: {
            type: 'integer',
            example: 5,
            nullable: true,
            description: 'Parishioner ID of the primary contact/family head',
          },
          home_phone: {
            type: 'string',
            example: '+1234567890',
          },
          registration_date: {
            type: 'string',
            format: 'date',
            example: '2023-01-15',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateFamily: {
        type: 'object',
        required: ['parish_id', 'family_name'],
        properties: {
          parish_id: {
            type: 'integer',
            example: 1,
            description: 'ID of the parish this family belongs to',
          },
          ward_id: {
            type: 'integer',
            example: 1,
            description: '(Optional) ID of the ward this family is assigned to',
          },
          family_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            example: 'The Smith Family',
            description: 'Name of the family',
          },
          primary_contact_id: {
            type: 'integer',
            example: 5,
            description: '(Optional) Parishioner ID of the primary contact person (must be an active parishioner from the same parish)',
          },
          home_phone: {
            type: 'string',
            maxLength: 20,
            example: '+1234567890',
            description: 'Family home phone number',
          },
          registration_date: {
            type: 'string',
            format: 'date',
            example: '2023-01-15',
            description: 'Date the family registered',
          },
        },
      },
      UpdateFamily: {
        type: 'object',
        properties: {
          ward_id: {
            type: 'integer',
            example: 1,
            nullable: true,
            description: 'Ward ID - set to null to unassign from ward',
          },
          family_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            example: 'The Smith Family',
          },
          primary_contact_id: {
            type: 'integer',
            example: 5,
            nullable: true,
            description: 'Parishioner ID - set to null to remove primary contact',
          },
          home_phone: {
            type: 'string',
            maxLength: 20,
            example: '+1234567890',
            nullable: true,
          },
          registration_date: {
            type: 'string',
            format: 'date',
            example: '2023-01-15',
          },
          is_active: {
            type: 'boolean',
            example: true,
            description: 'Whether the family is active',
          },
        },
        description: 'At least one field must be provided for update',
      },
      PaginatedFamilyResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Family',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: {
                type: 'integer',
                example: 1,
              },
              pageSize: {
                type: 'integer',
                example: 20,
              },
              totalRecords: {
                type: 'integer',
                example: 75,
              },
              totalPages: {
                type: 'integer',
                example: 4,
              },
            },
          },
        },
      },
      Parishioner: {
        type: 'object',
        properties: {
          parishioner_id: {
            type: 'integer',
            example: 1,
          },
          user_id: {
            type: 'integer',
            example: 5,
            description: 'User account ID linked to this parishioner',
          },
          parish_id: {
            type: 'integer',
            example: 1,
          },
          ward_id: {
            type: 'integer',
            example: 1,
            nullable: true,
          },
          family_id: {
            type: 'integer',
            example: 3,
            nullable: true,
          },
          middle_name: {
            type: 'string',
            example: 'Michael',
          },
          date_of_birth: {
            type: 'string',
            format: 'date',
            example: '1985-06-15',
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other', 'prefer_not_to_say'],
            example: 'male',
          },
          marital_status: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
            example: 'married',
          },
          occupation: {
            type: 'string',
            example: 'Software Engineer',
          },
          baptism_date: {
            type: 'string',
            format: 'date',
            example: '1985-08-20',
          },
          first_communion_date: {
            type: 'string',
            format: 'date',
            example: '1993-05-10',
          },
          confirmation_date: {
            type: 'string',
            format: 'date',
            example: '1997-06-15',
          },
          marriage_date: {
            type: 'string',
            format: 'date',
            example: '2010-09-25',
          },
          member_status: {
            type: 'string',
            enum: ['active', 'inactive', 'visitor'],
            example: 'active',
          },
          photo_url: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/photo.jpg',
          },
          address_line1: {
            type: 'string',
            example: '456 Oak Street',
          },
          address_line2: {
            type: 'string',
            example: 'Apt 2B',
          },
          city: {
            type: 'string',
            example: 'Springfield',
          },
          state: {
            type: 'string',
            example: 'Illinois',
          },
          country: {
            type: 'string',
            example: 'USA',
          },
          postal_code: {
            type: 'string',
            example: '62701',
          },
          emergency_contact_name: {
            type: 'string',
            example: 'Jane Doe',
          },
          emergency_contact_phone: {
            type: 'string',
            example: '+1987654321',
          },
          notes: {
            type: 'string',
            example: 'Volunteer for youth ministry',
          },
          registration_date: {
            type: 'string',
            format: 'date',
            example: '2020-01-15',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateParishioner: {
        type: 'object',
        required: ['email', 'first_name', 'last_name', 'parish_id'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            example: 'john.doe@example.com',
            description: 'Email address for the parishioner (must be unique)',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'SecurePass123!',
            description: '(Optional) Password for login - if not provided, parishioner can set it later via password reset',
          },
          first_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'John',
            description: 'First name of the parishioner',
          },
          last_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'Doe',
            description: 'Last name of the parishioner',
          },
          phone: {
            type: 'string',
            maxLength: 20,
            example: '+1234567890',
            description: 'Phone number',
          },
          profile_image_url: {
            type: 'string',
            format: 'uri',
            maxLength: 500,
            example: 'https://example.com/photo.jpg',
            description: 'Profile image URL',
          },
          parish_id: {
            type: 'integer',
            example: 1,
            description: 'ID of the parish this parishioner belongs to',
          },
          ward_id: {
            type: 'integer',
            example: 1,
            description: '(Optional) ID of the ward this parishioner is assigned to',
          },
          family_id: {
            type: 'integer',
            example: 3,
            description: '(Optional) ID of the family this parishioner belongs to',
          },
          middle_name: {
            type: 'string',
            maxLength: 100,
            example: 'Michael',
          },
          date_of_birth: {
            type: 'string',
            format: 'date',
            example: '1985-06-15',
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other', 'prefer_not_to_say'],
            example: 'male',
          },
          marital_status: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
            example: 'married',
          },
          occupation: {
            type: 'string',
            maxLength: 200,
            example: 'Software Engineer',
          },
          baptism_date: {
            type: 'string',
            format: 'date',
            example: '1985-08-20',
            description: 'Date of baptism',
          },
          first_communion_date: {
            type: 'string',
            format: 'date',
            example: '1993-05-10',
            description: 'Date of first communion',
          },
          confirmation_date: {
            type: 'string',
            format: 'date',
            example: '1997-06-15',
            description: 'Date of confirmation',
          },
          marriage_date: {
            type: 'string',
            format: 'date',
            example: '2010-09-25',
            description: 'Date of marriage (if applicable)',
          },
          member_status: {
            type: 'string',
            enum: ['active', 'inactive', 'visitor'],
            example: 'active',
            default: 'active',
          },
          photo_url: {
            type: 'string',
            format: 'uri',
            maxLength: 500,
            example: 'https://example.com/photo.jpg',
          },
          address_line1: {
            type: 'string',
            maxLength: 255,
            example: '456 Oak Street',
          },
          address_line2: {
            type: 'string',
            maxLength: 255,
            example: 'Apt 2B',
          },
          city: {
            type: 'string',
            maxLength: 100,
            example: 'Springfield',
          },
          state: {
            type: 'string',
            maxLength: 100,
            example: 'Illinois',
          },
          country: {
            type: 'string',
            maxLength: 100,
            example: 'USA',
          },
          postal_code: {
            type: 'string',
            maxLength: 20,
            example: '62701',
          },
          emergency_contact_name: {
            type: 'string',
            maxLength: 200,
            example: 'Jane Doe',
          },
          emergency_contact_phone: {
            type: 'string',
            maxLength: 20,
            example: '+1987654321',
          },
          notes: {
            type: 'string',
            example: 'Volunteer for youth ministry',
          },
          registration_date: {
            type: 'string',
            format: 'date',
            example: '2020-01-15',
          },
        },
        description: 'Creates a new parishioner and automatically creates a user account. Password is optional - if not provided, a temporary password is generated and the parishioner can set their own password later via password reset. The user account is created with user_type=parishioner.',
      },
      UpdateParishioner: {
        type: 'object',
        properties: {
          ward_id: {
            type: 'integer',
            example: 1,
            nullable: true,
            description: 'Ward ID - set to null to unassign from ward',
          },
          family_id: {
            type: 'integer',
            example: 3,
            nullable: true,
            description: 'Family ID - set to null to unassign from family',
          },
          middle_name: {
            type: 'string',
            maxLength: 100,
            example: 'Michael',
            nullable: true,
          },
          date_of_birth: {
            type: 'string',
            format: 'date',
            example: '1985-06-15',
            nullable: true,
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other', 'prefer_not_to_say'],
            example: 'male',
            nullable: true,
          },
          marital_status: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
            example: 'married',
            nullable: true,
          },
          occupation: {
            type: 'string',
            maxLength: 200,
            example: 'Software Engineer',
            nullable: true,
          },
          baptism_date: {
            type: 'string',
            format: 'date',
            example: '1985-08-20',
            nullable: true,
          },
          first_communion_date: {
            type: 'string',
            format: 'date',
            example: '1993-05-10',
            nullable: true,
          },
          confirmation_date: {
            type: 'string',
            format: 'date',
            example: '1997-06-15',
            nullable: true,
          },
          marriage_date: {
            type: 'string',
            format: 'date',
            example: '2010-09-25',
            nullable: true,
          },
          member_status: {
            type: 'string',
            enum: ['active', 'inactive', 'visitor'],
            example: 'active',
          },
          photo_url: {
            type: 'string',
            format: 'uri',
            maxLength: 500,
            example: 'https://example.com/photo.jpg',
            nullable: true,
          },
          address_line1: {
            type: 'string',
            maxLength: 255,
            example: '456 Oak Street',
            nullable: true,
          },
          address_line2: {
            type: 'string',
            maxLength: 255,
            example: 'Apt 2B',
            nullable: true,
          },
          city: {
            type: 'string',
            maxLength: 100,
            example: 'Springfield',
            nullable: true,
          },
          state: {
            type: 'string',
            maxLength: 100,
            example: 'Illinois',
            nullable: true,
          },
          country: {
            type: 'string',
            maxLength: 100,
            example: 'USA',
            nullable: true,
          },
          postal_code: {
            type: 'string',
            maxLength: 20,
            example: '62701',
            nullable: true,
          },
          emergency_contact_name: {
            type: 'string',
            maxLength: 200,
            example: 'Jane Doe',
            nullable: true,
          },
          emergency_contact_phone: {
            type: 'string',
            maxLength: 20,
            example: '+1987654321',
            nullable: true,
          },
          notes: {
            type: 'string',
            example: 'Volunteer for youth ministry',
            nullable: true,
          },
          registration_date: {
            type: 'string',
            format: 'date',
            example: '2020-01-15',
            nullable: true,
          },
          is_active: {
            type: 'boolean',
            example: true,
            description: 'Whether the parishioner is active',
          },
        },
        description: 'At least one field must be provided for update',
      },
      PaginatedParishionerResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Parishioner',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: {
                type: 'integer',
                example: 1,
              },
              pageSize: {
                type: 'integer',
                example: 20,
              },
              totalRecords: {
                type: 'integer',
                example: 150,
              },
              totalPages: {
                type: 'integer',
                example: 8,
              },
            },
          },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Parish Nexus Flow API is running',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
