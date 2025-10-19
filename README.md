# Dubhacks 2025 - JARVIS Platform

A comprehensive multi-tenant platform that automatically converts customer voicemails into structured Jira Service Management tickets using AI.

## 🎯 Project Overview

This project consists of two main components:

1. **Original Forge App** (`backend/`) - Single-tenant AI voicemail processor
2. **Multi-Tenant Platform** (`platform/`) - SaaS platform for managing multiple companies

## 🏗️ Project Structure

```
Dubhacks2025/
├── backend/                    # Original Forge App
│   ├── manifest.yml            # Forge app configuration
│   ├── src/
│   │   ├── resolvers/          # AI processing logic
│   │   └── frontend/           # Forge UI components
│   └── testForgeWebhook.js     # Testing utilities
├── platform/                   # Multi-Tenant SaaS Platform
│   ├── backend/                # Node.js/Express API
│   ├── frontend/               # React frontend
│   └── README.md               # Platform documentation
├── twilio-eleven-bridge/       # Twilio integration
└── README.md                   # This file
```

## 🚀 Quick Start

### Option 1: Run the Original Forge App

```bash
cd backend
npm install
forge deploy --non-interactive --e development
forge tunnel
```

### Option 2: Run the Multi-Tenant Platform

```bash
cd platform
# Follow the detailed setup instructions in platform/README.md
```

## 🎯 Key Features

### Original Forge App
- ✅ AI-powered voicemail transcription
- ✅ Smart Jira ticket creation
- ✅ Customizable work types and request types
- ✅ Priority and field value generation

### Multi-Tenant Platform
- ✅ Company onboarding and management
- ✅ Multi-tenant architecture
- ✅ Custom Jira workspace configuration
- ✅ Admin dashboard and analytics
- ✅ Webhook-based processing
- ✅ Scalable SaaS infrastructure

## 🔧 Technology Stack

- **AI Processing**: OpenAI GPT-4o-mini, Whisper
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React, Vite, Tailwind CSS
- **Integration**: Atlassian Forge, Jira Service Management
- **Authentication**: JWT, bcrypt
- **Validation**: Joi, React Hook Form

## 📊 Architecture Comparison

| Feature | Original Forge App | Multi-Tenant Platform |
|---------|-------------------|----------------------|
| **Scope** | Single company | Multiple companies |
| **Deployment** | Forge Cloud | Custom infrastructure |
| **UI** | Forge UI Kit | Custom React app |
| **Database** | None (stateless) | MongoDB |
| **Authentication** | Forge built-in | Custom JWT |
| **Scaling** | Per-app instance | Horizontal scaling |
| **Customization** | Limited | Full control |

## 🎯 Use Cases

### Original Forge App
- **Single company** wanting to automate voicemail processing
- **Quick setup** with minimal configuration
- **Forge ecosystem** integration
- **Proof of concept** or MVP

### Multi-Tenant Platform
- **SaaS business** serving multiple companies
- **Enterprise customers** with complex requirements
- **Custom branding** and white-labeling
- **Advanced analytics** and reporting
- **API access** for integrations

## 🚀 Getting Started

### For the Original Forge App:
1. Set up Forge CLI
2. Deploy the app to your Jira instance
3. Configure OpenAI API key
4. Test with sample voicemails

### For the Multi-Tenant Platform:
1. Set up MongoDB
2. Configure environment variables
3. Install dependencies
4. Start development servers
5. Create your first company

## 📈 Development Roadmap

### Phase 1: Foundation ✅
- [x] Original Forge app with AI processing
- [x] Multi-tenant platform architecture
- [x] Company onboarding system
- [x] Basic admin dashboard

### Phase 2: Enhancement 🚧
- [ ] Real Jira workspace creation
- [ ] Advanced analytics
- [ ] Custom branding
- [ ] API documentation

### Phase 3: Enterprise 🎯
- [ ] SSO integration
- [ ] Compliance features
- [ ] White-label options
- [ ] Advanced security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
- Check the individual README files in each component
- Create an issue in the repository
- Review the troubleshooting sections

---

**Built for Dubhacks 2025** 🎉

*Transforming voicemails into actionable Jira tickets with the power of AI*
