# Widget umbrella specification — Macronutrients

Status: definitive information contract, variants pending  
Umbrella ID: `nutrition.macronutrients`

Question: **What protein, carbohydrate and fat compose the logged intake?**

Essential `1×1`: logged macro quantities/composition, period and completeness.

Aggregate resolved nutrient values without converting missing database fields
to zero. Gram and energy-percentage views share canonical quantities but use
explicit calculations.

Variants may emphasize composition, targets or a chosen macro while remaining
the Macronutrients widget. Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Detail exposes meals/foods contributing to each value, database confidence,
targets, corrections and history.

