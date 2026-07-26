# Widget umbrella specification — Floors Climbed

Status: definitive information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.floors_climbed`

## Identity

Question: **How many flights/floors did the selected source record?**

Essential `1×1`: recorded count, period, source and state.

## Data and calculation

- Preserve whether a provider calls the record floors or flights.
- Aggregate non-overlapping compatible records.
- Do not map route elevation metres into floor count without an explicit
  provider definition or named conversion method.

## Truth

This is a provider observation, not a universal vertical-work metric.
Barometer/device availability and indoor/outdoor behavior affect coverage.

## Variant directions

- total/progress;
- daily trend;
- time distribution where interval data exists.

## Sizes and detail

Initial: `1×1`, `1×2`, `2×1`, `2×2`.

Detail includes daily history, source/device behavior, coverage and contributing
records.

