# Database Schema Design

Primary schema source: `prisma/schema.prisma`.

## Entity Groups

## Tenancy and Users

- `Tenant`: Owns all business data.
- `User`: Belongs to one tenant and has a role.

Design decision: tenant ownership is modeled directly on records that are queried frequently. This makes tenant filtering explicit and reduces accidental cross-tenant reads.

## Product Intake

- `Product`: Stores name, description, features, category, target audience, optional brand guidelines, and metadata.
- `Asset`: Stores uploaded product images, generated creatives, and resized variants.

Design decision: files are stored outside PostgreSQL. The database stores metadata, storage keys, public URLs, dimensions, checksums, and ownership.

## Campaign Generation

- `Campaign`: Defines selected platforms, publish mode, scheduling preferences, approval state, and current status.
- `AgentRun`: Tracks each LangGraph execution.
- `AgentRunEvent`: Records agent-level progress and errors.
- `CreativeBrief`: Stores platform-level visual strategy and image prompts.
- `QualityCheck`: Stores validation results from the workflow quality gate.

Design decision: agent runs are separate from campaigns because a campaign can be regenerated multiple times.

## Generated Content

- `GeneratedPost`: Stores one platform-specific generated post.
- `GeneratedPostVersion`: Stores edits and regeneration history.
- `PostAsset`: Connects posts to source, generated, or resized images.

Design decision: posts are versioned because review, approval, regeneration, and manual edits must be auditable in production.

## Publishing

- `SocialAccount`: Stores connected social accounts with encrypted OAuth tokens.
- `PublishJob`: Stores direct and scheduled publishing work with idempotency keys.

Design decision: publish jobs are durable records instead of in-memory tasks because publishing can fail, be retried, or be triggered by n8n later.

## Analytics

- `AnalyticsEvent`: Stores normalized engagement metrics from each platform.
- `AnalyticsRecommendation`: Stores summarized recommendations for future campaigns.

Design decision: analytics are event-based so the system can ingest different platform metrics without changing schema for every new metric.

## Audit

- `AuditEvent`: Tracks sensitive actions like approval, publishing, social account connection, and token revocation.

Design decision: audit logging is part of the initial schema because retrofitting it after publishing is live usually leaves gaps.

