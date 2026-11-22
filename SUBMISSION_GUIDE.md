# Civic Pulse Submission Guide

## Hackathon demo script

1. Open the landing dashboard and show live reports and priority statistics.
2. Submit a civic complaint with an urgent description, location, category, and image.
3. Point out automatic severity classification and department routing.
4. Open the submitted complaint and show the public timeline and map link.
5. Register or sign in as an authority.
6. Change the complaint status and show that the public dashboard updates.
7. Search, filter, and export complaints as CSV.

## 2-minute video outline

- 0:00–0:15: Identify the problem and affected citizens.
- 0:15–0:35: Show a citizen reporting an issue.
- 0:35–0:55: Explain AI triage and department routing.
- 0:55–1:15: Demonstrate authority status updates.
- 1:15–1:35: Show the public dashboard and tracking.
- 1:35–1:50: Explain architecture and production capabilities.
- 1:50–2:00: Present impact and future extension.

## Submission checklist

- Public repository link
- Deployed link
- Demo video link
- Clear problem statement
- Clear solution statement
- Hackathon category and theme
- Local test evidence
- Screenshots
- Source and environment setup instructions

## Before deployment

- Set a strong `JWT_SECRET`.
- Set `AUTHORITY_REGISTRATION_CODE`.
- Add `DATABASE_URL` for persistent production data.
- Add `OPENAI_API_KEY` for provider-backed triage.
- Confirm HTTPS and public health check access.
