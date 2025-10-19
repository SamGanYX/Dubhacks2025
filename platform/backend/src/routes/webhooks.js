import express from 'express';
import Company from '../models/Company.js';
import { processVoicemailWithAI } from '../services/aiService.js';

const router = express.Router();

// Webhook endpoint for receiving voicemail transcripts
router.post('/voicemail', async (req, res) => {
  try {
    // Verify webhook authentication
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.WEBHOOK_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      console.log('❌ Webhook authorization failed');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { transcript, companyId, metadata } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    if (!company.isSetupComplete) {
      return res.status(400).json({
        success: false,
        error: 'Company Jira setup not complete'
      });
    }

    if (!company.canCreateTicket()) {
      return res.status(429).json({
        success: false,
        error: 'Company has reached ticket limit'
      });
    }

    console.log(`🎧 Processing voicemail for company ${company.name} (${companyId})`);

    // Process the voicemail with AI
    const result = await processVoicemailWithAI(transcript, company);

    // Increment ticket usage
    await company.incrementTicketUsage();

    console.log(`✅ Created ticket ${result.issueKey} for company ${company.name}`);

    res.json({
      success: true,
      message: 'Voicemail processed successfully',
      ticket: {
        issueKey: result.issueKey,
        summary: result.summary,
        priority: result.priority,
        requestType: result.requestType
      },
      company: {
        id: company._id,
        name: company.name,
        ticketsUsed: company.subscription.ticketsUsed,
        maxTickets: company.subscription.maxTickets
      }
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voicemail'
    });
  }
});

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

// Test webhook endpoint
router.post('/test', async (req, res) => {
  try {
    const { companyId, testTranscript } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const transcript = testTranscript || "Hi, I need help with my account. I can't log in and it's urgent!";

    console.log(`🧪 Testing voicemail processing for company ${company.name}`);

    const result = await processVoicemailWithAI(transcript, company);

    res.json({
      success: true,
      message: 'Test completed successfully',
      testResult: {
        transcript,
        summary: result.summary,
        requestType: result.requestType,
        priority: result.priority,
        issueKey: result.issueKey
      }
    });

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed'
    });
  }
});

export default router;
