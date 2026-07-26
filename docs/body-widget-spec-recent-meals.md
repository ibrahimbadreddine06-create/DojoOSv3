# Widget umbrella specification — Recent Meals

Status: definitive information contract, variants pending  
Umbrella ID: `nutrition.recent_meals`

## Operational contract

Reuse creates a new draft or planned/consumed entry only after the user chooses
the destination state. It never silently duplicates a past meal as consumed.

Question: **What did I recently log as meals/snacks, and what needs correction
or reuse?**

Essential `1×1`: latest meal with time, concise contents/summary, provenance
and detail action.

Data uses resolved meal events with components, image where available,
estimation confidence and completeness.

Variants: latest-meal focus, chronological list, visual journal. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Detail supports edit, reuse, entry provenance and nutrition breakdown. AI/photo
results remain editable estimates.
