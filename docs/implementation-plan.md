# Implementation Roadmap

## Phase 1: System Design

Status: complete after this architecture pass.

Deliverables:

- Production architecture.
- Folder structure.
- Prisma database schema.
- Multi-agent LangGraph workflow.
- API endpoint design.
- Environment variable design.

## Phase 2: Implementation Roadmap

The build should proceed in small, verifiable slices. Each slice should include tests before moving to the next one.

### 2.1 Backend Foundation

- Initialize Node.js, TypeScript, Express, Prisma, ESLint, Prettier, and test tooling.
- Add environment validation with a typed config module.
- Add request IDs, structured logging, centralized errors, and health routes.
- Add Prisma client lifecycle and migration scripts.

Acceptance criteria:

- API starts locally.
- `/health` and `/ready` work.
- Prisma connects to PostgreSQL.
- Unit and integration test commands run.

### 2.2 Product and Asset Intake

- Implement product CRUD.
- Implement local image upload.
- Store files under `storage/uploads`.
- Persist image metadata and checksums.
- Validate product inputs and image MIME types.

Acceptance criteria:

- Product can be created with required fields.
- Images can be uploaded and listed.
- API never exposes raw filesystem paths.

### 2.3 Campaign and Agent Run Foundation

- Implement campaign creation.
- Implement agent run records.
- Add LangGraph base graph with durable state snapshots.
- Add agent event logging.

Acceptance criteria:

- Campaign can be generated asynchronously.
- Agent run status is queryable.
- Failed runs persist error details.

### 2.4 Product Analysis Agent

- Implement Gemini prompt and output schema.
- Extract selling points, pain points, objections, and marketing angles.
- Validate structured output before persistence.

Acceptance criteria:

- Agent produces deterministic JSON shape.
- Invalid model output is retried or rejected.

### 2.5 Creative Strategy Agent

- Generate campaign themes and image prompts.
- Use brand guidelines and historical analytics context.
- Persist creative briefs.

Acceptance criteria:

- Each platform receives a creative brief.
- Prompts include negative constraints when brand guidelines require them.

### 2.6 Caption Generation Agent

- Generate Instagram, LinkedIn, Facebook, and X/Twitter posts.
- Enforce platform limits outside the prompt.
- Store generated post versions.

Acceptance criteria:

- One post draft exists per selected platform.
- Captions pass validation and can be regenerated.

### 2.7 Image Processing Agent

- Generate additional creatives when provider is configured.
- Resize assets to platform-specific dimensions.
- Store variants under `storage/generated` and `storage/resized`.

Acceptance criteria:

- Each selected platform has at least one usable image variant.
- Image failures do not block caption-only campaign generation.

### 2.8 Publishing Agent

- Add social account OAuth storage.
- Create scheduled publish jobs.
- Implement idempotent publishing adapter interfaces.
- Add n8n workflow trigger contract.

Acceptance criteria:

- Approved posts create publish jobs.
- Duplicate publish requests do not create duplicate external posts.

### 2.9 Analytics Agent

- Implement analytics import endpoint.
- Normalize metrics.
- Generate improvement recommendations.
- Feed summaries back into future graph runs.

Acceptance criteria:

- Metrics are stored by campaign, post, platform, and timestamp.
- Future campaigns can read analytics recommendations.

### 2.10 Production Hardening

- Add role-based access control.
- Add rate limits.
- Add audit logs.
- Add queue retries and dead-letter handling.
- Add deployment docs and backup strategy.

Acceptance criteria:

- Critical actions are audited.
- Slow work is queued.
- Operational failure modes are visible.

## Phase 3: Component Implementation Order

1. Project initialization and config.
2. Prisma schema and migrations.
3. Express health, auth skeleton, and error middleware.
4. Product API.
5. Local storage and product image API.
6. Campaign API.
7. LangGraph orchestrator.
8. Product Analysis Agent.
9. Creative Strategy Agent.
10. Caption Generation Agent.
11. Image Processing Agent.
12. Generated post review and approval API.
13. Publishing jobs and social account OAuth.
14. n8n workflow integration.
15. Analytics ingestion and recommendations.
16. Hardening, tests, and deployment runbooks.

