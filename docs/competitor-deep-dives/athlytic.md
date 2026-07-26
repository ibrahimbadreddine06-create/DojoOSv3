# Athlytic — targeted competitor evidence pass

Status: Tier B targeted pass  
Updated: 2026-07-25

## Evidence boundary

This pass uses Athlytic's current first-party product and onboarding material.
Its algorithm descriptions are vendor disclosures, not independent validation.

## Distinctive product architecture

- The daily loop is Recovery → personalized Target Exertion Zone → live
  cumulative Exertion.
- Recovery is a fixed morning snapshot; Battery is a separate intraday state
  that can charge or drain.
- Sleep combines quality, debt, consistency and sleeping heart-rate dip.
- Journal events and auto-tags feed an Impact Analysis for Recovery and Sleep.
- Health monitoring compares HRV, RHR, SpO2, respiratory rate and wrist
  temperature with personal normal ranges.

## Disclosed calculation semantics

- Recovery is 0–100%, using HRV and RHR versus a personal 60-day baseline, with
  HRV described as slightly more heavily weighted.
- Exertion is cumulative on a 0–10 scale and uses a personalized heart-rate
  threshold derived from recent maximum and resting heart rate.
- Sleep Quality includes REM/deep sleep, awake time, interruptions and
  respiratory rate. Exact weights remain undisclosed.
- Battery updates with new HRV samples, unlike the static morning Recovery.

## Visual and interaction grammar

- One morning number and one target zone form a simple action loop.
- Different widget sizes deliberately shift from a single metric to daily
  summary, trend, rings or combined metrics.
- Watch surfaces emphasize live zone state; phone surfaces expose history and
  contributors.

## Product lessons, not widget decisions

- Snapshot, cumulative load and intraday capacity are different temporal
  products even when they share inputs.
- Compact surfaces can prioritize a decision while detail surfaces preserve
  traceability.
- Widget-size expansion can add context, but must retain the smaller size's
  essential information.

## Remaining evidence tasks

- Capture current in-app layouts and all widget sizes.
- Verify calculation disclosures against current settings and edge cases.
- Independently audit every health interpretation.

## First-party sources

- https://athlyticapp.com/getting-started/
- https://athlyticapp.com/widgets/
- https://athlyticapp.com/
