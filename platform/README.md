// ...existing code...
# JARVIS Platform

A multi-tenant SaaS platform that converts customer voicemails into structured Jira Service Management tickets using AI.

## Quick summary (current state)

- Backend: Node.js + Express using a file-based SQLite database (no MongoDB / DynamoDB).
- Frontend: React + Vite + Tailwind.
- Local DB initialization: platform/backend/scripts/create-table.js creates the SQLite file and tables.
- AI: OpenAI (Whisper for transcription, GPT for classification/summarization).
- Jira: integration hooks exist; workspace creation is simulated / requires manual setup for production.

## Project layout (platform/)
```
platform/
├── backend/                 # Node.js/Express API
│   ├── package.json
│   ├── scripts/             # e.g. create-table.js (initializes SQLite file & tables)
│   └── src/
│       ├── database.js      # SQLite connection
│       ├── controllers/
│       ├── models/          # data models (Company.js, etc.)
│       ├── routes/
│       ├── services/        # aiService.js, jiraService.js
│       └── utils/
├── frontend/                # React + Vite app
└── README.md
```

## Tech stack (accurate)
- Backend: Node.js, Express, SQLite (file-based)
- Frontend: React 18, Vite, Tailwind CSS
- AI: OpenAI (Whisper + GPT)
- Auth: JWT
- HTTP client: Axios

## Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Atlassian (Jira) credentials for integrations (optional for local testing)

## Local setup (recommended)

1. Clone repo and change to platform:
```bash
cd DUBHACKS2025/platform
```

2. Backend:
```bash
cd backend
npm install

# If an env.example exists, copy it; otherwise create .env
cp env.example .env 2>/dev/null || true
# Edit .env to set required variables (see example below)
nano .env

# Initialize SQLite DB and tables
node scripts/create-table.js

# Start backend
npm run dev
```

3. Frontend:
```bash
cd ../frontend
npm install
# Create env file for Vite if needed
echo "VITE_API_URL=http://localhost:3001/api" > .env
npm run dev
```

4. Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health: http://localhost:3001/health

## Example environment variables (platform/backend .env)
Use the names your code expects; common vars in this repo:
```env
PORT=3001
NODE_ENV=development

# SQLite
SQLITE_DB_PATH=./data/database.sqlite

# JWT
JWT_SECRET=your-jwt-secret

# OpenAI
OPENAI_API_KEY=your-openai-key

# Jira (if used)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-jira-api-token

# Webhook / Frontend
WEBHOOK_SECRET=your-webhook-secret
FRONTEND_URL=http://localhost:3000
```

## Database initialization
- Run: node scripts/create-table.js
- This creates the SQLite file (path comes from SQLITE_DB_PATH or a default inside scripts).
- Inspect platform/backend/src/database.js for the database filename/env var used.

## Notes about Jira and production
- The platform simulates workspace creation; for real workspace provisioning you must integrate with Atlassian APIs or use customer-provided instances.
- Secure JWT and API keys in production, use HTTPS, and rotate secrets.

## Troubleshooting
- If DB file is missing or migrations not run: re-run node scripts/create-table.js
- Port in use: kill process (macOS): lsof -ti:3001 | xargs kill -9
- OpenAI errors: verify OPENAI_API_KEY and quotas

## Contributing
- Fork, branch, implement, test, and open a PR. Keep README changes in sync with code (especially env var names and DB initialization).

## License
MIT
