# Widget umbrella specification — Perceived Stress

Status: optional manual-observation contract  
Umbrella ID: `rest.perceived_stress`

## Operational contract

The check-in action is integral. It records scale version, value, time and
context; the UI never converts a missing check-in into a low score.

Question: **How have I rated my perceived stress under a stable scale?**

Essential `1×1`: latest/period result, scale and logging recency.

Variants: check-in/result, trend, distribution. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Scale/version remains stable and editable with provenance. Associations with
sleep/activity are exploratory, not causal.
