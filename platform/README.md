# JARVIS Platform

A multi-tenant SaaS platform that automatically converts customer voicemails into structured Jira Service Management tickets using AI.

## 🚀 Features

- **AI-Powered Transcription**: Convert voicemails to text using OpenAI Whisper
- **Smart Ticket Creation**: Automatically categorize and prioritize tickets
- **Multi-Tenant Architecture**: Each company gets their own Jira workspace
- **Customizable Work Types**: Configure request types and fields per company
- **Real-time Processing**: Webhook-based voicemail processing
- **Admin Dashboard**: Manage multiple companies and their configurations

## 🏗️ Architecture

```
platform/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── env.example
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   └── services/        # API services
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **AWS DynamoDB** with AWS SDK
- **JWT** for authentication
- **OpenAI API** for AI processing
- **Joi** for validation

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **React Hook Form** for forms
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hot Toast** for notifications

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS Account with DynamoDB access
- OpenAI API key
- Atlassian account (for Jira integration)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd /Users/benfukuzawa/Documents/GitHub/Dubhacks2025/platform
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Server
PORT=3001
NODE_ENV=development

# AWS DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
DYNAMODB_TABLE_PREFIX=voicemail-ai

# JWT
JWT_SECRET=your-super-secret-jwt-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Webhook Security
WEBHOOK_SECRET=your-webhook-secret

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 4. Set up AWS DynamoDB

**Option 1: AWS CLI (Recommended)**
```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

**Option 2: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

**Option 3: IAM Role (for AWS deployment)**
- Attach DynamoDB permissions to your IAM role
- No additional configuration needed

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Create DynamoDB Table:**
```bash
cd backend
npm run create-table
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔐 Authentication

### Demo Credentials
- **Email**: admin@voicemail-ai.com
- **Password**: password

### Creating New Users
Currently, the platform uses a mock admin user. To add real user management:

1. Create a User model in `backend/src/models/User.js`
2. Implement registration endpoint in `backend/src/routes/auth.js`
3. Add user management to the frontend

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Companies
- `POST /api/companies` - Create new company
- `GET /api/companies` - List companies (with filters)
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `PATCH /api/companies/:id/status` - Update company status
- `GET /api/companies/:id/setup-status` - Get setup status
- `POST /api/companies/:id/retry-setup` - Retry Jira setup

### Jira Integration
- `GET /api/jira/site/:siteId` - Get Jira site info
- `GET /api/jira/config/:companyId` - Get company Jira config
- `PUT /api/jira/config/:companyId` - Update Jira config
- `POST /api/jira/request/:companyId` - Create service request
- `GET /api/jira/test/:companyId` - Test Jira connection

### Webhooks
- `POST /api/webhooks/voicemail` - Process voicemail transcript
- `POST /api/webhooks/test` - Test webhook processing
- `GET /api/webhooks/health` - Webhook health check

## 🎯 Usage

### 1. Company Onboarding

1. Navigate to `/onboarding`
2. Fill in company information:
   - Company name, domain, industry, size
   - Contact email and phone
3. Configure Jira workspace:
   - Workspace name and admin email
   - Timezone and language preferences
4. Set up service desk:
   - Define work types with custom fields
   - Create request types with SLAs
5. Submit to create the company

### 2. Managing Companies

1. Go to `/companies` to view all companies
2. Filter by status, industry, or search by name
3. Update company status (pending, active, suspended, cancelled)
4. View setup progress and retry if needed

### 3. Testing Integration

1. Use the dashboard to test webhook processing
2. Send test transcripts to verify AI processing
3. Check ticket creation in the company's Jira workspace

## 🔧 Configuration

### Work Types
Define custom work types for each company:
- **Name**: Display name for the work type
- **Description**: Detailed description
- **Priority**: Default priority level
- **Fields**: Custom fields (text, textarea, select, number, date)

### Request Types
Configure request categories:
- **Name**: Request type name
- **Description**: Detailed description
- **Category**: Grouping category
- **SLA**: Service level agreement in hours

### AI Processing
The platform uses OpenAI's GPT-4o-mini for:
- **Transcription**: Whisper API for audio-to-text
- **Summarization**: Create concise summaries
- **Categorization**: Match content to request types
- **Field Generation**: Fill custom fields intelligently
- **Priority Assignment**: Determine urgency level

## 🚨 Important Notes

### Jira Workspace Creation
Currently, the platform simulates Jira workspace creation. In production, you would need to:

1. **Partner with Atlassian** to get workspace creation APIs
2. **Use existing Jira instances** provided by companies
3. **Implement manual setup processes** with admin approval

### Security Considerations
- Change default JWT secret in production
- Use HTTPS for all communications
- Implement proper rate limiting
- Add input sanitization and validation
- Use environment-specific configurations

### Scaling Considerations
- Implement Redis for caching and sessions
- Add database connection pooling
- Use CDN for static assets
- Implement horizontal scaling
- Add monitoring and logging

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
```bash
# Check if MongoDB is running
brew services start mongodb-community
# or
sudo systemctl start mongod
```

**Port Already in Use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**OpenAI API Errors:**
- Verify API key is correct
- Check API usage limits
- Ensure sufficient credits

**CORS Issues:**
- Verify FRONTEND_URL in backend .env
- Check that frontend is running on correct port

## 📈 Next Steps

### Phase 1: MVP (Current)
- ✅ Company onboarding
- ✅ Basic Jira integration
- ✅ AI processing pipeline
- ✅ Admin dashboard

### Phase 2: Enhanced Features
- [ ] Real Jira workspace creation
- [ ] Advanced analytics and reporting
- [ ] Custom branding per company
- [ ] API access for companies
- [ ] Webhook management UI

### Phase 3: Enterprise Features
- [ ] Multi-site support
- [ ] Advanced security (SSO, RBAC)
- [ ] Compliance features (GDPR, SOC2)
- [ ] White-label options
- [ ] Custom integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for Dubhacks 2025**
