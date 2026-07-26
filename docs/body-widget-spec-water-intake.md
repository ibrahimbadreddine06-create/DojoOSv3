# Widget umbrella specification — Water Intake

Status: definitive information contract, variants pending  
Umbrella ID: `nutrition.water_intake`

## Operational contract

Quick-add and correction are integral actions. They create or edit explicit
intake events with time, amount and manual provenance; tapping progress alone
never implies consumption.

Question: **How much water or deliberately selected total fluid was logged?**

Essential `1×1`: logged volume, period, scope and optional personal target.

Aggregate intake events in canonical volume while preserving beverage and
source. Plain water and total fluid are distinct selectable scopes.

Variants: fill/progress, event pattern, total-first. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Logged intake is not hydration status. Detail exposes events, scope, target,
corrections and history.
