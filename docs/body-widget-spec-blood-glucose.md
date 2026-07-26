# Widget umbrella specification — Blood Glucose

Status: conditional sensitive observation contract  
Umbrella ID: `hub.blood_glucose`

Question: **What glucose values did the eligible source record across the
selected period?**

Essential `1×1`: current/latest value or range, unit, source and freshness.

Normalize units while preserving originals; retain CGM/manual/lab context.
Meal/activity links are temporal associations, not causation.

Variants: current/trend, day trace, range distribution. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`. Clinical interpretation requires a separately
approved path.

