# API Endpoints

Base path: `/api/v1`

## Auth and Tenancy

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `GET /tenants/:tenantId`

Design decision: every domain route is tenant-scoped through authenticated context, not by trusting request body tenant IDs.

## Products

- `POST /products`
  - Creates product information: name, description, features, category, target audience, and optional brand guidelines.
- `GET /products`
- `GET /products/:productId`
- `PATCH /products/:productId`
- `DELETE /products/:productId`

## Product Images and Assets

- `POST /products/:productId/images`
  - Uploads product images to local storage and creates asset records.
- `GET /products/:productId/images`
- `GET /assets/:assetId`
- `DELETE /assets/:assetId`

Design decision: API exposes assets, not raw filesystem paths. This prevents path traversal and keeps future cloud storage migration straightforward.

## Campaigns

- `POST /campaigns`
  - Creates campaign with product, platforms, publish mode, and scheduling preferences.
- `GET /campaigns`
- `GET /campaigns/:campaignId`
- `PATCH /campaigns/:campaignId`
- `POST /campaigns/:campaignId/generate`
  - Starts the multi-agent LangGraph workflow.
- `POST /campaigns/:campaignId/approve`
  - Approves generated posts for scheduling or publishing.

## Generated Posts

- `GET /campaigns/:campaignId/posts`
- `GET /posts/:postId`
- `PATCH /posts/:postId`
- `POST /posts/:postId/regenerate`
- `POST /posts/:postId/approve`
- `GET /posts/:postId/versions`

## Creatives

- `GET /campaigns/:campaignId/creatives`
- `POST /campaigns/:campaignId/creatives/regenerate`
- `GET /creatives/:creativeId/variants`

## Agent Runs

- `GET /campaigns/:campaignId/agent-runs`
- `GET /agent-runs/:runId`
- `POST /agent-runs/:runId/cancel`
- `GET /agent-runs/:runId/events`

## Social Accounts

- `GET /social-accounts`
- `GET /oauth/:provider/start`
- `GET /oauth/:provider/callback`
- `DELETE /social-accounts/:socialAccountId`

## Publishing

- `POST /campaigns/:campaignId/schedule`
- `POST /campaigns/:campaignId/publish`
- `GET /campaigns/:campaignId/publish-jobs`
- `POST /publish-jobs/:publishJobId/cancel`
- `POST /webhooks/social/:provider`

Design decision: direct publish and scheduled publish share publish jobs, so idempotency and retries are consistent.

## Analytics

- `GET /campaigns/:campaignId/analytics`
- `GET /products/:productId/analytics`
- `GET /analytics/recommendations`
- `POST /analytics/import`
  - Protected endpoint for n8n or internal workers to store normalized metrics.

## Operational

- `GET /health`
- `GET /ready`
- `GET /version`

