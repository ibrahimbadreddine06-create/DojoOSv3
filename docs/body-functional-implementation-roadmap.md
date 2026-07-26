# Body functional implementation roadmap

Status: ordered delivery plan  
Updated: 2026-07-25

## Gate 0 — preserve current work

- keep the E design language and existing archive;
- keep all validated informational research/specifications;
- migrate IDs with aliases rather than deleting user layouts;
- use feature flags and reversible schema migrations.

## Gate 1 — remove false truth

1. Move sample data to explicit seed/demo fixtures.
2. Remove fabricated time blocks, goals and intake routines from production
   API empty states.
3. Replace AI fallback prose with typed unavailable/error/empty responses.
4. Add tests proving empty storage stays empty.

## Gate 2 — shared operational spine

1. Add Body subject, commitment, execution, reconciliation, goal-link and
   goal-event schemas.
2. Add ownership, provenance and lifecycle indexes/constraints.
3. Backfill existing records without destructive merging.
4. Add dual-read comparison tooling.

## Gate 3 — Activity vertical slice

1. Extensible activity catalogue.
2. Activity planning/starting/execution.
3. Workout definition and execution migration.
4. Exercise and muscle history.
5. Planner and Goal reconciliation.
6. `Activities` and `Workout` widgets, variants and supported sizes.
7. Detail/history pages.
8. End-to-end, mobile and accessibility tests.

Activity is the proving ground. No bulk copying to other submodules before its
invariants pass.

## Gate 4 — Nutrition

1. Separate planned and consumed intake.
2. Rebuild intake capture provenance and drafts.
3. Dated intake-routine occurrences.
4. `Log Intake` and `Meal Plan`.
5. Upgrade existing hybrid widgets.
6. Detail/history and plan-versus-actual flows.

## Gate 5 — Rest & Recovery

1. Separate planned rest from observed/manual sessions.
2. Reconcile sleep windows and observations with timezone correctness.
3. Upgrade Last Sleep, Sleep Schedule, Perceived Stress and Naps.
4. Resolve the `Rest Plan` gate from demonstrated product need.

## Gate 6 — Hygiene & Looks

1. Separate routine definitions, steps, recurrence, occurrences and execution.
2. Add typed extensible observations and product-use records.
3. Upgrade Routines and existing hybrid widgets.
4. Migrate/remove `Custom Tracker` without losing user-authored data.

## Gate 7 — Hub composition

Only after source submodules work:

- compose Today and Body Timeline from canonical commitments/executions/events;
- expose source-owned actions;
- never create Hub-only duplicates.

## Gate 8 — cross-product adoption

Use the proven operational spine to modernise Planner, Goals and other DojoOS
modules. Body is the reference implementation, not a private fork.

## Definition of done

A gate is complete only when:

- no fake data can appear as user data;
- Planner, Body and Goals reference one truth;
- plan and execution remain distinct;
- manual and provider provenance survive;
- history starts at the first retained record;
- every approved widget size is intentional and E-compliant;
- responsive, touch, keyboard, empty, offline, conflict and error states pass;
- migrations are reversible and preserve existing user layouts/data.
