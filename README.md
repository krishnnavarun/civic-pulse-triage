# Civic Pulse

Civic Pulse is an AI-assisted civic grievance and infrastructure triage platform built for IDEA//FORGE.

## Problem

Citizens report infrastructure issues across scattered phone lines, websites, social media, and municipal counters. Reports are inconsistently described, difficult to prioritize, and hard to track publicly.

## Solution

Civic Pulse gives citizens one place to submit infrastructure complaints and gives authorities a clear, structured workflow.

The current MVP:

- Classifies urgency from complaint language
- Routes complaints to a relevant department
- Provides public status and resolution metrics
- Supports search and status filters
- Shows a complaint-detail and progress view
- Supports photo evidence upload in the report form
- Persists demo complaints in the browser

## Demo flow

1. Open the dashboard.
2. Select **Report an issue**.
3. Enter a title, description, category, and location.
4. Submit the report.
5. Review the assigned department and severity.
6. Return to the dashboard and search or filter complaints.

## Local development

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Validation

```powershell
npm test
npm run lint
npm run build
```

## Technology

- React 19
- Vite
- Browser Local Storage
- Rule-based triage logic for the zero-config demo
- GitHub Actions and GitHub Pages

The rule-based triage is intentionally self-contained for hackathon execution. It can be replaced by an API-backed LLM in the production architecture.

## Production architecture

For a deployed version, complaints would be stored in a managed database, evidence files in object storage, and AI analysis exposed through a secured backend. Authentication and role-based authority access would be added for status updates.
