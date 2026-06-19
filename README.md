# DLF-Agent: AI-Powered Social Media Marketing Pipeline & Dashboard

DLF-Agent is a production-grade multi-agent marketing application that automates the product analysis, creative strategy, caption generation, visual asset generation, scheduling, publishing, and analytics collection for social media campaigns.

Driven by **LangGraph** and **Gemini (including Imagen 3)**, it accepts product details and source images, automatically structures marketing campaigns across platforms (Instagram, LinkedIn, Facebook, and X), resizes and generates assets, and handles immediate or scheduled publishing with a modern React monitoring dashboard.

---

## 🚀 Key Features

*   **Multi-Agent Orchestration**: Specialized agents built using LangGraph coordinate product analysis, creative strategy, copy generation, image processing, and analytics ingestion.
*   **Gemini Imagen 3 Integration**: Generates platform-tailored original creatives from visual strategy prompts, with automatic aspect-ratio adjustments and negative prompt styling.
*   **Smart Asset Resizing**: Automated platform-specific creative cropping and resizing (Instagram square/portrait, LinkedIn feed, Facebook feed, X/Twitter feed) using Sharp.
*   **Robust Background Job Queuing**: Implemented using BullMQ and Redis for fault-tolerant, asynchronous campaign generation and scheduling.
*   **Auto-Tenant Ingestion**: Automatically upserts and scopes database records per tenant, allowing seamless development and onboarding.
*   **Operational Dashboard**: React-based control center featuring visual progression tracker (Agent Run Logs), interactive settings (tenant-aware UUID helper), and creative preview modals.
*   **Statically Served Previews**: Built-in asset static serving for instant frontend rendering of generated variations.

---

## 📐 Architecture & Agent Pipeline

The application coordinates six specialized agents inside a structured LangGraph state graph.

```mermaid
graph TD
    Start([Start Campaign Job]) --> load[Load Campaign & Context]
    load --> analysis[Product Analysis Agent]
    analysis --> strategy[Creative Strategy Agent]
    strategy --> captions[Caption Generation Agent]
    captions --> images[Image Processing Agent]
    images --> gate{Quality Gate}
    gate -- Fails validation --> NeedsInput[Stop/Manual Input]
    gate -- Pass validation --> persist[Persist Campaign Node]
    persist --> publish[Publishing Agent]
    publish --> wait[Wait for Approval / Event Trigger]
    wait --> analytics[Analytics Agent]
```

### Specialized Agents

1.  **Product Analysis Agent**: Transforms product features and descriptions into customer motivations, Objection handling points, and ranked marketing angles.
2.  **Creative Strategy Agent**: Constructs Overarching campaign themes, visual direction, color moods, and visual prompts for Imagen 3.
3.  **Caption Generation Agent**: Tailors social posts per platform (Instagram, LinkedIn, Facebook, X) adjusting post length, hashtags, CTAs, and tone.
4.  **Image Processing Agent**: Integrates Gemini Imagen 3 to generate creatives, resizing them to platform standard aspect ratios.
5.  **Publishing Agent**: Manages scheduler queues, OAuth integrations, and immediate or delayed postings.
6.  **Analytics Agent**: Standardizes platform feedback metrics to improve subsequent generation loops.

---

## 📂 Project Structure

```text
├── docs/                        # Specifications, database schema, and workflows
├── prisma/                      # Prisma schema and SQLite/PostgreSQL migrations
├── scripts/                     # Operational and setup scripts
├── storage/                     # Local asset store (uploads, generated, resized)
├── tests/                       # Unit and integration test suites (Vitest)
├── frontend/                    # Vite + React + TypeScript Dashboard client
│   ├── src/
│   │   ├── components/          # Reusable UI controls (Modals, Badges, Spinners)
│   │   ├── pages/               # Campaigns, Products, Settings, Analytics
│   │   ├── api.ts               # Axios client wrapper for backend v1 API endpoints
│   │   └── hooks.ts             # useTenant (syncs UUID states), useFetch hooks
└── src/                         # Express Backend (TypeScript)
    ├── api/                     # Controllers, Middleware (Auth, Tenant Context), Routes
    ├── agents/                  # LangGraph graphs, prompt templates, and agent definitions
    ├── database/                # Prisma client setup and repository helpers
    ├── integrations/            # Providers (Gemini gateway, Sharp resizer, OAuth clients)
    ├── jobs/                    # BullMQ Queues and asynchronous event workers
    └── services/                # Business logic orchestrators
```

---

## 🛠️ Getting Started

### Prerequisites

*   Node.js (version >= 20.x)
*   PostgreSQL Database
*   Redis Server (for BullMQ queues)
*   Gemini API Key (with access to `gemini-2.5-flash` and `imagen-3.0-generate-002`)

### 1. Backend Configuration

1.  Copy the sample environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and fill in your secrets, particularly the database URL, Redis server details, and your **Gemini API Key**:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5432/ai_marketing_agent?schema=public"
    REDIS_URL="redis://localhost:6379"
    GEMINI_API_KEY="your-gemini-api-key"
    ```

3.  Install dependencies:
    ```bash
    npm install
    ```

4.  Run Prisma migrations to construct the PostgreSQL database schema:
    ```bash
    npx prisma migrate dev
    ```

5.  Start the backend development server and BullMQ background workers:
    ```bash
    npm run dev
    ```
    The backend server will list on `http://localhost:3000`.

### 2. Frontend Configuration

1.  Navigate into the frontend folder:
    ```bash
    cd frontend
    ```

2.  Install client-side dependencies:
    ```bash
    npm install
    ```

3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    Open your browser to `http://localhost:5173`.

---

## 🧪 Testing

The backend contains Vitest unit and integration test suites that mock database clients and LLM calls.

To run the tests:
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🛡️ Security and Production Scoping

*   **Multi-Tenancy**: Every database transaction is scoped via `x-tenant-id` HTTP header. Missing headers or invalid UUIDs are automatically handled via an auto-generation setup and context middleware.
*   **Credential Encryption**: Social API tokens (Instagram, LinkedIn, X, etc.) are encrypted before being persisted.
*   **Idempotency Keys**: Publishing schedules include unique idempotency parameters to prevent duplicate social network posting.

---

## 📖 Component Justifications

For detailed arguments and architectural justifications on why each component (PostgreSQL, Redis, BullMQ, n8n, LangGraph) was selected, please refer to:
*   [Component Justifications Document](file:///d:/DLF-Agent/docs/component-justifications.md)
*   [Architecture Design Document](file:///d:/DLF-Agent/docs/architecture.md)
