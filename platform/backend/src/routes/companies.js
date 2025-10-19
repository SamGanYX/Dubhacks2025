import express from 'express';
import Company from '../models/Company.js';
import { validateCompanyData, validateCompanyUpdate } from '../utils/validation.js';
import { createJiraWorkspace } from '../services/jiraService.js';

const router = express.Router();

// Create new company
router.post('/', async (req, res) => {
  try {
    // Validate input data
    const { error, value } = validateCompanyData(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findExisting(value.domain, value.contactEmail);

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: 'Company with this domain or email already exists'
      });
    }

    // Create company record
    const company = new Company(value);
    await company.save();

    // Start Jira workspace creation process (async)
    createJiraWorkspace(company.id).catch(error => {
      console.error(`Failed to create Jira workspace for company ${company.id}:`, error);
      // Update company status to failed
      company.update({
        jiraConfig: {
          ...company.jiraConfig,
          setupStatus: 'failed'
        }
      }).catch(console.error);
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully. Jira workspace setup in progress.',
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        status: company.status,
        setupStatus: company.jiraConfig.setupStatus
      }
    });

  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all companies (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.industry) {
      filter.industry = req.query.industry;
    }

    const result = await Company.findAll({
      ...filter,
      search: req.query.search
    }, limit, req.query.lastKey);

    const companies = result.companies;
    const total = result.count;

    res.json({
      success: true,
      companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update company configuration
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Validate update data
    const { error, value } = validateCompanyUpdate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Update company
    const updatedCompany = await company.update(value);

    res.json({
      success: true,
      message: 'Company updated successfully',
      company: updatedCompany
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update company status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const updatedCompany = await company.update({ status });

    res.json({
      success: true,
      message: 'Company status updated successfully',
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        status: updatedCompany.status
      }
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get company setup status
router.get('/:id/setup-status', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.json({
      success: true,
      setupStatus: {
        status: company.jiraConfig.setupStatus,
        siteId: company.jiraConfig.siteId,
        serviceDeskId: company.jiraConfig.serviceDeskId,
        forgeAppId: company.jiraConfig.forgeAppId,
        isComplete: company.isSetupComplete
      }
    });
  } catch (error) {
    console.error('Error fetching setup status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Retry Jira workspace setup
router.post('/:id/retry-setup', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Reset setup status
    await company.update({
      jiraConfig: {
        ...company.jiraConfig,
        setupStatus: 'pending'
      }
    });

    // Retry setup
    createJiraWorkspace(company.id).catch(error => {
      console.error(`Retry failed for company ${company.id}:`, error);
      company.update({
        jiraConfig: {
          ...company.jiraConfig,
          setupStatus: 'failed'
        }
      }).catch(console.error);
    });

    res.json({
      success: true,
      message: 'Jira workspace setup retry initiated'
    });
  } catch (error) {
    console.error('Error retrying setup:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    await company.delete();

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
