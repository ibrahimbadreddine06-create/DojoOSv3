#!/usr/bin/env tsx
/**
 * Additive migration for the canonical Body health-data foundation.
 *
 * It never drops or rewrites legacy Body tables. Run against a reviewed backup
 * first, then use canonical projections before retiring any legacy field.
 */
import "dotenv/config";
import { Pool } from "@neondatabase/serverless";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL is required");
}

const pool = new Pool({ connectionString });

const statements = [
  `CREATE TABLE IF NOT EXISTS body_consent_receipts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    provider_id text,
    purpose_ids text[] NOT NULL,
    data_categories text[] NOT NULL,
    scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
    notice_version text NOT NULL,
    action text NOT NULL CHECK (action IN ('granted', 'refused', 'withdrawn')),
    locale text NOT NULL,
    collection_surface text NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS body_consent_receipts_user_recorded_idx
    ON body_consent_receipts (user_id, recorded_at)`,
  `CREATE INDEX IF NOT EXISTS body_consent_receipts_provider_idx
    ON body_consent_receipts (provider_id)`,

  `CREATE TABLE IF NOT EXISTS body_connections (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    provider_id text NOT NULL,
    route text NOT NULL CHECK (route IN (
      'server_oauth', 'native_ios', 'native_android',
      'signed_push_bridge', 'file_import'
    )),
    status text NOT NULL CHECK (status IN (
      'not_configured', 'authorization_pending', 'connected_awaiting_data',
      'connected', 'degraded', 'permission_lost', 'disconnected', 'error'
    )),
    credential_reference text,
    granted_scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
    consent_receipt_id varchar NOT NULL REFERENCES body_consent_receipts(id),
    connected_at timestamptz,
    disconnected_at timestamptz,
    last_successful_sync_at timestamptz,
    last_attempted_sync_at timestamptz,
    last_error_code text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT body_connections_user_provider_route_unique
      UNIQUE (user_id, provider_id, route)
  )`,
  `CREATE INDEX IF NOT EXISTS body_connections_user_status_idx
    ON body_connections (user_id, status)`,

  `CREATE TABLE IF NOT EXISTS body_oauth_transactions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    provider_id text NOT NULL,
    state_hash text NOT NULL UNIQUE,
    session_binding_hash text NOT NULL,
    requested_scopes text[] NOT NULL,
    redirect_uri text NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS body_oauth_transactions_user_provider_idx
    ON body_oauth_transactions (user_id, provider_id)`,
  `CREATE INDEX IF NOT EXISTS body_oauth_transactions_expires_idx
    ON body_oauth_transactions (expires_at)`,

  `CREATE TABLE IF NOT EXISTS body_resource_sync_states (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id varchar NOT NULL REFERENCES body_connections(id),
    resource_family text NOT NULL,
    state text NOT NULL,
    cursor_reference text,
    requested_from timestamptz,
    received_through timestamptz,
    last_successful_sync_at timestamptz,
    record_count integer NOT NULL DEFAULT 0 CHECK (record_count >= 0),
    error_code text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT body_resource_sync_connection_family_unique
      UNIQUE (connection_id, resource_family)
  )`,
  `CREATE INDEX IF NOT EXISTS body_resource_sync_state_idx
    ON body_resource_sync_states (state)`,

  `CREATE TABLE IF NOT EXISTS body_raw_ingestion_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    connection_id varchar NOT NULL REFERENCES body_connections(id),
    provider_id text NOT NULL,
    resource_family text NOT NULL,
    provider_record_id text,
    provider_record_version text,
    operation text NOT NULL CHECK (operation IN ('upsert', 'delete')),
    idempotency_key text NOT NULL,
    payload_hash text NOT NULL,
    payload_reference text,
    received_at timestamptz NOT NULL,
    processed_at timestamptz,
    processing_error_code text,
    CONSTRAINT body_raw_ingestion_connection_idempotency_unique
      UNIQUE (connection_id, idempotency_key)
  )`,
  `CREATE INDEX IF NOT EXISTS body_raw_ingestion_user_received_idx
    ON body_raw_ingestion_events (user_id, received_at)`,
  `CREATE INDEX IF NOT EXISTS body_raw_ingestion_provider_record_idx
    ON body_raw_ingestion_events (provider_id, provider_record_id)`,

  `CREATE TABLE IF NOT EXISTS body_observations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    canonical_type text NOT NULL,
    numeric_value numeric(20, 8),
    text_value text,
    structured_value jsonb,
    canonical_unit text,
    observed_at timestamptz,
    interval_start timestamptz,
    interval_end timestamptz,
    local_date date,
    timezone text,
    source_class text NOT NULL,
    provider_id text NOT NULL,
    ingestion_route text NOT NULL,
    provider_record_id text,
    provider_record_version text,
    original_type text NOT NULL,
    original_unit text,
    original_value jsonb,
    source_app_id text,
    source_device_id text,
    raw_ingestion_event_id varchar REFERENCES body_raw_ingestion_events(id),
    consent_receipt_id varchar REFERENCES body_consent_receipts(id),
    coverage_ratio numeric(6, 5)
      CHECK (coverage_ratio IS NULL OR coverage_ratio BETWEEN 0 AND 1),
    source_status text,
    source_quality text,
    uncertainty text[] NOT NULL DEFAULT ARRAY[]::text[],
    status text NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'superseded', 'deleted', 'quarantined')),
    supersedes_observation_id varchar,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
      observed_at IS NOT NULL OR
      (interval_start IS NOT NULL AND interval_end IS NOT NULL) OR
      local_date IS NOT NULL
    ),
    CHECK (
      interval_end IS NULL OR interval_start IS NULL OR
      interval_end >= interval_start
    )
  )`,
  `CREATE INDEX IF NOT EXISTS body_observations_user_type_time_idx
    ON body_observations (user_id, canonical_type, observed_at)`,
  `CREATE INDEX IF NOT EXISTS body_observations_user_type_date_idx
    ON body_observations (user_id, canonical_type, local_date)`,
  `CREATE INDEX IF NOT EXISTS body_observations_provider_record_idx
    ON body_observations (provider_id, provider_record_id)`,
  `CREATE INDEX IF NOT EXISTS body_observations_interval_idx
    ON body_observations (user_id, interval_start, interval_end)`,

  `CREATE TABLE IF NOT EXISTS body_resolution_decisions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    canonical_type text NOT NULL,
    period_start timestamptz,
    period_end timestamptz,
    strategy_id text NOT NULL,
    strategy_version text NOT NULL,
    accepted_observation_ids text[] NOT NULL,
    excluded_observation_ids text[] NOT NULL,
    state text NOT NULL,
    rationale jsonb NOT NULL,
    decided_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS body_resolution_user_type_period_idx
    ON body_resolution_decisions (user_id, canonical_type, period_start)`,

  `CREATE TABLE IF NOT EXISTS body_metric_results (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    metric_id text NOT NULL,
    specification_version text NOT NULL,
    disposition text NOT NULL CHECK (disposition IN (
      'body_calculated', 'observation', 'provider_result',
      'research_only', 'rejected'
    )),
    numeric_value numeric(20, 8),
    text_value text,
    structured_value jsonb,
    canonical_unit text,
    period_start timestamptz,
    period_end timestamptz,
    local_date date,
    state text NOT NULL,
    source_namespace text,
    transformation_id text,
    coverage_ratio numeric(6, 5)
      CHECK (coverage_ratio IS NULL OR coverage_ratio BETWEEN 0 AND 1),
    fresh_until timestamptz,
    uncertainty text[] NOT NULL DEFAULT ARRAY[]::text[],
    generated_at timestamptz NOT NULL,
    superseded_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS body_metric_results_user_metric_period_idx
    ON body_metric_results (user_id, metric_id, period_start)`,
  `CREATE INDEX IF NOT EXISTS body_metric_results_user_metric_date_idx
    ON body_metric_results (user_id, metric_id, local_date)`,

  `CREATE TABLE IF NOT EXISTS body_metric_result_inputs (
    metric_result_id varchar NOT NULL REFERENCES body_metric_results(id),
    observation_id varchar NOT NULL REFERENCES body_observations(id),
    role text NOT NULL DEFAULT 'input',
    CONSTRAINT body_metric_result_inputs_unique
      UNIQUE (metric_result_id, observation_id)
  )`,
  `CREATE INDEX IF NOT EXISTS body_metric_result_inputs_observation_idx
    ON body_metric_result_inputs (observation_id)`,
] as const;

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query("COMMIT");
    console.log(
      `Canonical Body migration complete (${statements.length} statements).`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Canonical Body migration failed:", error);
  process.exit(1);
});

