# Widget umbrella specification — Sleep Schedule

Status: definitive information contract  
Umbrella ID: `rest.sleep_schedule`

## Operational contract

When the user configures a sleep window, plan/adjust actions are integral. The
plan is a commitment shared with Planner; observed sleep is linked later
through explicit reconciliation.

Question: **When am I sleeping and how consistent are sleep/wake times?**

Essential `1×1`: recent timing/consistency result, period and valid-night
coverage. Calculate with local time while retaining timezone/travel events.

Variants: midpoint/timing, bedtime-wake field, consistency trend. Initial
sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Shift work and travel prevent simplistic “late is bad” judgments. Detail shows
night boundaries, timezone context, method and history.
