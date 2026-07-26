# Activity functional vertical slice

Status: implementation-ready product contract; schema migration still required  
Updated: 2026-07-25

## Scope

Activity is the first complete proof of the Body operational architecture. It
must prove that a person can plan or spontaneously start an activity, execute
it, combine manual and wearable evidence, reconcile it with the plan, and
inspect complete history without duplicate truth.

This slice covers all activity types. Workout is the deeper specialised path
because it contains exercises and sets.

## Canonical entities

### Activity definition

Describes what kind of activity can be performed. The catalogue is extensible.
A private user-created activity behaves like a curated activity without being
published globally.

Minimum contract:

- stable ID, owner and provenance;
- display name and aliases;
- category/type;
- compatible fields/streams;
- optional instructions/media;
- archived state.

The catalogue must not be an enum limited to run, walk, cycle and swim.

### Workout definition

A reusable composition of ordered exercise prescriptions. It may be created
from a preset, built ad hoc or copied from history.

### Exercise definition

Minimum contract:

- stable ID, owner/provenance and aliases;
- instructions and media;
- equipment/modality;
- primary muscle relationships;
- secondary muscle relationships;
- supported logging fields;
- archived state.

### Activity commitment

The intent to perform an activity or workout. It may be timed, day-bound,
recurring or created immediately before execution.

### Activity execution

The actual session. It owns real start/end, lifecycle, notes and links to
manual/device/provider evidence.

### Workout execution

Activity execution with ordered exercise executions and set records. Planned
reps/load/rest and actual reps/load/RPE/time remain distinct.

## Functional umbrellas

### Activities

Stable question: **Which activity do I want to plan, start or continue?**

#### `1×1`

- current/next activity when relevant;
- exact state;
- one primary action;
- purposeful empty state to choose/start.

#### Larger sizes

- `1×2`: vertical queue or richer active-session context;
- `2×1`: today queue plus start/continue action;
- `2×2`: queue, current execution and concise reconciliation state.

It never becomes an all-purpose planner or historical metric dashboard.

### Workout

Stable question: **What workout is relevant now, and can I build, plan, start
or continue it?**

#### `1×1`

- workout identity;
- planned/current state;
- one primary action;
- honest empty state.

#### Larger sizes

- exercise outline;
- completed/remaining set progress;
- session/rest timer where active;
- concise changes from plan;
- next exercise/action.

The active workout widget and full-screen execution use the same execution
record.

## Supporting destinations

These are mandatory even if they are not independently approved widgets.

### Activity catalogue

Search/browse curated and private activities, inspect compatible tracking,
create a private activity, plan or start.

### Workout builder

Create/edit a reusable workout or an ad-hoc session; select exercises, order,
prescriptions and optional notes.

### Active activity

Minimal execution controls appropriate to the activity type. Wearable streams
may arrive asynchronously.

### Active workout

Exercise/set execution, timers, rest, substitutions, skipped/added work,
notes and completion. It must preserve every deviation from the plan.

### Activity detail/history

One resolved session with:

- plan and actual comparison;
- source/provenance;
- compatible streams and summaries;
- edits and reconciliation;
- related goals;
- route to selected exercise/muscle details.

### Exercise detail/history

All executions from the first retained entry, searchable by period and workout.
It exposes actual sets/reps/load/RPE and only defensible derived trends.

### Muscle detail/history

All exercise executions affecting the selected muscle, distinguishing primary
and secondary relationships. It does not claim recovery from elapsed time and
volume alone unless a validated, versioned model exists.

## Main flows

### Planned activity

1. User chooses an activity.
2. User schedules a timed/day-bound commitment or starts now.
3. Planner and Activity show the same commitment.
4. Start creates one execution linked to it.
5. Device/manual evidence attaches to that execution.
6. Completion reconciles intent and reality.

### Spontaneous activity

1. User chooses/start now without a prior commitment.
2. One execution is created.
3. It remains explicitly spontaneous.
4. The user may optionally attach it to a compatible past commitment.

### Wearable-detected activity

1. Provider data creates source assertions/session candidate.
2. Deduplication resolves compatible assertions.
3. Matching suggests a commitment with confidence/reason.
4. User confirms uncertain reconciliation.
5. No match leaves a valid unplanned execution.

### Planned workout changed during execution

1. Start from the planned workout.
2. User substitutes, adds, skips or edits exercises/sets.
3. Actual execution records the changes.
4. Reusable workout definition changes only through an explicit separate
   choice.
5. Completion compares plan with actual; it does not rewrite history.

## Goal behavior

A goal may target an activity subject or a typed criterion. Examples are not a
closed product list.

Progress is generated from immutable execution/observation evidence. Deleting
or correcting evidence reverses/recalculates contribution. Completing a
planner block alone cannot advance a physiological/performance target unless
the goal explicitly defines planner completion as its criterion.

## Current-code reuse

Useful:

- workout/exercise/set tables as migration sources;
- workout presets;
- active workout session interaction concepts;
- exercise library and media fields;
- current activity log UI/history concepts.

Must change:

- `activityType` free text plus short hard-coded comment is not a catalogue;
- `completed: boolean` is not an execution lifecycle;
- non-workout activities need commitment/execution links;
- workout `linkedBlockId` is too narrow;
- exercise progress endpoint lacks a complete user-scoped contract;
- muscle stats are mutable summaries with an unvalidated recovery formula;
- several exercise/workout routes need consistent authentication and ownership;
- active workout styling/logic must be migrated into the E design language,
  not copied unchanged.

## Acceptance tests

1. A custom activity can be created privately, planned and executed.
2. A planned activity appears identically from Planner and Activity.
3. Starting it creates one execution, not duplicate logs.
4. Vertical movement through the app never changes commitment identity.
5. A spontaneous execution remains valid without a plan.
6. A wearable session can be reconciled without losing provider provenance.
7. Workout deviations preserve both planned and actual values.
8. Exercise history returns every owned execution in order.
9. Muscle history includes primary and secondary contributions distinctly.
10. Correcting/deleting an execution recalculates linked goal progress.
11. Empty storage returns an empty state, never sample sessions.
12. Every supported widget size preserves its essential operation and E design
    language.
