# Widget umbrella specification — Calories

Status: definitive information contract, variants pending  
Umbrella ID: `nutrition.calories`

Question: **How much dietary energy is logged for this period relative to the
explicit target, and how complete is the log?**

Essential `1×1`: logged kcal/kJ, period, coverage/completeness and target only
when eligible.

Sum resolved intake entries; preserve database, serving, estimate and manual
provenance. Unknown or unlogged intake is not zero. Target logic is versioned
separately from intake aggregation.

Variants may focus on total/remaining, meal distribution or period trend.
Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Never present exact energy balance, exact expenditure equivalence or a complete
diet when logging is partial. Detail exposes entries, corrections, target
method, coverage and history.

