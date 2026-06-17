CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE social_platform AS ENUM ('instagram', 'linkedin', 'facebook', 'x');
CREATE TYPE campaign_status AS ENUM ('draft', 'generating', 'needs_review', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled');
CREATE TYPE asset_kind AS ENUM ('source_product_image', 'generated_creative', 'resized_creative');
CREATE TYPE content_status AS ENUM ('draft', 'needs_review', 'approved', 'rejected', 'published');
CREATE TYPE publish_status AS ENUM ('queued', 'scheduled', 'publishing', 'published', 'failed', 'cancelled');
CREATE TYPE agent_run_status AS ENUM ('queued', 'running', 'needs_input', 'succeeded', 'failed', 'cancelled');

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_audience text NOT NULL,
  brand_voice text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  campaign_id uuid,
  kind asset_kind NOT NULL,
  storage_key text NOT NULL,
  public_url text,
  mime_type text NOT NULL,
  width integer,
  height integer,
  checksum text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  platforms social_platform[] NOT NULL,
  publish_mode text NOT NULL DEFAULT 'manual',
  scheduled_at timestamptz,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assets
  ADD CONSTRAINT assets_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status agent_run_status NOT NULL DEFAULT 'queued',
  graph_name text NOT NULL,
  graph_version text NOT NULL,
  llm_provider text NOT NULL,
  llm_model text NOT NULL,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  error jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE generated_content (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  platform social_platform NOT NULL,
  status content_status NOT NULL DEFAULT 'draft',
  caption text NOT NULL,
  hashtags text[] NOT NULL DEFAULT '{}',
  call_to_action text,
  selling_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_version text NOT NULL,
  model_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  edited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE generated_content_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES generated_content(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  caption text NOT NULL,
  hashtags text[] NOT NULL DEFAULT '{}',
  call_to_action text,
  selling_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  change_reason text NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, version_number)
);

CREATE TABLE content_assets (
  content_id uuid NOT NULL REFERENCES generated_content(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (content_id, asset_id)
);

CREATE TABLE quality_checks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  check_name text NOT NULL,
  status text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE social_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  account_name text NOT NULL,
  external_account_id text NOT NULL,
  encrypted_access_token text NOT NULL,
  encrypted_refresh_token text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, platform, external_account_id)
);

CREATE TABLE publish_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES generated_content(id) ON DELETE CASCADE,
  social_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE RESTRICT,
  platform social_platform NOT NULL,
  status publish_status NOT NULL DEFAULT 'queued',
  idempotency_key text NOT NULL UNIQUE,
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  error jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  content_id uuid REFERENCES generated_content(id) ON DELETE SET NULL,
  publish_job_id uuid REFERENCES publish_jobs(id) ON DELETE SET NULL,
  platform social_platform NOT NULL,
  external_post_id text,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  measured_at timestamptz NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_assets_tenant_product ON assets(tenant_id, product_id);
CREATE INDEX idx_campaigns_tenant_product ON campaigns(tenant_id, product_id);
CREATE INDEX idx_agent_runs_campaign ON agent_runs(campaign_id, created_at DESC);
CREATE INDEX idx_generated_content_campaign ON generated_content(campaign_id, platform);
CREATE INDEX idx_generated_content_versions_content ON generated_content_versions(content_id, version_number DESC);
CREATE INDEX idx_quality_checks_campaign ON quality_checks(campaign_id, created_at DESC);
CREATE INDEX idx_publish_jobs_status ON publish_jobs(status, scheduled_at);
CREATE INDEX idx_analytics_campaign_platform ON analytics_events(campaign_id, platform, measured_at DESC);
CREATE INDEX idx_audit_events_tenant_created ON audit_events(tenant_id, created_at DESC);
