# Ultrahuman — targeted competitor evidence pass

Status: Tier B targeted pass  
Updated: 2026-07-25

## Evidence boundary

This pass uses Ultrahuman's current first-party product and developer
documentation. Marketing efficacy claims remain claims until independently
validated.

## Distinctive product architecture

- The product connects sleep, recovery, movement, circadian timing and
  metabolic/glucose signals.
- Sleep Index is positioned as the compact sleep summary while retaining sleep
  duration, RHR, restfulness and sleep stages.
- Movement Index contextualizes steps, workouts, calories and non-exercise
  movement.
- Stress Rhythm interprets HR, HRV and RHR against circadian context.
- Dynamic Recovery is described as adaptive during the day.
- The first-party API exposes both composite outputs and their lower-level
  contributors, including sleep stages, efficiency, temperature deviation,
  HR drop, HRV, SpO2, active minutes and glucose measures.

## Visual and interaction grammar

- Index cards are paired with contributor metrics rather than standing alone.
- Circadian timing is represented as a clock-like phase model.
- Movement uses a score plus concrete totals.
- Continuous metabolic signals invite time-series and event-overlay views
  rather than only daily summaries.

## Product lessons, not widget decisions

- Provider composites and raw fields must be stored as separate provenance-
  aware facts.
- Circadian context can change the meaning of the same physiological signal.
- A multi-sensor product needs clear dependency/fallback states.
- No exposed API field automatically becomes a Body umbrella.

## Remaining evidence tasks

- Confirm commercial API access, regions, units, null behavior and historical
  limits.
- Capture the current consumer app directly.
- Independently validate the score and intervention claims.

## First-party sources

- https://vision.ultrahuman.com/developer-docs
- https://www.ultrahuman.com/cw/ring/
- https://www.ultrahuman.com/gb/rare/
