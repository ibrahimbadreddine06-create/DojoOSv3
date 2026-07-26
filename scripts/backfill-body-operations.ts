#!/usr/bin/env tsx
/**
 * Idempotently projects legacy Activity/Workout records into the operational
 * spine. It preserves every legacy row and never guesses a user's timezone.
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
  `INSERT INTO activity_definitions (
      user_id, slug, name, category, source
    )
    SELECT DISTINCT
      user_id,
      lower(regexp_replace(trim(activity_type), '[^a-zA-Z0-9]+', '-', 'g')),
      COALESCE(NULLIF(trim(activity_name), ''), activity_type),
      'legacy',
      'legacy_activity'
    FROM activity_logs
    WHERE user_id IS NOT NULL AND trim(activity_type) <> ''
    ON CONFLICT (user_id, slug) DO NOTHING`,

  `INSERT INTO body_subjects (
      user_id, subject_type, entity_id, title_snapshot, source
    )
    SELECT
      definition.user_id,
      'activity',
      definition.id,
      definition.name,
      definition.source
    FROM activity_definitions definition
    WHERE definition.user_id IS NOT NULL
    ON CONFLICT (user_id, subject_type, entity_id) DO NOTHING`,

  `INSERT INTO body_executions (
      user_id,
      subject_id,
      status,
      actual_start_at,
      actual_end_at,
      source,
      domain_record_type,
      domain_record_id
    )
    SELECT
      log.user_id,
      subject.id,
      'completed',
      log.logged_at - make_interval(mins => GREATEST(COALESCE(log.duration_minutes, 0), 0)),
      log.logged_at,
      'manual',
      'activity_log',
      log.id
    FROM activity_logs log
    JOIN activity_definitions definition
      ON definition.user_id = log.user_id
      AND definition.slug = lower(regexp_replace(trim(log.activity_type), '[^a-zA-Z0-9]+', '-', 'g'))
    JOIN body_subjects subject
      ON subject.user_id = log.user_id
      AND subject.subject_type = 'activity'
      AND subject.entity_id = definition.id
    WHERE log.user_id IS NOT NULL
      AND log.logged_at IS NOT NULL
      AND COALESCE(log.duration_minutes, 0) > 0
    ON CONFLICT (user_id, domain_record_type, domain_record_id) DO NOTHING`,

  `INSERT INTO body_subjects (
      user_id, subject_type, entity_id, title_snapshot, source
    )
    SELECT
      user_id,
      'workout',
      id,
      title,
      'legacy_workout'
    FROM workouts
    WHERE user_id IS NOT NULL
    ON CONFLICT (user_id, subject_type, entity_id) DO NOTHING`,

  `INSERT INTO body_commitments (
      user_id,
      subject_id,
      schedule_kind,
      local_date,
      planner_block_id,
      status,
      source
    )
    SELECT
      workout.user_id,
      subject.id,
      'planner_linked',
      block.date,
      block.id,
      CASE WHEN workout.completed THEN 'completed' ELSE 'planned' END,
      'legacy_time_block'
    FROM workouts workout
    JOIN body_subjects subject
      ON subject.user_id = workout.user_id
      AND subject.subject_type = 'workout'
      AND subject.entity_id = workout.id
    JOIN time_blocks block ON block.id = workout.linked_block_id
    WHERE workout.user_id IS NOT NULL
    ON CONFLICT (planner_block_id) DO NOTHING`,

  `INSERT INTO body_executions (
      user_id,
      subject_id,
      commitment_id,
      status,
      actual_start_at,
      actual_end_at,
      source,
      domain_record_type,
      domain_record_id
    )
    SELECT
      workout.user_id,
      subject.id,
      commitment.id,
      CASE
        WHEN workout.completed THEN 'completed'
        WHEN workout.start_time IS NOT NULL THEN 'in_progress'
        ELSE 'ready'
      END,
      CASE
        WHEN workout.completed OR workout.start_time IS NOT NULL
          THEN COALESCE(workout.start_time, workout.date)
        ELSE NULL
      END,
      workout.end_time,
      'manual',
      'workout',
      workout.id
    FROM workouts workout
    JOIN body_subjects subject
      ON subject.user_id = workout.user_id
      AND subject.subject_type = 'workout'
      AND subject.entity_id = workout.id
    LEFT JOIN body_commitments commitment
      ON commitment.planner_block_id = workout.linked_block_id
    WHERE workout.user_id IS NOT NULL
    ON CONFLICT (user_id, domain_record_type, domain_record_id) DO NOTHING`,

  `INSERT INTO body_reconciliations (
      user_id,
      commitment_id,
      execution_id,
      resolution,
      confirmed_by_user,
      reason
    )
    SELECT
      execution.user_id,
      execution.commitment_id,
      execution.id,
      CASE
        WHEN execution.status = 'completed' THEN 'fulfilled'
        ELSE 'linked'
      END,
      false,
      'legacy linkedBlockId projection'
    FROM body_executions execution
    WHERE execution.domain_record_type = 'workout'
      AND execution.commitment_id IS NOT NULL
    ON CONFLICT (commitment_id, execution_id) DO NOTHING`,

  `INSERT INTO body_subjects (user_id, subject_type, entity_id, title_snapshot, source)
    SELECT user_id, 'intake', id, COALESCE(meal_name, meal_type, 'Intake'), 'legacy_intake'
    FROM intake_logs WHERE user_id IS NOT NULL
    ON CONFLICT (user_id, subject_type, entity_id) DO NOTHING`,

  `INSERT INTO body_commitments (user_id, subject_id, schedule_kind, local_date, planner_block_id, status, source)
    SELECT log.user_id, subject.id, 'day_bound', log.date::date, log.linked_block_id, 'planned', 'legacy_intake'
    FROM intake_logs log JOIN body_subjects subject
      ON subject.user_id = log.user_id AND subject.subject_type = 'intake' AND subject.entity_id = log.id
    WHERE log.user_id IS NOT NULL AND log.status = 'planned'
      AND NOT EXISTS (SELECT 1 FROM body_commitments existing WHERE existing.subject_id = subject.id)
    ON CONFLICT (planner_block_id) DO NOTHING`,

  `INSERT INTO body_executions (user_id, subject_id, status, actual_start_at, source, domain_record_type, domain_record_id)
    SELECT log.user_id, subject.id, 'completed', log.date, 'legacy_intake', 'intake_log', log.id
    FROM intake_logs log JOIN body_subjects subject
      ON subject.user_id = log.user_id AND subject.subject_type = 'intake' AND subject.entity_id = log.id
    WHERE log.user_id IS NOT NULL AND log.status = 'consumed'
    ON CONFLICT (user_id, domain_record_type, domain_record_id) DO NOTHING`,

  `INSERT INTO body_subjects (user_id, subject_type, entity_id, title_snapshot, source)
    SELECT user_id, 'rest', id, CASE WHEN actual_hours IS NULL THEN 'Planned sleep' ELSE 'Sleep' END, 'legacy_sleep'
    FROM sleep_logs WHERE user_id IS NOT NULL
    ON CONFLICT (user_id, subject_type, entity_id) DO NOTHING`,

  `INSERT INTO body_executions (user_id, subject_id, status, actual_start_at, actual_end_at, source, domain_record_type, domain_record_id)
    SELECT log.user_id, subject.id, 'completed', log.start_time, log.end_time, 'legacy_sleep', 'sleep_log', log.id
    FROM sleep_logs log JOIN body_subjects subject
      ON subject.user_id = log.user_id AND subject.subject_type = 'rest' AND subject.entity_id = log.id
    WHERE log.user_id IS NOT NULL AND log.start_time IS NOT NULL
    ON CONFLICT (user_id, domain_record_type, domain_record_id) DO NOTHING`,

  `INSERT INTO body_subjects (user_id, subject_type, entity_id, title_snapshot, source)
    SELECT user_id, 'hygiene_routine', id, name, 'legacy_hygiene'
    FROM hygiene_routines WHERE user_id IS NOT NULL
    ON CONFLICT (user_id, subject_type, entity_id) DO NOTHING`,

  `INSERT INTO body_subjects (user_id, subject_type, entity_id, title_snapshot, source)
    SELECT user_id, 'fasting', id, 'Fast', 'legacy_fasting'
    FROM fasting_logs WHERE user_id IS NOT NULL
    ON CONFLICT (user_id, subject_type, entity_id) DO NOTHING`,

  `INSERT INTO body_executions (user_id, subject_id, status, actual_start_at, actual_end_at, source, domain_record_type, domain_record_id)
    SELECT log.user_id, subject.id, log.status::text, log.start_time, log.end_time, 'legacy_fasting', 'fasting_log', log.id
    FROM fasting_logs log JOIN body_subjects subject
      ON subject.user_id = log.user_id AND subject.subject_type = 'fasting' AND subject.entity_id = log.id
    WHERE log.user_id IS NOT NULL
    ON CONFLICT (user_id, domain_record_type, domain_record_id) DO NOTHING`,
] as const;

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query("COMMIT");

    const counts = await client.query(`
      SELECT
        (SELECT count(*) FROM activity_definitions) AS activity_definitions,
        (SELECT count(*) FROM body_subjects) AS body_subjects,
        (SELECT count(*) FROM body_commitments) AS body_commitments,
        (SELECT count(*) FROM body_executions) AS body_executions,
        (SELECT count(*) FROM body_reconciliations) AS body_reconciliations
    `);
    console.log("Body operational backfill complete.", counts.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Body operational backfill failed:", error);
  process.exit(1);
});
