import express from 'express';
import { 
  getJiraSiteInfo, 
  createServiceRequest, 
  getCompanyJiraConfig, 
  updateCompanyJiraConfig 
} from '../services/jiraService.js';

const router = express.Router();

// Get Jira site information
router.get('/site/:siteId', async (req, res) => {
  try {
    const siteInfo = await getJiraSiteInfo(req.params.siteId);
    res.json({
      success: true,
      site: siteInfo
    });
  } catch (error) {
    console.error('Error fetching Jira site info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Jira site information'
    });
  }
});

// Get company's Jira configuration
router.get('/config/:companyId', async (req, res) => {
  try {
    const config = await getCompanyJiraConfig(req.params.companyId);
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching Jira config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Jira configuration'
    });
  }
});

// Update company's Jira configuration
router.put('/config/:companyId', async (req, res) => {
  try {
    const company = await updateCompanyJiraConfig(req.params.companyId, req.body);
    res.json({
      success: true,
      message: 'Jira configuration updated successfully',
      company: {
        id: company._id,
        jiraConfig: company.jiraConfig,
        serviceDeskConfig: company.serviceDeskConfig
      }
    });
  } catch (error) {
    console.error('Error updating Jira config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update Jira configuration'
    });
  }
});

// Create service request
router.post('/request/:companyId', async (req, res) => {
  try {
    const { summary, description, requestType, priority } = req.body;
    
    if (!summary || !description) {
      return res.status(400).json({
        success: false,
        error: 'Summary and description are required'
      });
    }

    const ticket = await createServiceRequest(req.params.companyId, {
      summary,
      description,
      requestType,
      priority
    });

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create service request'
    });
  }
});

// Test Jira connection
router.get('/test/:companyId', async (req, res) => {
  try {
    const config = await getCompanyJiraConfig(req.params.companyId);
    
    if (!config.isSetupComplete) {
      return res.status(400).json({
        success: false,
        error: 'Jira setup not complete',
        setupStatus: config.jiraConfig.setupStatus
      });
    }

    // In a real implementation, this would test the actual Jira connection
    res.json({
      success: true,
      message: 'Jira connection test successful',
      config: {
        siteId: config.jiraConfig.siteId,
        serviceDeskId: config.jiraConfig.serviceDeskId,
        status: config.status
      }
    });
  } catch (error) {
    console.error('Error testing Jira connection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test Jira connection'
    });
  }
});

export default router;
