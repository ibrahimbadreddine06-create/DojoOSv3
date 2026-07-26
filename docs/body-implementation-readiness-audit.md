# Body implementation readiness audit

Status: pre-implementation gate  
Date: 2026-07-25

## Baseline

- `npm run check`: passes before the new production connector/storage work.
- Existing Body UI/design work is extensive and must be preserved.
- Existing daily snapshot/log tables are useful legacy product state, but they
  are not an adequate canonical wearable provenance model.
- No production connector should write directly into `daily_state` without raw
  observation, source, time, coverage and resolution records.

## Critical findings

### P0 — HRV is written as recovery score

The Apple Shortcut webhook currently maps:

`hrv → daily_state.recoveryScore`

HRV and recovery score are not semantically equivalent. HRV is a measurement
with statistic/protocol requirements; recovery score is normally a proprietary
or validated composite result. This path must not be used for production
ingestion.

### P0 — OAuth state is not a secure authorization transaction

The Google Fit scaffold encodes a user ID as base64 state. It is not random,
single-use, expiring or bound to the initiating session/provider/scopes.
Production OAuth needs a server-side authorization transaction and constant-
time validation.

### P0 — Tokens are stored on the user record

Provider tokens currently live in `users.googleFitTokens` as JSON. The model has
no per-connection lifecycle, encryption envelope metadata, scope receipt,
rotation/revocation audit or resource-level health.

### P0 — Legacy Google Fit route is not a 2026 connection strategy

The product research selects Android Health Connect and eligible provider APIs,
not a misleading legacy Google Fit scaffold. The legacy route must be disabled
until a separately verified supported path exists.

### P0 — Shortcut payload lacks provenance

The Apple webhook accepts a daily summary payload with no:

- original HealthKit record IDs;
- sample/interval boundaries;
- source app/device;
- original unit;
- timezone/offset;
- quality/metadata;
- overlap/deduplication information;
- payload/schema version.

It therefore cannot safely claim canonical HealthKit ingestion.

### P0 — Webhook secret is returned and stored in plaintext

The Apple webhook token is stored directly on the user record and returned in
the response. A production push bridge needs a hashed credential lookup,
rotation, revocation, replay controls, versioned signed payloads and rate
limits.

### P1 — Daily snapshot schema collapses provenance

`daily_state` contains convenient fields such as steps, sleep hours and scores,
but cannot represent:

- multiple sources;
- raw observations and revisions;
- provider-specific semantics;
- source/protocol boundaries;
- episodes and sessions;
- partial coverage;
- stale/conflict/permission states;
- calculation versions and dependencies.

It may become a projection/cache after the canonical layer exists; it cannot be
the source of truth.

### P1 — Ambiguous composite fields exist

Fields such as `effortScore`, `balanceScore`, `momentumScore`,
`readinessScore`, `stressScore` and `recoveryScore` do not currently carry
provider namespace, formula version or evidence disposition. They must not feed
production health claims until individually specified.

### P1 — Caloric balance can imply unsupported precision

`caloricBalance = consumed - goal` may be a plan comparison, but must not be
presented as exact physiological energy balance. Naming and UI interpretation
need explicit separation.

### P1 — Profile stores age rather than birth-date/effective context

An integer age becomes stale and loses the date on which it applied. Metrics
requiring age should derive it from a properly consented date/year-of-birth
contract at calculation time, subject to minimization.

### P1 — Sex field needs calculation-purpose semantics

The current free-text `sex` field is too weak for calculations. Each metric
must declare whether it needs sex-related physiological reference inputs and
which accepted values/unknown behavior apply. Sensitive features remain
explicit opt-in.

## Required target layers

### Connection layer

- provider registry and verified capabilities;
- encrypted credential reference;
- granted scopes and consent receipt;
- connection/resource health;
- OAuth transaction state;
- cursor/webhook state;
- reconnect/disconnect/delete lifecycle.

### Raw event layer

- provider payload/audit-safe representation;
- immutable ingestion envelope;
- provider record ID/version/deletion;
- idempotency and replay protection.

### Canonical observation layer

- canonical type and value/unit;
- interval/instant/local-day semantics;
- provider/source/device;
- manual/provider/Body-derived classification;
- quality, coverage and status;
- supersession/deletion.

### Resolution layer

- exact duplicate and overlap decisions;
- preferred-source policy;
- conflict state;
- auditable accepted/excluded contribution graph.

### Metric-result layer

- metric ID/specification version;
- period and value/unit;
- inputs and transformation;
- coverage/freshness/uncertainty;
- valid/stale/partial/conflict status.

### Projection/API layer

- widget/detail read models;
- source/coverage context;
- data-state envelope;
- stable pagination/range semantics;
- no fake fallback values.

## Safe migration sequence

1. Add canonical connection, consent, raw event, observation, resolution and
   metric-result tables without deleting legacy fields.
2. Disable unsafe legacy ingestion writes.
3. Implement one end-to-end provider-independent manual/import path against the
   canonical model.
4. Implement one verified provider route behind a feature flag.
5. Build projections from canonical records.
6. Compare projections with legacy screens without switching production reads.
7. Migrate one umbrella at a time.
8. Retire legacy snapshot fields only after provenance-preserving parity and
   rollback validation.

## External blockers that are not excuses for fake implementation

- Provider partnership/approval for gated APIs.
- OAuth client credentials and reviewed redirect URIs.
- Native iOS HealthKit and Android Health Connect hosts.
- Token-encryption/KMS decision.
- Production database migration/backup environment.
- Legal/DPIA approval for launch purposes and jurisdictions.

These block live connectivity, not the canonical architecture, schemas,
simulators, contract tests or honest unsupported states.

