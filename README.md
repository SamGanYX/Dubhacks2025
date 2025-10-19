# Dubhacks 2025 - JARVIS Voice Assistant

A multi-tenant platform that converts customer voicemails into structured Jira Service Management tickets using AI. This repo contains the original single-tenant Forge app and a multi-tenant SaaS platform.

# 🏗️ Project Structure

```
Dubhacks2025/
├── backend/                    # Original Forge App
│   ├── manifest.yml            # Forge app configuration
│   ├── src/
│   │   ├── resolvers/          # AI processing logic
│   │   └── frontend/           # Forge UI components
│   └── testForgeWebhook.js     # Testing utilities
├── platform/                   # Multi-Tenant SaaS Platform
│   ├── backend/                # Node.js/Express API (SQLite)
│   ├── frontend/               # React frontend
│   └── README.md               # Platform documentation
├── twilio-eleven-bridge/       # Twilio integration (optional)
└── README.md                   # This file
```

## Project layout

Root:
- backend/                    — Original Forge app (single-tenant)
- platform/                   — Multi-tenant SaaS platform (frontend + backend)
- twilio-eleven-bridge/       — Twilio integration
- README.md                   — This file

backend/ (Forge app)
- manifest.yml
- package.json
- src/
  - resolvers/
  - frontend/
- testForgeWebhook.js

platform/
- backend/                    — Node/Express API, services, routes, models
- frontend/                   — React + Vite app
- README.md                   — Platform-specific setup

## Quick start

Prerequisites (recommended)
- Node.js 18+ (or as required in package.json)
- npm or pnpm
- For platform backend: sqlite (temp solution)
- For Forge app: Atlassian Forge CLI and a target Atlassian product (for deploy/tunnel)
- OpenAI API key (or relevant AI provider credentials)
- Twilio credentials if using Twilio integration

1) Run the original Forge app (single-tenant)
```bash
cd backend
npm install
# Set required env vars (e.g., OPENAI_API_KEY) or configure via Forge as needed
# Deploy & test with Forge CLI:
# Install Forge CLI: npm install -g @forge/cli
forge deploy --non-interactive --environment development
forge tunnel
# Use testForgeWebhook.js to simulate incoming webhook payloads if helpful:
node testForgeWebhook.js
```

2) Run the multi-tenant platform (SaaS)
```bash
cd platform

# Backend
cd backend
npm install
# create .env with required vars (secret keys, Webtrigger links, JIRA credentials, etc.)
# If scripts/create-table.js exists for a service, run it if needed:
node scripts/create-table.js
npm run dev   # or npm start, see platform/backend/package.json

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev   # Vite dev server
```

See platform/README.md for detailed environment variables and deployment notes.

## What this repo provides

- Original Forge App (backend/) — AI voicemail transcription and Jira ticket creation for a single company via Atlassian Forge.
- Multi-Tenant Platform (platform/) — API, database-backed multi-tenant orchestration, React frontend, onboarding flows, and admin features.
- Twilio integration scaffolding (twilio-eleven-bridge/) for receiving voicemails and media.

## Key features

- AI-based voicemail transcription and ticket generation
- Multi-tenant onboarding and company management
- Webhook-driven processing and integrations (Jira, Twilio)
- React + Vite frontend with Tailwind CSS
- Node/Express backend with Sqlite (temporary solution) for persistence

## Development notes

- Backend services under platform/backend use controllers, services, and models. Inspect src/ for routes and service implementations (aiService.js, jiraService.js).
- The Forge app's AI logic lives in backend/src/resolvers/.
- Use testForgeWebhook.js in backend/ to simulate Forge/webhook inputs during local development.

## Roadmap (high level)

- Phase 1: Foundation (done) — single-tenant Forge app, multi-tenant architecture, basic onboarding
- Phase 2: Enhancement — real Jira workspace creation, analytics, custom branding
- Phase 3: Enterprise — SSO, compliance, white-labeling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement and test changes
4. Submit a pull request with a clear description

