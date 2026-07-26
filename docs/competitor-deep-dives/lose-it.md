# Lose It! competitor deep dive

Status: Tier A nutrition reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

This pass uses current Lose It! support pages and product listings. Older FAQ
mirrors and forum descriptions are not treated as authoritative calculations.

Primary official evidence:

- [Lose It! Support](https://loseit.zendesk.com/hc/en-us)
- [New Log Header](https://loseit.zendesk.com/hc/en-us/articles/47649133343380-Using-the-New-Log-Header-in-Lose-It)
- [Edit Calorie Budget](https://loseit.zendesk.com/hc/en-us/articles/47648748161172-How-to-Edit-Your-Calorie-Budget)
- [Goal and Streak Projection Dates](https://loseit.zendesk.com/hc/en-us/articles/51382148864532-Understanding-Goal-and-Streak-Projection-Dates)
- [Official product description](https://www.fitnowinc.com/about/)

## Product architecture

The Log is organized around a daily calorie budget, food records and exercise.
Its configurable header can expose calorie budget, macros and nutrient goals.
The primary accounting relationship presents Food, Calories/Budget and
Exercise together.

Capture options include:

- database search and recent foods;
- barcode scanning;
- recipes and meal planning;
- photo meal recognition;
- voice logging;
- custom foods and meals.

The wider product includes weight progress, nutrient goals, fasting, connected
activity and additional health measurements.

## Calculations and semantics

The calorie budget derives from profile, activity and weight-goal settings and
can be manually edited or scheduled across a week. Exact current coefficients
must not be inferred from the UI.

The current projection feature does not simply assume perfect future
adherence. It uses the average calorie deficit over the current logging streak
to estimate a goal date. The projection therefore depends on:

- the selected goal;
- the active calorie budget;
- logged intake;
- exercise/adjustment behavior;
- streak completeness;
- observed weight/progress context.

Patterns and food insights are associative product outputs. Their precise
statistical thresholds are not fully disclosed and cannot be copied as a Body
calculation.

## Visual and interaction grammar

- Prominent daily budget remaining/over state.
- Food, budget and exercise as a compact accounting header.
- Customizable macro and nutrient progress.
- Meal-grouped daily log.
- Weight/projection progress over time.
- Pattern cards derived from repeated logging behavior.
- Capture actions optimized for repeated meals.

## Product lessons, not widget decisions

Useful evidence for Body:

- the daily budget model is understandable but can hide uncertainty in energy
  expenditure;
- configurable header emphasis is valuable;
- projections must state their behavioral assumptions;
- pattern outputs need minimum sample size, effect definition and uncertainty;
- photo/voice recognition requires user confirmation and provenance.

Body must not present a calorie deficit, exercise credit or predicted goal date
as precise without validated input coverage.

## Remaining evidence tasks

- Verify the current base budget formula from first-party technical material.
- Capture free/Premium screens and all header configurations.
- Reconstruct Patterns eligibility, statistics and deletion/recalculation.
- Audit wearable adjustment and exercise double-counting behavior.

