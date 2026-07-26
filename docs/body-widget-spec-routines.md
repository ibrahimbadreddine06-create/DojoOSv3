# Widget umbrella specification — Routines

Status: definitive action contract  
Umbrella ID: `hygiene.routines`

## Operational contract

The canonical model separates routine definition, recurrence, dated occurrence
and execution. Each step has a stable identity so edits do not corrupt history.
Create/edit uses an authoritative workflow; user-defined routines are not
limited by supplied templates.

Question: **Which configured hygiene/looks steps are due today, and what is
their completion state?**

Essential `1×1`: current/next routine, progress/state and action. Routine names,
steps and schedules are user-defined; templates never define the limit.

Variants: next routine, today's checklist, timeline. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`. Completion updates the canonical routine record
and reconciles with linked planner blocks.
