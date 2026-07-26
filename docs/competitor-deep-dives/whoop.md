# WHOOP — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: WHOOP app/web, 4.0/5.0/MG and One/Peak/Life feature gates

## Evidence boundary

WHOOP publicly explains product concepts and high-level inputs, but exact
weights remain proprietary. Its public developer API is narrower than the
consumer product. Exact accessible fields are recorded separately in
[`whoop-v2.md`](../body-provider-inventory/whoop-v2.md).

Primary sources:

- App navigation and membership matrix:
  https://support.whoop.com/s/article/Navigating-the-WHOOP-Mobile-App
- Recovery:
  https://support.whoop.com/s/article/WHOOP-Recovery
- Strain:
  https://support.whoop.com/s/article/WHOOP-Strain
- Sleep:
  https://support.whoop.com/s/article/WHOOP-Sleep
- Healthspan:
  https://support.whoop.com/s/article/Healthspan-WHOOP-Age-Pace-of-Aging-Guide
- Stress Monitor:
  https://support.whoop.com/s/article/Get-to-Know-the-Stress-Monitor
- Journal:
  https://support.whoop.com/s/article/WHOOP-Journal-Overview
- User export fields:
  https://support.whoop.com/s/article/How-to-Export-Your-Data

## Information architecture

The current app centers on Home, Health, Community and More.

Home surfaces today's Strain, Recovery and Sleep dials, My Day, activities,
Journal, plans and targets. Health contains live HR, Health Monitor, Stress,
Healthspan, hormonal insights and—where device, tier, age and region permit—
Blood Pressure Insights and Heart Screener.

Any dashboard metric can open weekly, monthly or six-month trends. Calendar
uses Recovery colors. The web app emphasizes side-by-side comparison and
longer trend analysis.

This is a tightly coached performance loop rather than a neutral health record.

## Recovery

Recovery is calculated once per sleep-to-sleep cycle and presented the
following morning:

- Green: 67–100%;
- Yellow: 34–66%;
- Red: 0–33%.

WHOOP documents these inputs:

- HRV relative to a personal 30-day baseline;
- resting heart rate;
- respiratory rate;
- sleep hours versus Sleep Need;
- sleep stages, especially Light and Awake;
- skin-temperature deviation;
- SpO2;
- menstrual-cycle phase where applicable.

WHOOP describes HRV and RHR as the two largest contributors. HRV is calculated
as a weighted overnight average with more weight during slow-wave and later
sleep. Exact formula weights remain closed.

Recovery is physiological readiness, not an illness diagnosis and not the same
as sleep quality. That conceptual separation is worth preserving.

## Strain

Strain is a personalized, nonlinear 0–21 exertion score combining
cardiovascular load and, when sufficiently captured, muscular effort:

- 0–9 Light;
- 10–13 Moderate;
- 14–17 High;
- the upper end toward 21 represents exceptional load.

Day Strain accumulates exercise and non-exercise exertion. Activity Strain
describes one recorded session. Strength Trainer adds exercise/set/weight
context so muscular load is not inferred from heart rate alone.

Optimal Strain links the day's target to Recovery. WHOOP's strength is the
feedback loop; its weakness is that the proprietary nonlinear unit cannot be
reproduced honestly outside WHOOP.

## Sleep

The current Sleep Performance score combines:

- Sleep Sufficiency;
- Sleep Consistency;
- Sleep Efficiency;
- Sleep Stress.

This replaced the earlier hours-versus-needed-only score. WHOOP documents:

- 85%+ Optimal, 70–85% Sufficient, below 70% Poor for overall performance;
- above 90% optimal sleep efficiency;
- consistency calibration after three consecutive nights.

Detailed sleep metrics include:

- time in bed and total sleep;
- Awake, Light, REM and Deep;
- restorative sleep (REM + Deep);
- wake events;
- efficiency;
- respiratory rate;
- latency for manually tracked sleep;
- Sleep Debt.

Sleep Need is dynamic from baseline sleep, current Strain, Sleep Debt and naps.
Naps reduce subsequent Sleep Need but do not create a new Recovery and are not
directly added to Sleep Debt. Sleep Planner turns the need into bedtime and
wake recommendations.

WHOOP explicitly says only sleep duration and consistency enter Healthspan
because the other sleep factors did not meet its stated evidence threshold.
That is a valuable product precedent: an input can be useful operationally
without being justified for a longevity claim.

## Stress

Stress Monitor uses heart rate, HRV relative to a personal baseline and motion
to distinguish physiological activation from physical exertion. It presents:

- a prominent current score;
- a daily fluctuation graph;
- comparison with the prior week;
- Total Day, Sleep and Non-Activity Stress trends;
- guided breathwork with pre/post physiological response.

It is available only on Peak/Life. WHOOP explicitly distinguishes Stress from
Strain and from subjective emotion.

## Healthspan

Healthspan is available on Peak/Life and only for adults:

- unlock after 21 recoveries in the first 31 days;
- full calibration after 90 days;
- continued result requires 21 recoveries per 31-day period;
- WHOOP Age uses a six-month view;
- Pace of Aging uses the latest 30 days;
- results update weekly.

Documented WHOOP Age inputs are:

- sleep duration and consistency;
- weekly time in HR zones 1–3 and 4–5;
- weekly strength-activity time;
- daily steps;
- resting heart rate;
- VO2 max;
- lean body mass when available.

Pace of Aging expresses expected age movement relative to chronological time.
WHOOP itself states there is no clinical benchmark validating these proprietary
summary metrics. Body must therefore treat this as competitor product evidence,
not scientific validation.

Each contributor receives an Age Impact. HRV is intentionally excluded because
WHOOP considers it too individualized for population-level benchmarking. Lab
biomarkers can be shown alongside Healthspan but do not change WHOOP Age or
Pace of Aging.

## Journal and behavior insights

Journal offers more than 160 preset behaviors and supports morning or in-moment
logging. Entries belong to the date the behavior occurred.

Behavior Insights compare repeated Yes/No exposure with Recovery and Sleep.
WHOOP documents a minimum of five Yes and five No observations within 90 days
and warns that overlapping behaviors can prevent attribution.

This is correlation, not causation. The current inability to create custom
behaviors is a major limitation for Body's flexibility goals.

## Specialist and regulated features

The product also includes:

- activity detection and HR-zone detail;
- steps, calories, GPS and VO2 max;
- body-composition/weight trends;
- hormonal, pregnancy and postpartum insights;
- Health Monitor;
- Blood Pressure Insights on Life/MG;
- on-demand ECG and irregular-rhythm notifications on Life/MG in eligible
  regions and ages;
- AI Coach and Advanced Labs.

Device, membership, age and regional gates must be first-class availability
metadata. Regulated features cannot be generalized to every market.

## User-owned export and API distinction

WHOOP's user export includes cycle, sleep and workout CSVs with Recovery, RHR,
HRV, Strain, energy, HR, timing/stages, SpO2, skin temperature, respiratory
rate, GPS and HR zones. Export availability does not automatically authorize
continuous application ingestion.

The public developer API is separately mapped and should be used as the
connector truth. Product-only fields must never be inferred into API schemas.

## Visual grammar

- three prominent daily dials for Strain, Recovery and Sleep;
- red/yellow/green Recovery calendar;
- nonlinear Strain gauge and target range;
- sleep-stage timeline plus sufficiency/consistency/efficiency/stress;
- live stress line and daily distribution;
- HR-zone distributions for workouts;
- long-term age/pace trends and contributor impacts;
- behavior impact comparisons;
- side-by-side long-range web trends.

The strongest pattern is not a single chart but the closed daily loop:
recover, choose target strain, accumulate strain, meet sleep need, repeat.

## Strengths

- Exceptionally coherent performance/recovery loop.
- Clear temporal roles for morning, all-day and long-term metrics.
- Strong personalized-baseline use.
- Muscular load is not reduced to heart rate alone.
- Sleep Need converts physiology into an actionable time target.
- Journal provides structured behavior context.
- Feature gates are comparatively explicit.

## Weaknesses and opportunities for Body

- Most differentiating scores and formulas are proprietary.
- Continuous value depends on WHOOP hardware and a paid tier.
- Several important features sit behind Peak/Life.
- Journal is preset-only and insights remain correlational.
- Recovery's traffic-light framing can overcompress uncertainty.
- Healthspan has no clinical validation benchmark by WHOOP's own statement.
- The product is performance-centered rather than a complete life/body system.

## Body product implications

Adopt:

- a coherent feedback loop between readiness, planned load, actual load and
  sleep need;
- explicit temporal horizon and refresh cadence;
- physiological-baseline comparisons;
- muscular and cardiovascular load separation;
- contributor-level explanations and calibration states;
- structured behavior logging with sufficient-data rules;
- clear device/tier/region/age gates.

Improve:

- custom behaviors and activities;
- provider-neutral inputs and source provenance;
- quantified uncertainty and missingness;
- general wellbeing, nutrition, hygiene and looks coverage;
- honest distinction between correlation and causation;
- flexible widget variants and sizes rather than fixed branded dials.

Do not copy:

- WHOOP's proprietary Recovery, Strain, Sleep Performance or Healthspan
  formulas;
- score names, traffic-light trade dress or dial compositions;
- behavior impacts as causal effects;
- user-export fields as proof of connector availability;
- regulated functions outside approved device/region conditions.

## Open evidence tasks

- Capture current tier/device/region empty and locked states.
- Verify the exact public API versus export delta during connector design.
- Test journal-insight behavior with confounding and missing days.
- Validate HRV/RHR recovery, sleep scoring, strain/load and longevity claims in
  the scientific phase.

