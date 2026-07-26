# Body functional widget architecture

Status: design brief / architecture baseline  
Updated: 2026-07-25  
Scope: Body Hub, Activity, Nutrition, Rest & Recovery, Hygiene & Looks

## Outcome

Body is not a dashboard with logging buttons attached. It is the operational
surface for the user's body-related plans, actions, records and results.

The existing research-selected informational widgets remain valid unless a
case-by-case review finds a concrete defect. This document adds the missing
functional layer. It does not replace the metric research.

The product must support this continuous loop:

`intend → plan → start → execute → record → reconcile → understand → adjust`

The Daily Planner, Goals, Body widgets and detail/history pages are different
views and controls over the same canonical truth. They are not parallel
systems.

## Vocabulary

### Widget umbrella

The actual independently installable widget. It owns variants and sizes. It is
never a research category, database table, raw metric or “group of widgets.”

### Informational widget

Primarily answers a question by presenting measurements, calculations,
history, status or context.

### Functional widget

Primarily lets the user perform a durable operation: plan, choose, start,
continue, complete, change, record or inspect. It is still an ordinary widget
umbrella.

### Product entity

A canonical thing the product knows about, such as an activity, workout,
exercise, muscle, meal, routine, goal or planner block. An entity is not
automatically a widget.

### Commitment

The user's intent to do something. A commitment may be:

- time-bound: scheduled from 18:00 to 19:00;
- day-bound: due today without an exact time;
- recurrence-bound: generated from a routine or programme;
- unscheduled: selected now without prior planning.

This list describes current semantics, not a closed set. **ALLES KAN.**

### Execution

What the user actually starts and does. It has its own lifecycle and actual
times. It may originate from a commitment or be spontaneous.

### Observation

What was manually entered, measured by a device, imported from a provider or
derived by Body. An observation is evidence about reality, not proof that a
plan was completed.

### Reconciliation

The explicit relationship between intent and reality. Completion, lateness,
replacement, partial execution, skipping and spontaneous execution must not
silently overwrite one another.

## Canonical operational model

Every operational flow must be representable through linked records:

1. `Subject`: the activity, workout, meal, routine, rest action or other thing.
2. `Commitment`: when/if the user intends to do it.
3. `Execution`: the actual performance lifecycle.
4. `Observation`: manual/provider/device evidence produced around it.
5. `Goal link`: the optional target or outcome it contributes to.
6. `Provenance`: who or what created and changed every record.

The link is typed and durable. A string such as `linkedModule = "activity"` is
not sufficient as the long-term domain model.

### Required lifecycle states

The model must distinguish at least:

- planned;
- available/due;
- in progress;
- paused where the activity permits it;
- completed;
- partially completed;
- skipped;
- cancelled;
- replaced/rescheduled;
- reconciled after an unplanned execution.

Not every subject uses every state. Unsupported states are absent rather than
faked.

## Planner relationship

Body does not embed a duplicate Daily Planner.

Each Body submodule exposes a page-tailored operational view of relevant
commitments and executions. A change made there updates the same canonical
record visible in the Daily Planner. A planner change is immediately reflected
inside Body.

The current `TodaySessions` component demonstrates the basic link but is not
the final contract. It only lists, completes and deletes exact-date blocks.
The production layer must additionally support domain execution, creation,
rescheduling, reconciliation, recurrence and day-bound work where relevant.

The future Planner may provide multiple lenses—time blocks, body intake,
activity/output, energy/circadian context or untimed commitments—without
creating duplicate records. A lens is a view, never another truth.

## Goals relationship

Goals are optional, typed links—not labels placed on arbitrary records.

A Body goal can define a target, applicable period, unit/criterion and the
canonical events that advance it. Progress is derived from those events.
Body widgets may show or operate on a linked goal, but they must not invent
progress from an unrelated completion flag.

The current `associatedModules: string[]` and subgoal-count percentage are too
coarse for production Body goals. They are implementation debt, not the
product contract.

## Functional widget decision test

Before creating a functional umbrella, answer in order:

1. Is this a durable operation users may independently add/remove from a page?
2. Does it have one stable user-facing identity rather than grouping other
   widgets?
3. Is the operation useful at `1×1`?
4. Does it act on canonical records shared with Planner, Goals and history?
5. Is it materially different from an action inside an existing umbrella?

If the fifth answer is no, keep the action inside the existing umbrella.
Drawers, builders, selectors and detail screens are destinations, not widgets
unless they independently pass this test.

## Shared interaction contract

Functional widgets may expose the smallest useful next action at `1×1`.
Larger sizes may reveal more choices, steps or context. They must never require
a large size for the basic operation.

Every action needs:

- a clear target;
- current state;
- reversible confirmation where appropriate;
- an honest pending/error/offline state;
- conflict handling;
- keyboard and touch operation;
- a route to full detail/history;
- short local explanations only when the compact meaning is unclear.

Starting an action from a widget opens or transitions into the authoritative
execution surface. The widget does not simulate completion with decorative
state.

## Submodule functional map

This map defines product responsibilities. Names marked “candidate” require a
final umbrella gate; the capability itself is required.

### Hub

The Hub is a cross-domain overview, not a second planner.

- `Today` may combine relevant next actions and current signals, but every item
  routes to its owning Body subject.
- `Body Timeline` composes past, current and expected Body events without
  becoming their source of truth.
- A compact capture action may be justified as its own umbrella only if it
  remains context-sensitive and independently useful. It must not recreate the
  removed page-level “Log …” buttons.

### Activity

Activity covers all bodily output, not only formal exercise.

Required entities:

- extensible activity catalogue, including user-created activity types;
- workouts as a special activity composed of exercises;
- extensible exercise library with instructions/media;
- target and secondary muscle relationships;
- planned and spontaneous sessions;
- execution streams, manual entries and wearable observations;
- full activity, workout, exercise and muscle history.

Required functional responsibilities:

- choose, plan or start an activity;
- build, plan, start and continue a workout;
- execute exercises and sets;
- inspect an exercise and its complete history;
- inspect a muscle and every relevant primary/secondary contribution;
- reconcile a completed wearable session with a plan;
- create custom activities/exercises without publishing them globally.

The former `Next Workout` is evolved into the stable `Workout` umbrella because
the durable product identity is the workout lifecycle, not only whichever
record is next. `Activities` covers non-workout activity selection/planning/
execution. Whether `Exercises` and `Muscles` earn independent widgets remains a
case-by-case product gate; their complete detail/history destinations are
required regardless.

### Nutrition

Nutrition covers everything entering the body. Wearable data alone cannot
provide the core record, so manual capture is a first-class alternative.

Required entities:

- planned intake;
- consumed intake;
- meals, foods, drinks and reusable presets;
- nutrients with provenance and coverage;
- supplements and other configured intake routines;
- fasting sessions;
- attachments and future assisted capture.

Required functional responsibilities:

- plan an intake without falsely marking it consumed;
- record, edit, reuse or remove consumed intake;
- reconcile a planned item with what was actually consumed;
- complete due intake routines;
- start/end a fasting session;
- preserve incomplete/unknown nutrition rather than converting it to zero.

Candidate umbrellas are `Log Intake` and `Meal Plan`. Existing `Supplements`
and `Fasting` may remain hybrid informational/functional umbrellas. Search,
barcode, description and future photo assistance are capture methods within an
umbrella, not automatically separate umbrellas.

### Rest & Recovery

Rest covers sleep, naps and other restoration—not only sleep metrics.

Required entities:

- sleep/rest commitments;
- sleep/rest executions or imported sessions;
- subjective check-ins;
- wearable observations;
- restorative activities/routines where configured.

Required functional responsibilities:

- plan or adjust a sleep/rest window;
- record a manual sleep, nap or rest session;
- start/complete a supported restorative action;
- reconcile a planned window with observed sleep without overwriting either;
- distinguish provider recovery output from user action.

Candidate umbrella: `Rest Plan`. A separate `Rest Session` is justified only
if starting/continuing restoration is independently valuable across more than
one specific informational umbrella.

### Hygiene & Looks

This submodule is intentionally user-extensible. The product supplies useful
templates but does not define the limit of what a person can track.

`Routines` is the core functional umbrella. It owns due routines, their steps,
completion and Planner reconciliation. Routine creation/editing can be a
drawer/detail workflow rather than a separate widget.

The existing `Custom Tracker` is not accepted merely as a generic escape hatch.
User-defined routines belong to `Routines`; user-defined observations may be
represented by the relevant observation widget or an extensible record. A
separate umbrella must have a stable purpose beyond “anything custom.”

Required functional responsibilities:

- create or adapt a private routine;
- schedule it as timed, day-bound or recurring;
- execute/check off its steps;
- record user-defined observations with an honest type/unit/state;
- link relevant routines to optional goals;
- support sex/profile-dependent eligibility without manufacturing medical
  interpretation.

## Detail and history contract

Every informational and functional umbrella has an authoritative detail page.
History is one section of that page, not necessarily the entire page.

Every activity, workout, exercise, muscle, intake, routine and rest session
that can be selected independently also needs a suitable detail/history
destination. The destination shows all retained records from the first
available entry, provenance, edits/deletions, related plan and goal links, and
the meaning/limitations of derived values.

The widget click opens detail. A local primary action may start or continue an
execution without forcing a detour through detail.

## Empty and unavailable states

Empty state is product state, not demo content.

Never return fabricated sessions, routines, meals or metrics because storage is
empty. The correct result is one of:

- truly empty with a useful action;
- permission required;
- provider unsupported;
- sync pending/stale;
- not configured;
- not eligible;
- insufficient data;
- error/offline.

Demo fixtures belong in an explicit demo/seed environment and carry visible
provenance.

## Current implementation audit

The current code already contains useful prototypes:

- planner time blocks and presets;
- linked module/item/sub-item fields;
- workout, exercise, set and preset records;
- active workout execution UI;
- intake logs, meal presets and intake routines;
- sleep logs;
- hygiene routines;
- activity logs;
- Body profile and daily state.

Material gaps:

- links are mostly loose strings rather than typed canonical relations;
- commitments and executions are conflated;
- non-workout activity logs lack planner linkage and lifecycle;
- hygiene routines mix template, occurrence and completion in one dated row;
- sleep plan and observed sleep are not cleanly separated;
- Goals cannot express typed Body targets or event-derived progress;
- exercise/muscle history is incomplete and muscle recovery uses an unvalidated
  calculation;
- API routes fabricate Body time blocks and supplement routines when empty;
- several AI routes return fake encouraging copy instead of a typed empty/error
  state.

These gaps must be resolved before the functional layer is called
production-ready.

## Delivery sequence

1. Freeze this vocabulary and operational model.
2. Audit all 53 selected umbrellas as informational, functional or hybrid.
3. Gate each candidate functional umbrella case by case.
4. Remove/reframe redundant umbrellas such as `Custom Tracker`.
5. Extend the canonical schema for typed subject, commitment, execution,
   observation and goal links.
6. Remove fake API fallbacks and create explicit seed/demo data.
7. Specify variants, sizes, states and detail destinations per approved
   functional umbrella under the E design language.
8. Implement one complete vertical slice—Activity—before copying patterns.
9. Apply the proven pattern to Nutrition, Rest & Recovery, Hygiene & Looks and
   finally Hub composition.

## Non-negotiable design principle

**ALLES KAN.**

That freedom applies to the records, operations, visual compositions and
element slots. It does not permit fake data, duplicate truth, unexplained
calculations or operations that only look functional.
