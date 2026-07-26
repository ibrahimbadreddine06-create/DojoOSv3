# Widget umbrella specification — Fasting

Status: optional action/observation contract  
Umbrella ID: `nutrition.fasting`

## Operational contract

A schedule is a commitment; the timer is an execution. Starting late, ending
early or correcting an interval reconciles both without rewriting the plan.

Question: **What is the state of my user-declared fasting interval?**

Essential `1×1`: elapsed/completed duration, declared plan and start/stop
action/state.

Data uses explicit start/end events and timezone. Missed taps/corrections remain
editable and visible in provenance.

Variants: active timer, schedule, completed-history pattern. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Elapsed time alone cannot claim ketosis, autophagy or another metabolic state.
Detail exposes intervals, plan, edits and history.
