#!/usr/bin/env tsx
/**
 * Additive migration for the Body operational spine.
 *
 * This migration never drops legacy Body records. It creates the canonical
 * intent/execution/reconciliation layer used by Planner, Body, and Goals.
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
  `CREATE TABLE IF NOT EXISTS activity_definitions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar,
    slug text NOT NULL,
    name text NOT NULL,
    aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
    category text,
    supported_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
    instructions text,
    image_url text,
    source text NOT NULL DEFAULT 'curated',
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS activity_definitions_curated_slug_unique
    ON activity_definitions (slug) WHERE user_id IS NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS activity_definitions_private_slug_unique
    ON activity_definitions (user_id, slug) WHERE user_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS activity_definitions_owner_name_idx
    ON activity_definitions (user_id, name)`,

  `CREATE TABLE IF NOT EXISTS body_subjects (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    subject_type text NOT NULL,
    entity_id varchar NOT NULL,
    title_snapshot text,
    privacy_class text NOT NULL DEFAULT 'general_wellness',
    source text NOT NULL DEFAULT 'body',
    created_at timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz,
    CONSTRAINT body_subjects_user_type_entity_unique
      UNIQUE (user_id, subject_type, entity_id)
  )`,
  `CREATE INDEX IF NOT EXISTS body_subjects_user_type_idx
    ON body_subjects (user_id, subject_type)`,

  `CREATE TABLE IF NOT EXISTS body_commitments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    subject_id varchar NOT NULL REFERENCES body_subjects(id),
    schedule_kind text NOT NULL,
    local_date date,
    planned_start_at timestamptz,
    planned_end_at timestamptz,
    timezone text,
    recurrence_rule_id varchar,
    planner_block_id varchar REFERENCES time_blocks(id),
    status text NOT NULL DEFAULT 'planned',
    source text NOT NULL DEFAULT 'body',
    source_reference text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
      schedule_kind <> 'timed' OR
      (
        planned_start_at IS NOT NULL AND
        planned_end_at IS NOT NULL AND
        timezone IS NOT NULL
      )
    ),
    CHECK (planned_end_at IS NULL OR planned_start_at IS NULL OR planned_end_at > planned_start_at),
    CHECK (schedule_kind <> 'day_bound' OR local_date IS NOT NULL),
    CONSTRAINT body_commitments_planner_block_unique UNIQUE (planner_block_id)
  )`,
  `CREATE INDEX IF NOT EXISTS body_commitments_user_date_idx
    ON body_commitments (user_id, local_date)`,
  `CREATE INDEX IF NOT EXISTS body_commitments_subject_status_idx
    ON body_commitments (subject_id, status)`,

  `CREATE TABLE IF NOT EXISTS body_executions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    subject_id varchar NOT NULL REFERENCES body_subjects(id),
    commitment_id varchar REFERENCES body_commitments(id),
    status text NOT NULL DEFAULT 'ready',
    actual_start_at timestamptz,
    actual_end_at timestamptz,
    timezone text,
    source text NOT NULL DEFAULT 'manual',
    domain_record_type text,
    domain_record_id varchar,
    evidence jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (actual_end_at IS NULL OR actual_start_at IS NULL OR actual_end_at > actual_start_at),
    CHECK (
      status NOT IN ('in_progress', 'paused', 'completed', 'partial', 'abandoned')
      OR actual_start_at IS NOT NULL
    ),
    CONSTRAINT body_executions_user_domain_record_unique
      UNIQUE (user_id, domain_record_type, domain_record_id)
  )`,
  `CREATE INDEX IF NOT EXISTS body_executions_user_start_idx
    ON body_executions (user_id, actual_start_at)`,
  `CREATE INDEX IF NOT EXISTS body_executions_subject_status_idx
    ON body_executions (subject_id, status)`,
  `CREATE INDEX IF NOT EXISTS body_executions_commitment_idx
    ON body_executions (commitment_id)`,
  `ALTER TABLE body_executions
    ADD COLUMN IF NOT EXISTS evidence jsonb`,

  `CREATE TABLE IF NOT EXISTS body_execution_observations (
    execution_id varchar NOT NULL REFERENCES body_executions(id),
    observation_id varchar NOT NULL REFERENCES body_observations(id),
    role text NOT NULL DEFAULT 'evidence',
    linked_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT body_execution_observations_unique
      UNIQUE (execution_id, observation_id)
  )`,
  `CREATE INDEX IF NOT EXISTS body_execution_observations_observation_idx
    ON body_execution_observations (observation_id)`,

  `CREATE TABLE IF NOT EXISTS body_reconciliations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    commitment_id varchar NOT NULL REFERENCES body_commitments(id),
    execution_id varchar NOT NULL REFERENCES body_executions(id),
    resolution text NOT NULL,
    confidence numeric(6, 5)
      CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    confirmed_by_user boolean NOT NULL DEFAULT false,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT body_reconciliations_commitment_execution_unique
      UNIQUE (commitment_id, execution_id)
  )`,
  `CREATE INDEX IF NOT EXISTS body_reconciliations_user_idx
    ON body_reconciliations (user_id)`,

  `CREATE TABLE IF NOT EXISTS body_goal_links (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    goal_id varchar NOT NULL REFERENCES goals(id),
    subject_id varchar REFERENCES body_subjects(id),
    canonical_type text,
    criterion_version text NOT NULL,
    criterion jsonb NOT NULL,
    target_value numeric(20, 8),
    target_unit text,
    valid_from timestamptz,
    valid_to timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (subject_id IS NOT NULL OR canonical_type IS NOT NULL),
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from)
  )`,
  `CREATE INDEX IF NOT EXISTS body_goal_links_goal_idx
    ON body_goal_links (goal_id)`,
  `CREATE INDEX IF NOT EXISTS body_goal_links_subject_idx
    ON body_goal_links (subject_id)`,

  `CREATE TABLE IF NOT EXISTS body_goal_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    goal_link_id varchar NOT NULL REFERENCES body_goal_links(id),
    execution_id varchar REFERENCES body_executions(id),
    observation_id varchar REFERENCES body_observations(id),
    contribution numeric(20, 8) NOT NULL,
    occurred_at timestamptz NOT NULL,
    reversed_at timestamptz,
    reversal_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (execution_id IS NOT NULL OR observation_id IS NOT NULL)
  )`,
  `CREATE INDEX IF NOT EXISTS body_goal_events_link_time_idx
    ON body_goal_events (goal_link_id, occurred_at)`,
  `CREATE INDEX IF NOT EXISTS body_goal_events_execution_idx
    ON body_goal_events (execution_id)`,
  `CREATE INDEX IF NOT EXISTS body_goal_events_observation_idx
    ON body_goal_events (observation_id)`,
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
      `Body operational migration complete (${statements.length} statements).`,
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
  console.error("Body operational migration failed:", error);
  process.exit(1);
});
