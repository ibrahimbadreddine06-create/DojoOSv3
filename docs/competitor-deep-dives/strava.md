# Strava — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Strava activity, training/progress and social product surfaces

## Evidence boundary

Strava publicly documents many product calculations at a conceptual level.
Exact API fields and webhook behavior are recorded in
[`strava-v3.md`](../body-provider-inventory/strava-v3.md). Subscription-only
product features are not assumed to be API outputs.

Primary sources:

- Relative Effort:
  https://support.strava.com/en-us/articles/15401794-relative-effort
- Fitness:
  https://support.strava.com/en-us/articles/15401765-fitness
- Fitness & Freshness:
  https://support.strava.com/en-us/articles/15402032-fitness-freshness
- Athlete Intelligence:
  https://support.strava.com/en-us/articles/15401629-athlete-intelligence-on-strava

## Product role

Strava is activity-first: record/import a session, analyze it, compare progress
and optionally share/compete. Its strongest surfaces are:

- activity feed and detail;
- route/map and segment performance;
- Progress/training charts;
- goals, challenges and clubs;
- routes;
- social feedback and privacy controls.

It is not a passive all-day health record.

## Relative Effort

Relative Effort estimates cardiovascular work for one activity from HR or
manually supplied Perceived Exertion. It:

- personalizes to HR zones;
- weights time at higher intensity more heavily;
- normalizes different sport types;
- supports short-hard versus long-easy comparison;
- accumulates into a weekly total.

The weekly chart shows a suggested band based on the prior three-week average
and labels the current week as below, within or above that range. It requires a
subscription and HR or perceived exertion.

This is a strong wearable/manual fallback pattern: subjective exertion can
replace bad or missing HR, but the provenance must remain visible.

## Fitness, Fatigue and Form

Fitness is a personal accumulated-training index from Relative Effort and/or
power-derived Training Load. It uses an impulse-response model with decay and
is meaningful against the same person's history, not other athletes.

Fitness & Freshness adds:

- Fitness;
- Fatigue;
- Form;
- daily Training Load/Relative Effort.

For athletes with at least ten rides containing both power Training Load and
Relative Effort, Strava calculates an athlete-specific best fit to fill missing
power load from HR/perceived exertion. Trends matter more than absolute values.
Strava explicitly warns that rising Fitness alone does not identify
overtraining.

## Activity detail and intelligence

Activity detail combines:

- route/elevation;
- time, distance, pace/speed;
- HR and zones;
- power and zones;
- cadence and other sport-specific fields;
- splits/laps;
- segments, achievements and comparisons;
- photos, notes, gear and social interaction.

Athlete Intelligence generates private natural-language summaries for selected
run/ride/walk/hike types using current and relevant prior activity data. It
does not generate from estimated power, perceived exertion or cadence alone.
The user can request more detail and rate the result.

Body should treat AI explanation as a presentation layer grounded in traceable
metrics, never as the metric source.

## Visual grammar

- GPS route as the primary session visual;
- pace/HR/power/elevation charts aligned by time or distance;
- zone distributions;
- split/lap tables;
- weekly load bars with adaptive range;
- Fitness/Fatigue/Form multi-line history;
- segment leaderboards and personal records;
- feed card leading to deep activity detail.

Strava's charts succeed when all traces share one activity axis. Cross-metric
alignment is more valuable here than decorative chart variety.

## Strengths

- Excellent activity ingestion ecosystem.
- Deep route/session context.
- Strong social motivation and goals.
- Sensible perceived-exertion fallback.
- Personalized training bands and within-person Fitness framing.
- Clear separation of activity, weekly load and long-term accumulation.

## Weaknesses and Body opportunities

- Recovery, sleep, nutrition and general health are shallow or absent.
- Several analytical views require subscription.
- Social comparison can distort health decisions.
- Relative Effort/Fitness remain proprietary derived values.
- API rate limits and activity-owner rules constrain synchronization.
- AI prose can overstate meaning if not tightly grounded.

Body should adopt aligned session charts, raw-to-weekly-to-long-term drill-down,
perceived-exertion fallback and personal-history comparison. It should avoid
social leaderboards as health truth, preserve source modality and never copy
closed scores or infer paid product fields into the API.

## Open evidence tasks

- Verify current API rate limits, scopes and webhook lifecycle at implementation.
- Map sport-specific detail availability and manual-entry degradation.
- Validate impulse-response/load methods and HR-zone assumptions scientifically.
- Capture subscriber/free and privacy-state differences.

