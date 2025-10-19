import fetch from 'node-fetch';
import Company from '../models/Company.js';

const ATLASSIAN_BASE_URL = process.env.ATLASSIAN_BASE_URL || 'https://api.atlassian.com';
const ATLASSIAN_CLIENT_ID = process.env.ATLASSIAN_CLIENT_ID;
const ATLASSIAN_CLIENT_SECRET = process.env.ATLASSIAN_CLIENT_SECRET;

// Optional: long-lived access token or OAuth token with appropriate scopes
const ATLASSIAN_ACCESS_TOKEN = process.env.ATLASSIAN_ACCESS_TOKEN;

/**
 * Create Jira workspace for a company
 * Note: This is a simplified implementation. In reality, creating Jira workspaces
 * programmatically is very limited. This would typically require:
 * 1. Partnering with Atlassian
 * 2. Using existing Jira instances
 * 3. Manual setup processes
 */
export async function createJiraWorkspace(companyId) {
  try {
    console.log(`🚀 Starting Jira workspace creation for company ${companyId}`);
    
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Update status to in progress
    company.jiraConfig.setupStatus = 'in_progress';
    await company.save();

    // Simulate workspace creation process
    // In a real implementation, this would involve:
    // 1. Creating Atlassian organization
    // 2. Setting up Jira Cloud site
    // 3. Configuring Service Desk
    // 4. Creating custom work types and request types
    // 5. Deploying Forge app

    await simulateWorkspaceCreation(company);

      // If we have an Atlassian access token and a target site base URL, try to create
      // an organization in the customer's Jira Service Management instance.
      // Note: This requires a valid access token with site admin scopes and a reachable site URL
      // (e.g. https://your-site.atlassian.net). The code below is best-effort and will
      // not replace the more involved onboarding flow required for production.
      if (ATLASSIAN_ACCESS_TOKEN && company.jiraConfig?.siteBaseUrl) {
        try {
          const orgResp = await createOrganizationInSite(
            company.jiraConfig.siteBaseUrl,
            ATLASSIAN_ACCESS_TOKEN,
            company.jiraConfig.workspaceName || company.name
          );

          if (orgResp && orgResp.id) {
            // persist organization id
            await company.update({
              jiraConfig: {
                ...company.jiraConfig,
                organizationId: orgResp.id
              }
            });
          }
        } catch (err) {
          console.error('Error creating Atlassian organization:', err);
          // we don't fail the whole flow here — createJiraWorkspace will still mark completed
          // but persist the error so it's visible for debugging
          await company.update({
            jiraConfig: {
              ...company.jiraConfig,
              lastError: String(err?.message || err)
            }
          }).catch(console.error);
        }
      }

    // Update company with "created" workspace details
    await company.update({
      jiraConfig: {
        ...company.jiraConfig,
        siteId: `site-${company.id}`,
        serviceDeskId: `sd-${company.id}`,
        forgeAppId: `forge-${company.id}`,
        setupStatus: 'completed'
      },
      status: 'active'
    });

    console.log(`✅ Jira workspace created successfully for company ${companyId}`);
    
    return {
      success: true,
      siteId: company.jiraConfig.siteId,
      serviceDeskId: company.jiraConfig.serviceDeskId,
      forgeAppId: company.jiraConfig.forgeAppId
    };

  } catch (error) {
    console.error(`❌ Failed to create Jira workspace for company ${companyId}:`, error);
    
    // Update company status to failed
    const company = await Company.findById(companyId);
    if (company) {
      await company.update({
        jiraConfig: {
          ...company.jiraConfig,
          setupStatus: 'failed',
          lastError: String(error?.message || error)
        }
      });
    }

    throw error;
  }
}

/**
 * Simulate the workspace creation process
 * In reality, this would make actual API calls to Atlassian services
 */
async function simulateWorkspaceCreation(company) {
  // Simulate API delays
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`📋 Creating workspace: ${company.jiraConfig.workspaceName}`);
  console.log(`👤 Admin email: ${company.jiraConfig.adminEmail}`);
  console.log(`🏢 Company: ${company.name}`);
  console.log(`🌐 Domain: ${company.domain}`);
  
  // Simulate creating work types
  console.log(`🔧 Creating ${company.serviceDeskConfig.workTypes.length} work types`);
  for (const workType of company.serviceDeskConfig.workTypes) {
    console.log(`  - ${workType.name} (${workType.priority} priority)`);
  }
  
  // Simulate creating request types
  console.log(`📝 Creating ${company.serviceDeskConfig.requestTypes.length} request types`);
  for (const requestType of company.serviceDeskConfig.requestTypes) {
    console.log(`  - ${requestType.name} (${requestType.category}, ${requestType.slaHours}h SLA)`);
  }
  
  // Simulate Forge app deployment
  console.log(`🚀 Deploying Forge app with company-specific configuration`);
  
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Create an organization in a Jira Service Management site
 * siteBaseUrl should be the site root, e.g. https://your-site.atlassian.net
 * accessToken must be a valid OAuth2 bearer token or Atlassian token with appropriate scopes
 */
export async function createOrganizationInSite(siteBaseUrl, accessToken, orgName) {
  if (!siteBaseUrl) throw new Error('siteBaseUrl is required');
  if (!accessToken) throw new Error('accessToken is required');

  const url = `${siteBaseUrl.replace(/\/$/, '')}/rest/servicedeskapi/organization`;

  const body = JSON.stringify({ name: orgName });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body
  });

  const text = await res.text();

  if (!res.ok) {
    let parsed = text;
    try { parsed = JSON.parse(text); } catch (e) {}
    const msg = parsed?.message || parsed || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(`Failed to create organization: ${msg}`);
    err.raw = parsed;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

/**
 * Get Jira site information
 */
export async function getJiraSiteInfo(siteId) {
  try {
    // In a real implementation, this would call the Atlassian API
    // For now, return mock data
    return {
      id: siteId,
      name: 'Mock Jira Site',
      url: `https://${siteId}.atlassian.net`,
      status: 'active',
      created: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Jira site info:', error);
    throw error;
  }
}

/**
 * Create a service request in Jira
 */
export async function createServiceRequest(companyId, requestData) {
  try {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    if (!company.isSetupComplete) {
      throw new Error('Company Jira setup not complete');
    }

    if (!company.canCreateTicket()) {
      throw new Error('Company has reached ticket limit');
    }

    // In a real implementation, this would:
    // 1. Use the company's Jira credentials
    // 2. Call the Jira Service Management API
    // 3. Create the actual service request
    
    const mockTicket = {
      issueKey: `SD-${Date.now()}`,
      summary: requestData.summary,
      description: requestData.description,
      requestType: requestData.requestType,
      priority: requestData.priority || 'Medium',
      created: new Date().toISOString()
    };

    // Increment ticket usage
    await company.incrementTicketUsage();

    console.log(`✅ Created service request ${mockTicket.issueKey} for company ${companyId}`);
    
    return mockTicket;

  } catch (error) {
    console.error('Error creating service request:', error);
    throw error;
  }
}

/**
 * Get company's Jira configuration
 */
export async function getCompanyJiraConfig(companyId) {
  try {
    const company = await Company.findById(companyId)
      .select('jiraConfig serviceDeskConfig status');
    
    if (!company) {
      throw new Error('Company not found');
    }

    return {
      jiraConfig: company.jiraConfig,
      serviceDeskConfig: company.serviceDeskConfig,
      status: company.status,
      isSetupComplete: company.isSetupComplete
    };
  } catch (error) {
    console.error('Error fetching Jira config:', error);
    throw error;
  }
}

/**
 * Update company's Jira configuration
 */
export async function updateCompanyJiraConfig(companyId, configUpdates) {
  try {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Update configuration
    if (configUpdates.jiraConfig) {
      Object.assign(company.jiraConfig, configUpdates.jiraConfig);
    }
    
    if (configUpdates.serviceDeskConfig) {
      Object.assign(company.serviceDeskConfig, configUpdates.serviceDeskConfig);
    }

    await company.save();

    return company;
  } catch (error) {
    console.error('Error updating Jira config:', error);
    throw error;
  }
}
