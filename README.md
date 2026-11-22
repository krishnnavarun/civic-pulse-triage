# Civic Pulse

Civic Pulse is a transparent civic grievance and infrastructure triage platform for citizens and municipal authorities.

## Features

- Citizen complaint submission with title, category, location, coordinates, and image evidence
- AI-ready triage endpoint with OpenAI support and deterministic fallback
- Severity scoring and department routing
- Public dashboard, search, status filters, statistics, and CSV export
- Shareable complaint URLs and complaint timelines
- Citizen and authority accounts with JWT authentication
- Protected authority status updates
- Optional PostgreSQL persistence and JSON fallback persistence
- OpenStreetMap location links
- Browser notification support
- Render and Docker deployment support

## Run locally

```powershell
npm install
npm run build
npm start
```

Open `http://127.0.0.1:4173`.

For frontend-only hot reload:

```powershell
npm run dev
```

## API

- `GET /api/health`
- `GET /api/complaints`
- `POST /api/complaints`
- `POST /api/triage`
- `POST /api/ai/triage`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `PATCH /api/complaints/:id/status`

Authority status updates require a JWT whose role is `authority` or `admin`.

## Environment variables

- `PORT` - HTTP port, default `4173`
- `JWT_SECRET` - required secret for production JWT signing
- `DATABASE_URL` - PostgreSQL connection string; JSON fallback is used without it
- `OPENAI_API_KEY` - optional real AI triage provider
- `OPENAI_MODEL` - optional OpenAI model, default `gpt-4o-mini`
- `AUTHORITY_REGISTRATION_CODE` - optional protected authority registration code
- `CORS_ORIGIN` - optional comma-separated CORS origins
- `DATA_FILE` - optional JSON data path

## Validate

```powershell
npm test
npm run lint
npm run build
```

## Deploy

Render: use the included `render.yaml`, or create a Web Service and use:

- Build: `npm ci && npm run build`
- Start: `npm start`
- Health check: `/api/health`

Set `JWT_SECRET`, optional `DATABASE_URL`, optional `OPENAI_API_KEY`, and `AUTHORITY_REGISTRATION_CODE`.

Docker:

```powershell
docker build -t civic-pulse .
docker run --rm -p 4173:4173 -e JWT_SECRET=replace-this civic-pulse
```
