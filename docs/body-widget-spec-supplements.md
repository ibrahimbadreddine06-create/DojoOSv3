# Widget umbrella specification — Supplements

Status: action/log contract, variants pending  
Umbrella ID: `nutrition.supplements`

## Operational contract

Definitions, schedules, dated occurrences and taken/skipped executions are
separate records. Planner commitments and day-bound occurrences may present
the same due action, but one check-in updates one canonical occurrence.

Question: **Which configured supplements are due or recorded as taken?**

Essential `1×1`: next/current scheduled item, dose/unit, state and action.

Data includes product/ingredient, schedule, dose, taken/skipped state and
source. Ingredient identity and units must be normalized carefully.

Variants: due-now action, today's set, consistency history. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Tracking is not efficacy/safety/dosage advice. Medication remains a separate
clinical contract. Detail exposes schedule, history and corrections.
