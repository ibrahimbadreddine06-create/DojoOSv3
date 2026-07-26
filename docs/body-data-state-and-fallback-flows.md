# Body wearable, manual and missing-data flows

Status: production behavior contract  
Applies to: connection, ingestion, calculation, widget, detail/history and
drawer states.

## Core model

Body never has one generic “has data” boolean. A rendered result is the output
of a state machine:

`capability → permission → connection health → ingestion → normalization →
resolution → metric eligibility → freshness/coverage → presentation`

The UI may simplify this path, but the system must retain each state so that it
never invents data, blames the user for a provider limitation or presents a
stale value as current.

## Source classes

### Direct provider

Data obtained through a supported provider API under explicit authorization.
Provider identity, original field and record identity are retained.

### Device-platform health store

Data obtained from an operating-system health repository. The original writing
source/device is retained where available; the platform store is an ingestion
route, not automatically the physiological source.

### File/import

Data imported through a documented export format. Import provenance, file
identity and source semantics are retained.

### Manual

An explicit user observation, check-in, routine completion or correction. It
is factual as a user entry and does not impersonate an automatic measurement.

### Body-derived

A result produced by a versioned Body metric specification from eligible input
records. Every result links to its inputs and algorithm version.

## Connection lifecycle

### 1. Capability discovery

Before authorization, Body knows only the documented capabilities of the
provider route and platform. It does not promise fields that depend on device,
region, account tier, firmware or provider approval.

UI result:

- eligible categories can be explained;
- conditional capabilities are labeled;
- unsupported categories are not advertised as available.

### 2. Consent request

Body requests the smallest scopes necessary for the user-selected features.
Optional categories remain optional. Sensitive scopes explain why they are
needed before the platform/provider dialog.

### 3. Connected, awaiting first sync

The connection exists but no eligible record is present yet.

UI result:

- “Connected” is distinct from “Data received”;
- widget states say they are awaiting data;
- no zero value or fabricated preview replaces missing data.

### 4. Initial backfill

Historical ingestion is bounded by provider access, granted scope and product
policy. Progress is tracked per resource family, not as one misleading global
percentage.

### 5. Incremental sync

Cursor/token/webhook behavior is provider-specific. Each successful cycle
records:

- requested and received interval/cursor;
- provider response status;
- records created, updated, deleted or rejected;
- next cursor/token;
- connection and resource-family freshness.

### 6. Degraded

A connection may remain authorized while one resource family is delayed,
unsupported or failing. Other valid families continue to work.

### 7. Permission changed

Revoked or reduced scopes stop new ingestion for affected resources. Existing
data follows the user's retention choice and applicable policy; the UI does not
claim the provider deleted it.

### 8. Disconnected

Tokens and future sync are disabled. The user receives explicit choices for
retaining or deleting previously imported data where applicable.

## Observation pipeline

### Ingest

Store the raw provider payload or an audit-safe representation before semantic
transformation, subject to data-minimization and licensing constraints.

### Normalize

Map the provider field to a canonical observation type while retaining:

- original name/value/unit;
- source/provider/device;
- record identity;
- timestamps and timezone context;
- provider status and quality flags;
- ingestion route.

### Validate

Reject or quarantine impossible schema states, not merely surprising human
values. A physiologically unusual value may need a warning or source review,
not silent deletion.

### Resolve

Apply the source-resolution policy to exact duplicates, revisions, overlaps and
competing sources. Resolution is metric-specific and auditable.

### Calculate

Run only metric specifications whose required inputs and evidence disposition
are satisfied. A calculation failure produces a reasoned unavailable state,
not a fallback guess.

### Present

Render value, unit, source/freshness/coverage context and safe interpretation
appropriate to the chosen size and page.

## Manual fallback matrix

Manual fallback is determined by whether a human can meaningfully observe or
report the input.

| Data family | Manual behavior |
|---|---|
| Weight, height, circumference | Direct manual observation allowed |
| Food, drink, caffeine, alcohol | Manual event logging allowed |
| Routine completion | Manual state is the primary record |
| RPE, mood, perceived stress, symptoms | Manual subjective record allowed and labeled |
| Session/activity | Manual session entry allowed with declared fields |
| Sleep timing/duration | Manual episode allowed and labeled; no fabricated stages |
| Steps | Manual total may be recorded but remains separate from overlapping device totals |
| HR, HRV, SpO2, BP | Only a user-entered reading from an actual measurement, with source/context where possible |
| Provider readiness/recovery/energy | No manual imitation of the provider score |
| ECG classification, cuffless BP, vascular age | No Body-generated manual substitute |
| Sleep stages | No manual pseudo-staging |

The matrix is not a boundary on future inputs. Everything can be represented
when its semantics and safety are defined; nothing may be misrepresented.

## Missing-state contract

### Not configured

Meaning: no eligible source/manual path has been selected.

Widget:

- explains what the umbrella answers;
- offers an appropriate connect or setup action;
- does not show sample values in the live grid.

### Awaiting data

Meaning: configured but no qualifying observation has arrived.

Widget:

- names the connected path;
- states what event/data is awaited;
- may show sync status, never a fake result.

### Partial coverage

Meaning: a result exists but the declared interval is incompletely observed or
logged.

Widget:

- may show the result;
- discloses partial coverage where it changes interpretation;
- does not extrapolate unless a metric specification explicitly defines and
  labels an estimate.

### Stale

Meaning: the last eligible result exceeds its metric freshness contract.

Widget:

- retains the last value only when useful;
- displays when it was last valid;
- does not style it as a current result.

### Unsupported by source

Meaning: the active provider/route cannot produce the required input.

Widget/drawer:

- explains the capability mismatch;
- may offer another eligible route or honest manual alternative;
- never suggests that repeated syncing will solve an unsupported capability.

### Permission lost

Meaning: the capability exists, but current authorization does not.

Widget:

- distinguishes permission from connection failure;
- routes to reauthorization;
- does not repeatedly trigger authorization without user action.

### Conflict

Meaning: multiple records/sources cannot be safely resolved.

Widget:

- avoids publishing a false canonical result;
- offers source review where user choice is legitimate;
- retains all records and the resolution audit.

### Provider delay/outage

Meaning: a normally functional route is temporarily failing or delayed.

Widget:

- preserves valid historical data;
- marks sync freshness;
- does not recast the state as the user's health changing.

### Valid zero

Meaning: an eligible covered observation explicitly produced zero.

Widget:

- displays zero;
- never replaces it with an empty state.

## Multi-source behavior

1. The canonical timeline may hold records from every authorized source.
2. A display series selects compatible records using explicit source policy.
3. Provider-specific scores remain separate series.
4. Source switching creates a visible provenance boundary when comparability is
   uncertain.
5. The user may choose a preferred source, but preference cannot turn
   incompatible semantics into equivalent data.
6. Removing one source triggers recalculation of affected Body-derived results
   and preserves an audit event.
7. A platform store and the original app/device are not double-counted merely
   because both appear in provenance.

## Widget behavior by state

Every widget umbrella implements the same state envelope while retaining
freedom inside its visual composition:

- `loading`: brief local transition, not a page-wide fake skeleton forever;
- `valid`: essential result and context;
- `partial`: result with honest coverage;
- `stale`: last result with time/source state;
- `empty`: setup or capture path;
- `unsupported`: capability explanation;
- `permission_lost`: reauthorization path;
- `conflict`: source-resolution path;
- `error`: recoverable technical state without losing known-valid history.

Hover content never contains the only explanation of a missing or safety-
critical state. Mobile receives an equivalent tap/focus path.

## Detail/history behavior

The detail surface exposes more than the compact widget:

- source and latest sync;
- coverage and quality;
- compatible historical series;
- source/protocol boundaries;
- contributing records for Body-derived metrics;
- algorithm/specification version;
- corrections and exclusions;
- interpretation and limitations;
- connection or manual-capture controls where relevant.

## Recalculation triggers

Derived values are invalidated/recomputed when:

- an input is inserted, updated, superseded or deleted;
- source preference/resolution changes;
- timezone/day assignment changes;
- a metric specification version changes;
- a provider changes semantic mapping;
- consent-driven deletion removes an input.

Past results retain the version that originally produced them or are explicitly
marked as recomputed. Silent historical rewriting is not allowed.

## Operational acceptance scenarios

The implementation must pass at least these cross-cutting scenarios:

1. Connect a provider, receive no data, then receive the first observation.
2. Import overlapping phone and watch step records.
3. Revoke one resource permission while others keep syncing.
4. Disconnect and retain history.
5. Disconnect and delete imported data.
6. Correct a manual intake record.
7. Receive a provider deletion/tombstone.
8. Switch timezone across a sleep episode and local-day aggregate.
9. Change preferred source with incompatible historical series.
10. Lose network/provider availability while showing last valid history.
11. Distinguish explicit zero from missing.
12. Recompute a derived metric after an input correction.
13. Render every missing state at 1x1 and on mobile without clipped meaning.

