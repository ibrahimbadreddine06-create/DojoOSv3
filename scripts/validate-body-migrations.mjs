import fs from "node:fs";

const files = [
  "scripts/migrate-body-canonical.ts",
  "scripts/migrate-body-operational.ts",
  "scripts/backfill-body-operations.ts",
];
const sources = new Map(
  files.map((file) => [file, fs.readFileSync(file, "utf8")]),
);

for (const [file, source] of sources) {
  if (/\b(DROP|TRUNCATE)\b/i.test(source)) {
    throw new Error(`${file} contains a destructive migration statement`);
  }
  if (!source.includes('client.query("BEGIN")') || !source.includes('client.query("ROLLBACK")')) {
    throw new Error(`${file} must run inside a transaction with rollback-on-error`);
  }
}

const canonical = sources.get("scripts/migrate-body-canonical.ts");
for (const table of [
  "body_consent_receipts",
  "body_connections",
  "body_raw_ingestion_events",
  "body_observations",
  "body_metric_results",
]) {
  if (!canonical.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    throw new Error(`Canonical migration is missing ${table}`);
  }
}

const operational = sources.get("scripts/migrate-body-operational.ts");
for (const table of [
  "body_subjects",
  "body_commitments",
  "body_executions",
  "body_reconciliations",
  "body_goal_links",
  "body_goal_events",
]) {
  if (!operational.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    throw new Error(`Operational migration is missing ${table}`);
  }
}
if (!operational.includes("ADD COLUMN IF NOT EXISTS evidence jsonb")) {
  throw new Error("Operational migration is missing manual observation evidence");
}

const backfill = sources.get("scripts/backfill-body-operations.ts");
if (!/ON CONFLICT[\s\S]+DO NOTHING/i.test(backfill)) {
  throw new Error("Operational backfill must be idempotent");
}

console.log("Validated additive Body migrations and idempotent backfill.");
