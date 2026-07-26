# Strong competitor deep dive

Status: Tier A activity reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [What is Strong?](https://help.strongapp.io/article/228-what-is-strong)
- [Exercise Detail](https://help.strongapp.io/article/237-about-exercise-detail)

## Product architecture

Strong is deliberately execution-first and flexible. It records complete
strength-workout history without prescribing one training philosophy. Its
relevant surfaces are workout logging, routines, exercise detail, body
measurements, charts and integrations.

Exercise Detail separates:

- About: instructions and media;
- History: every session containing the exercise;
- Charts: exercise-type-specific progress charts;
- Records: all-time records, rep-specific bests and projected best lifts;
- Edit: custom naming and data transfer/repair.

## Visual and interaction grammar

- Compact set/repetition/load rows.
- Inline rest timer and prior-performance context.
- Exercise-specific line/bar history.
- Personal-record lists by repetition range.
- Body-measurement trends.
- Simple hierarchy that prioritizes logging speed over coaching decoration.

## Product lessons, not widget decisions

- A neutral logger can be valuable without opaque recommendations.
- Exercise identity and history repair are foundational.
- Projected best lift requires a disclosed formula and confidence framing.
- Chart availability should follow exercise semantics.
- Export and ownership are part of a trustworthy activity system.

## Remaining evidence tasks

- Capture current iOS, Android and Watch execution.
- Reconstruct every chart and projected-lift formula.
- Audit custom exercise migration, deletion and duplicate handling.
- Verify current PRO gates, integrations and export schema.

