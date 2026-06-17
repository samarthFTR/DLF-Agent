# n8n Automation

Use n8n for orchestration that benefits from scheduling, external retries, platform webhooks, and operational visibility.

## Planned Workflows

- `publish-approved-campaign`
  - Triggered by API webhook when a campaign is approved or scheduled.
  - Calls `/api/v1/campaigns/:campaignId/publish` or queues platform-specific publish jobs.

- `collect-social-analytics`
  - Runs on a schedule.
  - Pulls platform metrics for published posts.
  - Posts normalized metrics to `/api/v1/analytics/import`.

- `publish-job-retry`
  - Retries transient social API failures.
  - Sends alerts for permanent failures.

- `social-webhook-ingest`
  - Receives provider webhook events when supported.
  - Forwards validated events to `/api/v1/webhooks/social/:provider`.

## Security

- All n8n-to-API requests must include an HMAC or bearer token derived from `N8N_WEBHOOK_SECRET`.
- n8n must never store raw user passwords.
- OAuth tokens should be stored in the API database, encrypted at rest.

## Design Decision

n8n is used for scheduling, retries, analytics polling, and operational notifications. It is not the source of truth for campaign state; PostgreSQL remains the source of truth through the Express API.
