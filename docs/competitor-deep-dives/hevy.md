# Hevy competitor deep dive

Status: Tier A activity reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Feature guide](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2025-Features-Guide)
- [Statistics](https://help.hevyapp.com/hc/en-us/articles/35702030346903-Hevy-Statistics-Explained-Track-Your-Training-Progress-and-Muscle-Growth)

## Product architecture

Hevy centers strength-session execution and history:

- routines and templates;
- sets, reps, load, RPE and specialized set types;
- rest timers, plate calculator and supersets;
- exercise library with instructions;
- custom exercises;
- prior-performance context during logging;
- social workout feed and leaderboards;
- web, phone and watch execution.

## Analysis surfaces

- seven-day trained-muscle body heat map;
- set count per muscle group;
- muscle distribution with prior-period comparison;
- workout count, duration, total volume and completed sets;
- most frequently performed exercises;
- exercise-specific charts, estimated 1RM and personal records;
- monthly report with bars, calendar, PRs, muscle distribution and photos.

Volume, frequency, set count and estimated strength are different analytical
facts. A body heat map represents assigned exercise-muscle mappings, not direct
measurement of muscular stimulus or growth.

## Visual and interaction grammar

- Dense, rapid set-entry table.
- Previous set shown in the execution context.
- Body silhouette/heat map.
- Period-comparison bars and distribution chart.
- Exercise-level history and PR lists.
- Calendar and monthly recap composition.
- Social cards generated from completed sessions.

## Product lessons, not widget decisions

- Strength analytics need exercise-level identity, not only whole-body totals.
- Custom exercises are necessary because no database is exhaustive.
- “Volume” must name its exact formula and should not imply hypertrophy.
- Estimated 1RM must retain formula and exercise context.
- Muscle maps are useful navigation but are modelled allocations, not sensors.

## Remaining evidence tasks

- Verify every exercise-chart formula and supported exercise type.
- Capture active-workout, watch and offline/error states.
- Audit edit/delete effects on PRs and statistics.
- Reconstruct free/Pro history and export limits.

