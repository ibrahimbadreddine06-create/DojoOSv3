# Bevel — targeted competitor evidence pass

Status: Tier B targeted pass  
Updated: 2026-07-25

## Evidence boundary

This pass uses Bevel's current first-party help center. It records disclosed
inputs and interface semantics, not independently validated accuracy and not a
license to reproduce proprietary scores.

## Distinctive product architecture

- A connected daily system links Sleep, Recovery and Strain rather than showing
  them as isolated totals.
- Stress and Energy Bank are intraday signals. Energy Bank carries over between
  days and combines recovery, sleep, strain and stress.
- Health Monitor centralizes respiratory rate, resting heart rate, HRV, SpO2,
  temperature and sleep.
- A timeline joins workouts, sleep and nutrition in chronological context.
- The same domains recur as focused widgets, daily overview, trends and a
  color-coded monthly calendar.

## Disclosed calculation semantics

- Sleep Score uses time asleep, REM, deep sleep, heart-rate dip, efficiency and
  continuity.
- Recovery is calculated each morning from RHR, HRV, respiratory rate, SpO2
  and wrist/body temperature. Current guidance also names Sleep Score.
- Bevel defaults to sleep HRV and can use RMSSD or SDNN. It describes a personal
  60-day baseline and a 2–6 week calibration period.
- Strain joins active workout strain with passive daily strain; Target Strain
  adapts from recent strain and recovery.
- Stress uses heart-rate and HRV signals while accounting for movement.
- The exact weighting and normalization of composite scores remain proprietary.

## Visual and interaction grammar

- Focused cards coexist with a three-score daily overview.
- Trends use an average reference line; monthly views encode relative states
  by color.
- Energy Bank uses a time-varying line and distinguishes daily high and low.
- Home/lock-screen widgets support both single-signal and multi-signal views.

## Product lessons, not widget decisions

- A composite score needs its contributors, baseline and update cadence nearby
  in the product model even when the compact surface hides them.
- A persistent intraday state is meaningfully different from a morning
  snapshot.
- Correlation insights must explicitly say that correlation is not causation.
- These are evidence categories. They do not define Body umbrellas.

## Remaining evidence tasks

- Directly capture every relevant current screen and size.
- Audit score changes against known input changes.
- Independently validate physiological claims before Body uses them.

## First-party sources

- https://help.bevel.health/en/articles/11251073
- https://help.bevel.health/en/articles/11257601
- https://help.bevel.health/en/articles/10436673
- https://help.bevel.health/en/articles/10430593
- https://help.bevel.health/en/articles/10431489
- https://help.bevel.health/en/articles/10437057
