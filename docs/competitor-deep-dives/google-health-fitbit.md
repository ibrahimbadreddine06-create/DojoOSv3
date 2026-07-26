# Google Health and Fitbit — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Google Health app after the May 2026 Fitbit-app migration, Fitbit/Pixel
Watch experience, and current documented calculations

## Evidence boundary

Google began replacing the Fitbit app with Google Health on 2026-05-19. Older
Fitbit documentation remains useful only when current Google Health support
still points to the same behavior. This document gives current Google Health
sources precedence and records legacy behavior explicitly when relevant.

Primary sources:

- Redesign/migration:
  https://support.google.com/googlehealth/answer/17068213
- Current app feature map:
  https://support.google.com/product-documentation/answer/17081467
- Navigation and Today customization:
  https://support.google.com/googlehealth/answer/14237011
- Readiness:
  https://support.google.com/googlehealth/answer/14236710
- Cardio load and target load:
  https://support.google.com/googlehealth/answer/15402655
- Current Sleep Score:
  https://support.google.com/googlehealth/answer/14236513
- Sleep stages:
  https://support.google.com/googlehealth/answer/14236712
- Vitals:
  https://support.google.com/googlehealth/answer/14236917
- Resilience and stress:
  https://support.google.com/googlehealth/answer/14237928
- Cycle health:
  https://support.google.com/googlehealth/answer/14237115
- Heart rate and HRV:
  https://support.google.com/googlehealth/answer/14237938

The exact retrievable API fields are separately captured in
[`google-health-api.md`](../body-provider-inventory/google-health-api.md).

## Product architecture

With a paired Fitbit or Pixel Watch, Google Health uses four tabs:

| Tab | Primary job |
|---|---|
| Today | customizable focus metrics, recent state, logging/starting workouts and timely insights |
| Fitness | goals, activity history, workouts, cardio load and fitness trends |
| Sleep | last-night detail, score components, trends and sleep content |
| Health | vitals, metabolic/nutrition, cycle, mental wellbeing, medical data and alerts |

Without a paired first-party wearable, the app exposes Today and Health. This
is an explicit product distinction: the deeper Fitness and Sleep experiences
depend on a device ecosystem, while manual and imported health management still
works.

## Today

Today places customizable focus metrics at the top. Current documented examples
include:

- steps;
- weekly cardio load;
- readiness;
- sleep;
- vitals.

Users can log data or start phone workout tracking and see recent exercise,
sleep and logged-data updates. Premium adds coach messages and message history.

Product lesson: the overview is not merely a passive feed; it combines current
state, selected priorities and the shortest path into capture or action.

## Fitness

The Fitness tab includes:

- coach fitness plans with Premium;
- quick-start, saved, video and user-created workouts;
- recent activities and exercise days;
- friends leaderboards;
- cardio load, energy, RHR, HRV, VO2 max and running distance;
- steps, distance, floors and hourly activity.

The current product therefore combines workout execution, training guidance
and longitudinal fitness metrics in one domain rather than splitting them into
separate apps.

## Cardio load and target load

### Disclosed calculation basis

Google states that cardio load is based on the TRIMP (Training Impulse) model
and uses heart rate during activity plus age, resting heart rate and sex.
Cardio load starts at zero each day and accumulates from the light heart-rate
zone upward. It can accrue from daily activity, not only manually started
workouts.

Google compares the last seven days with the prior four-week period—described
as an acute-to-chronic workload relationship—to determine training status.
Current states are:

- under training;
- improving fitness;
- maintaining;
- over training.

Target load considers:

- the user's maintain/improve target;
- recent cardio-load history;
- calibration from continuous wear;
- for Premium Coach users, the current Recovery/Maintain/Build training focus.

Documentation contains different onboarding descriptions—first target after
seven consecutive days/nights, personalization after roughly two weeks, and
best accuracy after 28 days. Body should preserve these as staged calibration
states rather than present one magical availability moment.

### Visualization and interaction

- Today uses a weekly cardio ring.
- The center shows percentage progress toward the weekly target.
- Daily contribution and weekly total remain visible.
- Detail switches day/week/month/year.
- Day detail lists activities contributing to load.
- Post-workout summary shows workout load, target progress and load earned per
  heart-rate zone.
- Watch workout views can include live cardio load.
- Users can delete cardio-load data by range.

The weekly target deliberately provides schedule flexibility. This is stronger
than treating every day as an independent pass/fail goal.

### Evidence caution

Google names TRIMP and major inputs but does not publish the exact current
equation, normalization, zone boundaries or target algorithm. `Cardio Load` and
`Target Load` remain provider-derived. Body may build its own validated TRIMP
family calculation but must not label it Google Cardio Load.

## Readiness

Readiness is a daily 0–100 provider score classified Low, Moderate or High.
Current inputs are:

- recent sleep patterns, evaluated across roughly the past week;
- HRV relative to personal baseline;
- resting heart-rate trends relative to personal baseline.

Google removed the former direct activity component and replaced it with RHR,
framing the score around the body's response rather than yesterday's activity.

Eligibility behavior:

- seven nights are required for the initial personalized baseline;
- approximately one month of consistent wear improves the baseline;
- missing device support, sleep or physiological data prevents a score.

The app exposes the score prominently beside weekly cardio load and sleep.
Premium Coach can use it to adjust guidance.

The weights and transformations are not public. Body can use the input pattern
as research evidence, never the hidden Google algorithm.

## Sleep

### Information structure

The Sleep tab includes:

- score and duration trends;
- last-night timeline;
- sleep quality and schedule;
- REM, deep and efficiency;
- Premium trend summary and content.

The stage detail supports:

- interactive timeline inspection by press-and-drag;
- Benchmarks;
- 30-day averages;
- Awake plus REM/Light/Deep;
- explicit missing-stage troubleshooting.

Google explains that Awake is relative to the total sleep period while
REM/Light/Deep partition asleep time, preventing the common mistaken assumption
that all four percentages must share one denominator.

### Current Sleep Score

The 2026 score no longer uses only the legacy `time asleep + deep/REM +
restoration` presentation. Current documented contributors are:

- sleep duration;
- time to sound sleep;
- sound sleep;
- restlessness;
- full awakenings;
- interruptions.

Definitions:

- `sound sleep` includes stable Light, Deep or REM accompanied by low, steady
  heart rate;
- `full awakenings` are distinct interruptions longer than five minutes;
- `interruptions` sum longer awake periods between first sleep and final wake,
  including gaps between separate sleep sessions;
- `restlessness` captures shorter wake-like transitions.

Google compares observations with targets personalized by age, sex and total
sleep/opportunity. The exact weights are not published.

Current score bands:

- 90–100 Excellent;
- 80–89 Good;
- 60–79 Fair;
- below 60 Poor.

The app offers week/month/year navigation and chips for duration or quality
components. Edited sleep can trigger recalculation, but added time may create
stage gaps or prevent an accurate score; some edited data is excluded from
coach analyses.

Product lesson: a single score becomes substantially more useful when each
component has an operational definition and the user can see why manual edits
change confidence.

## Vitals

Current Vitals include:

- breathing rate;
- HRV;
- skin-temperature variation;
- SpO2;
- resting heart rate.

Data appears only when the connected device supports it. Google explicitly
frames Vitals as wellbeing insight, not emergency or medical diagnosis. Skin
temperature is contextualized by environment, bedding, circadian rhythm,
menstrual cycle and possible fever without assigning a cause.

The 2026 migration removed minute-level skin-temperature display while
retaining daily and weekly trends. This proves that vendor UI availability can
shrink independently of stored/API data and must be versioned.

## Resilience, body response and mood

Resilience replaces the previous numeric Stress Management Score in the
redesigned app. It uses qualitative states:

- Optimal;
- Balanced;
- Low.

Google describes more than ten factors grouped into:

- Responsiveness: heart rate, HRV and EDA when available, representing prior
  physical/mental demand;
- additional balance and activity-related categories described in the current
  Resilience detail.

Resilience is distinct from Readiness: Readiness describes recovery/preparedness
for activity, while Resilience describes capacity to absorb and recover from
physical and mental strain.

The precise model remains proprietary. Body must avoid collapsing both into one
generic recovery score merely because inputs overlap.

## Health domain

The Health tab is the broadest surface:

- customizable key metrics and Vitals;
- Heart: HR, RHR, HRV;
- Metabolic: weight, body-fat percentage, glucose;
- Nutrition: water, calorie target/intake/burn, protein, carbs, fat, glucose;
- Cycle health;
- Mental wellbeing: mindfulness, body responses/moods, resilience;
- Respiratory and temperature;
- Fitness and Sleep metrics;
- high/low HR, irregular rhythm and ECG health checks;
- medical records: allergies, conditions, labs, medications, pregnancy,
  procedures, social history, visits, vaccines and vital signs;
- profile, goals, coach history, labs/research enrollment.

The redesign removed legacy food plans and recipes while retaining calorie and
macronutrient targets. Blood-glucose symptoms/reminders were removed, but
glucose can be imported through Health Connect or Apple Health.

## Cycle health

Cycle health works without a wearable and supports logged:

- period and bleeding intensity;
- mood and symptoms;
- sexual activity;
- ovulation tests;
- discharge.

It predicts periods and an estimated fertile window. Google documents a
seven-day displayed fertile window to account for time-of-day variation around
the commonly described six-day biological window. Android users can receive
phase-oriented general guidance across nutrition, mental wellbeing, sleep and
activity.

Predictions and logged events must remain separate record classes in Body.

## Manual data and fallback

Google Health supports logging from Today/Health and manual exercise and sleep
editing. It also ingests data through first-party devices, Health Connect,
Apple Health and compatible third parties.

The migration illustrates a critical fallback rule: a person without Fitbit or
Pixel Watch should still have a coherent Today/Health product, but the
wearable-derived experience is richer and remains the primary design target.

## Visualization grammar

- focus metric cards on Today;
- weekly progress ring for cardio load;
- day/week/month/year trends;
- stage timeline with direct scrubbing;
- benchmark and 30-day-comparison views;
- component chips for score decomposition;
- heart-rate-zone distributions;
- categorical status for readiness, training and resilience;
- metric libraries grouped by health domain.

Google often pairs one clear aggregate with inspectable contributing metrics.
The aggregate is not allowed to replace the underlying history.

## Strengths

- Broad multi-domain scope closest to Body's wearable-first ambition.
- Explicit device-less fallback with a reduced but coherent product.
- Strong weekly training-target model and workout contribution breakdown.
- Increasingly transparent sleep-component definitions.
- Clear calibration periods and device-support conditions.
- Health domain covers nutrition, cycle, mental wellbeing and medical data.
- Current navigation separates today, fitness, sleep and broad health.

## Weaknesses and opportunities for Body

- Migration creates documentation/version ambiguity.
- Important formulas remain proprietary despite naming their inputs.
- Premium Coach introduces access-dependent guidance.
- Some previously granular data has been removed from the UI.
- Google Health is broad, but its four-tab taxonomy does not map cleanly to
  Body's output/intake/rest/hygiene model.
- Customization is focus/card selection, not Body's spatial
  umbrella/variant/size system.
- Readiness, resilience, sleep and training status overlap conceptually and can
  overwhelm users without a stronger explanation model.

## Body product implications

Adopt:

- wearable-rich and device-less coherent modes;
- calibration states visible before a personalized score is ready;
- weekly flexible training targets;
- direct contribution breakdown from session → zone → load;
- interactive sleep timelines plus benchmark/history views;
- explicit score components and missing-data explanations;
- domain-specific navigation rather than one endless metric feed.

Improve:

- stable semantics across product migrations;
- fully traceable source and calculation versions;
- one explanation vocabulary across overlapping recovery/stress concepts;
- user-controlled widget variants/sizes and accent;
- manual changes with explicit downstream recalculation impact;
- no premium gating of the user's own raw/history data.

Do not copy:

- hidden formulas or Google labels;
- legacy Fitbit calculation descriptions as if they still define 2026;
- TRIMP branding without specifying the exact Body method;
- medical/health-alert behavior without device, country and regulatory gates;
- the visual ring as a universal answer.

## Open evidence tasks

- Capture current Google Health cards and detail screens for exact variants and
  empty/error states.
- Resolve conflicting calibration wording for target load into observed product
  states.
- Verify the complete current Resilience category breakdown and availability.
- Record Premium/non-Premium differences by country and device.
- Scientific validation of TRIMP/ACWR, readiness inputs, five-minute awakening
  threshold and sleep-personalization claims occurs in the science phase.
