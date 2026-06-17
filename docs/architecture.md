# AI Marketing Agent Architecture

## Goal

Build a production-ready backend system that accepts product information and images, creates platform-specific social content, generates marketing creatives, prepares platform image sizes, schedules publishing, publishes through social APIs, stores analytics, and uses those analytics to improve future campaigns.

## Design Decisions

- `Multiple specialized agents`: Product analysis, creative strategy, caption generation, image processing, publishing, and analytics are separate agents. This keeps prompts smaller, makes failures easier to isolate, and allows each agent to evolve independently.
- `LangGraph orchestration`: The graph owns state transitions, retries, conditional branches, and handoffs between agents. This is better than a linear service call chain because generation workflows frequently need review, retry, or partial completion.
- `Gemini default with provider abstraction`: Gemini is the default LLM, but calls go through an internal LLM gateway so OpenAI or another provider can be added without rewriting agents.
- `PostgreSQL + Prisma`: PostgreSQL is the durable system of record. Prisma provides typed data access, migrations, and a clear schema contract for the Node.js backend.
- `Local file storage initially`: Uploaded product images and generated assets are stored under `storage/` for the first production slice. The storage adapter keeps the interface compatible with future S3 or GCS migration.
- `n8n for external automation`: n8n handles scheduled publishing triggers, analytics collection, retry workflows, and operational notifications where visual orchestration is useful.
- `Approval-first publishing`: Generated content is saved as drafts and requires approval unless a campaign explicitly enables auto-publish.

## Core Services

- `Express API`: REST API for products, assets, campaigns, generated content, publishing, social accounts, agent runs, and analytics.
- `Agent Orchestrator`: LangGraph workflow that coordinates specialized agents.
- `Prisma Data Layer`: Tenant-aware repositories using Prisma Client.
- `Storage Service`: Local filesystem storage for uploads, generated creatives, and resized variants.
- `LLM Gateway`: Gemini-first adapter for text, vision, and image-generation prompt preparation.
- `Image Service`: Uses provided images, generates derivative creatives through an image provider when enabled, and resizes assets per platform.
- `Publishing Service`: Creates publish jobs, applies schedules, and calls social API adapters.
- `Analytics Service`: Ingests platform metrics and produces campaign improvement recommendations.

## Request Flow

1. Client creates a product with name, description, features, category, target audience, optional brand guidelines, and images.
2. Client creates a campaign with selected platforms and publish preferences.
3. API persists product, assets, campaign, and an agent run.
4. LangGraph executes specialized agents in order.
5. Generated captions, creative prompts, image assets, resized variants, and schedule recommendations are persisted.
6. User reviews and approves generated posts.
7. Publishing agent creates scheduled publish jobs.
8. n8n triggers due jobs and analytics collection.
9. Analytics agent summarizes results and stores recommendations for future campaigns.

## Folder Structure

```text
prisma/
  schema.prisma                  Prisma data model and migration source
db/
  migrations/                    Legacy SQL/reference migrations
docs/                            Architecture, workflow, API, and roadmap docs
n8n/                             n8n workflow exports and setup notes
scripts/                         Developer and operational scripts
storage/
  uploads/                       Local source product images
  generated/                     AI-generated creative originals
  resized/                       Platform-specific image variants
src/
  api/
    controllers/                 Request handlers
    middleware/                  Auth, validation, errors, rate limiting
    routes/                      Express route definitions
  agents/
    graphs/                      LangGraph composition
    product-analysis/            Product Analysis Agent
    creative-strategy/           Creative Strategy Agent
    caption-generation/          Caption Generation Agent
    image-processing/            Image Processing Agent
    publishing/                  Publishing Agent
    analytics/                   Analytics Agent
    prompts/                     Versioned prompts
  config/                        Environment validation and runtime config
  database/                      Prisma client and repository helpers
  integrations/
    image/                       Image generation/editing provider adapter
    llm/                         Gemini and future provider adapters
    social/                      Instagram, LinkedIn, Facebook, X clients
    storage/                     Local storage adapter, future S3 adapter
  jobs/                          Queue workers and scheduled job handlers
  services/                      Business orchestration services
  types/                         Shared TypeScript types
  utils/                         Logging, errors, idempotency, helpers
tests/
  integration/
  unit/
```

## Agent Responsibilities

- `Product Analysis Agent`: Converts product inputs into structured positioning, selling points, customer pain points, objections, and marketing angles.
- `Creative Strategy Agent`: Converts product analysis into campaign themes, visual directions, image-generation prompts, and platform creative briefs.
- `Caption Generation Agent`: Produces Instagram, LinkedIn, Facebook, and X/Twitter captions with platform-specific tone, length, hashtags, and CTAs.
- `Image Processing Agent`: Stores source images, generates additional creatives when configured, and produces platform-specific sizes.
- `Publishing Agent`: Builds publishing schedules, creates publish jobs, handles approval policy, and calls social integrations.
- `Analytics Agent`: Ingests metrics, stores normalized engagement data, and recommends improvements for future content.

## Production Boundaries

- Agents do not directly write arbitrary database records. They return structured outputs that services validate and persist.
- Social publishing is idempotent using `PublishJob.idempotencyKey`.
- OAuth tokens are encrypted before persistence.
- All records are tenant-scoped from the first implementation phase.
- Local storage paths are generated by the storage service and never accepted directly from user input.
- Generated content is versioned so edits and approvals are auditable.
- Platform constraints are centralized in config, not duplicated across prompts.
- n8n calls internal API endpoints with a signed secret.

