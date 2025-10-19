import Joi from 'joi';

// Company validation schema
export const companySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Company name must be at least 2 characters long',
    'string.max': 'Company name cannot exceed 100 characters',
    'any.required': 'Company name is required'
  }),
  domain: Joi.string().domain().required().messages({
    'string.domain': 'Please enter a valid domain name',
    'any.required': 'Company domain is required'
  }),
  industry: Joi.string().valid(
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
    'Manufacturing', 'Real Estate', 'Consulting', 'Media', 'Other'
  ).required().messages({
    'any.only': 'Please select a valid industry',
    'any.required': 'Industry is required'
  }),
  size: Joi.string().valid('1-10', '11-50', '51-200', '201-1000', '1000+').required().messages({
    'any.only': 'Please select a valid company size',
    'any.required': 'Company size is required'
  }),
  contactEmail: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Contact email is required'
  }),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required().messages({
    'string.pattern.base': 'Please enter a valid phone number',
    'any.required': 'Phone number is required'
  }),
  jiraConfig: Joi.object({
    workspaceName: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9\s\-_]+$/).required().messages({
      'string.min': 'Workspace name must be at least 3 characters long',
      'string.max': 'Workspace name cannot exceed 50 characters',
      'string.pattern.base': 'Workspace name can only contain letters, numbers, spaces, hyphens, and underscores',
      'any.required': 'Workspace name is required'
    }),
    adminEmail: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid admin email address',
      'any.required': 'Admin email is required'
    }),
    timezone: Joi.string().valid(
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 
      'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
    ).default('UTC'),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'ja', 'zh').default('en')
  }).required(),
  serviceDeskConfig: Joi.object({
    workTypes: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(50).required().messages({
          'string.min': 'Work type name must be at least 2 characters long',
          'string.max': 'Work type name cannot exceed 50 characters',
          'any.required': 'Work type name is required'
        }),
        description: Joi.string().max(500).messages({
          'string.max': 'Description cannot exceed 500 characters'
        }),
        priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
        fields: Joi.array().items(
          Joi.object({
            name: Joi.string().min(2).max(50).required().messages({
              'string.min': 'Field name must be at least 2 characters long',
              'string.max': 'Field name cannot exceed 50 characters',
              'any.required': 'Field name is required'
            }),
            type: Joi.string().valid('text', 'textarea', 'select', 'number', 'date').default('text'),
            required: Joi.boolean().default(false),
            options: Joi.array().items(Joi.string()).when('type', {
              is: 'select',
              then: Joi.array().min(1).required().messages({
                'any.required': 'Select fields must have at least one option',
                'array.min': 'Select fields must have at least one option'
              }),
              otherwise: Joi.optional()
            })
          })
        ).default([])
      })
    ).min(1).required().messages({
      'array.min': 'At least one work type is required',
      'any.required': 'Work types configuration is required'
    }),
    requestTypes: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(50).required().messages({
          'string.min': 'Request type name must be at least 2 characters long',
          'string.max': 'Request type name cannot exceed 50 characters',
          'any.required': 'Request type name is required'
        }),
        description: Joi.string().max(500).messages({
          'string.max': 'Description cannot exceed 500 characters'
        }),
        category: Joi.string().min(2).max(30).required().messages({
          'string.min': 'Category must be at least 2 characters long',
          'string.max': 'Category cannot exceed 30 characters',
          'any.required': 'Category is required'
        }),
        slaHours: Joi.number().min(1).max(168).default(24).messages({
          'number.min': 'SLA must be at least 1 hour',
          'number.max': 'SLA cannot exceed 168 hours (1 week)'
        })
      })
    ).min(1).required().messages({
      'array.min': 'At least one request type is required',
      'any.required': 'Request types configuration is required'
    })
  }).required()
});

// Validation function
export function validateCompanyData(data) {
  return companySchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true
  });
}

// Update validation schema (partial updates)
export const companyUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  industry: Joi.string().valid(
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
    'Manufacturing', 'Real Estate', 'Consulting', 'Media', 'Other'
  ),
  size: Joi.string().valid('1-10', '11-50', '51-200', '201-1000', '1000+'),
  contactEmail: Joi.string().email(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
  jiraConfig: Joi.object({
    workspaceName: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9\s\-_]+$/),
    adminEmail: Joi.string().email(),
    timezone: Joi.string().valid(
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 
      'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
    ),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'ja', 'zh')
  }),
  serviceDeskConfig: Joi.object({
    workTypes: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(50),
        description: Joi.string().max(500),
        priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical'),
        fields: Joi.array().items(
          Joi.object({
            name: Joi.string().min(2).max(50),
            type: Joi.string().valid('text', 'textarea', 'select', 'number', 'date'),
            required: Joi.boolean(),
            options: Joi.array().items(Joi.string())
          })
        )
      })
    ),
    requestTypes: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(50),
        description: Joi.string().max(500),
        category: Joi.string().min(2).max(30),
        slaHours: Joi.number().min(1).max(168)
      })
    )
  }),
  status: Joi.string().valid('pending', 'active', 'suspended', 'cancelled')
});

export function validateCompanyUpdate(data) {
  return companyUpdateSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true
  });
}
