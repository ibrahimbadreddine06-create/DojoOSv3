# Body operational data model

Status: proposed canonical contract  
Updated: 2026-07-25  
Purpose: connect Body, Daily Planner, Goals, execution, manual input and
wearable observations without duplicate truth

## Why the current model cannot ship

The current database has useful domain tables, but its operational semantics
are fragmented:

- a time block has three loose linking strings;
- a workout has an optional block ID and a completion boolean;
- a non-workout activity has no planner link or execution lifecycle;
- a consumed intake may link to a block, but planned intake is not a distinct
  canonical entity;
- a hygiene “routine” is simultaneously a definition, dated occurrence and
  completion flag;
- a sleep log mixes planned hours and actual sleep;
- a goal links only to broad module names and derives progress from subgoal
  completion;
- provider observations and user actions do not share a typed reconciliation
  model.

Adding more foreign keys to every table would reproduce the same problem. The
missing concept is a shared operational spine.

## Shared spine

### `body_subjects`

A stable reference to the thing an operation concerns.

| Field | Purpose |
|---|---|
| `id` | immutable Body subject ID |
| `user_id` | owner; nullable only for curated public catalogue entries |
| `subject_type` | open, versioned type such as activity, workout, exercise, meal, intake routine, hygiene routine or restorative action |
| `entity_id` | ID in the authoritative domain table |
| `title_snapshot` | display fallback only; not the authoritative name |
| `privacy_class` | highest applicable privacy class |
| `created_at`, `archived_at` | lifecycle |

This is a typed reference layer, not an umbrella or grouping system.

### `body_commitments`

Represents intent.

| Field | Purpose |
|---|---|
| `id`, `user_id`, `subject_id` | identity |
| `schedule_kind` | timed, day-bound, recurrence occurrence, unscheduled or future extension |
| `civil_date` | relevant local day |
| `planned_start_at`, `planned_end_at` | nullable unless timed |
| `timezone` | IANA timezone used for intent |
| `recurrence_rule_id` | optional source recurrence |
| `planner_block_id` | optional presentation link to the canonical Planner block |
| `status` | planned, due, skipped, cancelled, replaced, completed/reconciled |
| `source` | Body, Planner, preset, programme, import or future extension |
| `created_at`, `updated_at` | audit |

A planner block can present a commitment. It is not the commitment's only
possible form because day-bound and untimed Body work must also exist.

### `body_executions`

Represents reality as an action lifecycle.

| Field | Purpose |
|---|---|
| `id`, `user_id`, `subject_id` | identity |
| `commitment_id` | nullable for spontaneous executions |
| `status` | ready, in-progress, paused, completed, partial, abandoned or supported extension |
| `actual_start_at`, `actual_end_at` | actual timing |
| `timezone` | execution timezone |
| `manual_state` | whether/which parts came from direct user action |
| `created_at`, `updated_at` | audit |

Domain-specific details stay in their authoritative tables: workout sets,
intake quantities, routine steps, sleep episodes and so on.

### `body_reconciliations`

Relates a commitment to an execution when the match is not a trivial direct
creation.

| Field | Purpose |
|---|---|
| `commitment_id`, `execution_id` | relationship |
| `resolution` | fulfilled, partial, replaced, unrelated, duplicate candidate or extension |
| `confidence` | system match confidence where applicable |
| `confirmed_by_user` | whether the user accepted the match |
| `reason` | short machine-readable reason |
| `created_at` | audit |

This prevents a detected workout from silently completing the wrong plan.

### `body_goal_links`

Typed relationship between a goal and the thing or evidence that advances it.

| Field | Purpose |
|---|---|
| `goal_id` | canonical goal |
| `subject_id` | optional targeted subject |
| `canonical_type` | optional targeted observation/derivation type |
| `criterion_version` | versioned progress rule |
| `target` / `unit` | target semantics |
| `valid_from`, `valid_to` | goal period |
| `created_at` | audit |

### `body_goal_events`

Immutable evidence used to calculate goal progress.

| Field | Purpose |
|---|---|
| `goal_link_id` | progress contract |
| `execution_id` / `record_id` | exact evidence |
| `contribution` | versioned contribution |
| `occurred_at` | event time |
| `reversed_at` | non-destructive correction |

Progress is recalculated from events. It is not maintained as an unexplained
percentage.

## Domain corrections

### Activity catalogue and execution

Add an extensible activity definition table. Curated activities and private
user-created activities use the same semantic interface but different
ownership/provenance.

Workout becomes a subtype of activity execution and retains its exercises and
sets. Non-workout sessions gain the same commitment/execution spine. Imported
sessions link through observations and reconciliation.

Exercise definitions retain:

- instructions/media;
- modality/equipment;
- primary muscles;
- secondary muscles with explicit contribution semantics where known;
- aliases/provenance;
- user-created ownership.

Muscle history is derived from exact exercise executions and relationships. It
is not a mutable `recoveryScore` row pretending to be source truth.

### Nutrition

Create planned-intake records distinct from consumed intake records. A plan can
reference a meal preset or an open description without claiming exact
nutrients. Consumption may differ and is reconciled explicitly.

An intake entry needs ingredient/food provenance, serving assumptions,
completeness and capture method. Unknown nutrient values stay unknown.

Intake-routine definitions and dated occurrences/check-ins must be separate.

### Rest & Recovery

Separate:

- planned sleep/rest commitment;
- actual manually recorded or provider-observed session;
- subjective check-in;
- provider insight;
- Body derivation.

`plannedHours` must not live inside the same record as an observed sleep
episode without a typed link.

### Hygiene & Looks

Separate routine definition, recurrence, generated occurrence and execution.
Routine steps require stable IDs so history survives renaming/reordering.

User-defined observations use typed extensible records. They do not require a
generic `Custom Tracker` widget or fabricated interpretation.

## Planner API contract

Replace query semantics based only on
`date + linkedModule + linkedItemId + linkedSubItemId` with a typed endpoint
that can return:

- timed commitments;
- day-bound commitments;
- active executions;
- recently completed executions requiring reconciliation;
- source subject and valid actions.

The API response must identify whether an item is a planner presentation, a
Body commitment, an execution or an observation. The UI must never infer that
from a title.

## Migration strategy

1. Add the shared spine without deleting current tables.
2. Backfill Body subjects for existing workouts, activities, intake routines,
   hygiene routines and relevant presets.
3. Backfill commitments from valid linked time blocks.
4. Backfill executions from completed workouts/activity logs/intake logs,
   routine check-ins and sleep logs with honest provenance.
5. Record uncertain matches as reconciliation candidates; never auto-merge.
6. Dual-write new flows temporarily.
7. Compare counts and histories per user/date/entity.
8. Switch readers to the canonical contract.
9. Retire legacy loose links only after verified parity and rollback coverage.

## Immediate blockers

The following current behavior must be removed before production:

- `/api/time-blocks/linked` fabricates Body sessions when none exist;
- `/api/time-blocks/:date` fabricates generic day blocks;
- `/api/goals` fabricates goals;
- `/api/intake-routines` fabricates supplement routines;
- AI endpoints turn missing keys/errors into plausible product advice/copy.

They should return typed empty/error/demo states. Demo data must be explicitly
seeded and visibly marked.

## Invariants

1. A plan is not proof of execution.
2. A completion tap is not a sensor measurement.
3. A provider observation is not automatically the user's intended activity.
4. A manual record is valid data with manual provenance, not a lesser fake
   sensor record.
5. One real-world action may have multiple source assertions but one resolved
   canonical execution.
6. No source record is silently destroyed during deduplication or
   reconciliation.
7. Every derived value is versioned and traceable to exact inputs.
8. Everything may be extended—**ALLES KAN**—without collapsing unknown meaning
   into an existing type.
