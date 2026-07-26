# Oura — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Oura App, Gen3/Ring 4/5 feature gates and publicly documented
product behavior

## Evidence boundary

Oura documents product behavior and calculation inputs more openly than its
exact formulas. A visible Oura feature is not assumed to be available through
the public API. Exact API evidence is recorded separately in
[`oura-v2.md`](../body-provider-inventory/oura-v2.md).

Primary sources:

- App architecture and Health Areas:
  https://support.ouraring.com/hc/en-us/articles/360058599753-How-to-Use-the-Oura-App
- Activity contributors:
  https://support.ouraring.com/hc/en-us/articles/360055901214-Activity-Contributors
- Readiness contributors:
  https://support.ouraring.com/hc/en-us/articles/360057791533-Readiness-Contributors
- Sleep contributors:
  https://support.ouraring.com/hc/en-us/articles/360057792293-Sleep-Contributors
- Cumulative Stress:
  https://support.ouraring.com/hc/en-us/articles/45979919957395-Cumulative-Stress
- Resilience:
  https://support.ouraring.com/hc/en-us/articles/25358829055251-Resilience
- Cardiovascular Age:
  https://support.ouraring.com/hc/en-us/articles/28451491040019-Cardiovascular-Age
- Trends:
  https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends
- Product glossary:
  https://support.ouraring.com/hc/en-us/articles/5949130374547-Glossary
- 2026 software expansion:
  https://ouraring.com/blog/new-software-features/

## Information architecture

The current app uses three primary tabs.

### Today

Today is a changing daily narrative rather than a static metric catalogue:

- shortcuts to current scores and priority health signals;
- a daily highlight;
- a chronological timeline for sleep, tags, meals, workouts and events;
- activity and goal progress;
- discoveries or contextual insights.

### Vitals

Vitals is the stable metric catalogue. Cards are grouped into readiness,
sleep, activity, stress, women's health, heart health, metabolic health and
core measurements. Categories can be reordered. Cards expose the current
result, status and detail/trend navigation.

### My Health

My Health moves from daily scores to slower health areas, habits, routines,
reports and long-term measurements. Current health-area ratings include Sleep
Health, Stress Management, Heart Health, Menopause Insights and Cycle
Regularity. It explicitly shows calibration and insufficient-data states.

This three-speed architecture is strong: current day, metric library and
long-term health are different jobs.

## Readiness

Readiness is a personalized 0–100 morning score with nine documented
contributors:

- Resting Heart Rate;
- HRV Balance;
- Body Temperature;
- Recovery Index;
- Sleep;
- Sleep Balance;
- Sleep Regularity;
- Previous Day Activity;
- Activity Balance.

Oura uses windows up to two weeks for several short-term comparisons and
roughly two months for longer-term baselines. Recovery Index describes how
early the lowest resting heart rate occurs during sleep; Oura considers having
at least six hours of sleep after that low point optimal.

The product separates the summary score from contributor ratings and baseline
deviations. Body should preserve that separation and must not copy the
undisclosed score weights.

## Sleep

Sleep Score has seven documented contributors:

- Total Sleep;
- Efficiency;
- Restfulness;
- REM Sleep;
- Deep Sleep;
- Latency;
- Timing.

The detail experience combines a stage timeline, bedtime/wake timing,
contributors and overnight physiology. Sleep Health is a slower rating based
on the median Sleep Score over 14 days and requires at least seven valid scores
in that period.

Oura also exposes bedtime guidance, body clock/chronotype, naps, breathing
regularity, SpO2 and temperature context. Editing bedtime/wake time and
troubleshooting missing data are explicit workflows.

## Activity

Activity Score is distinct from daily activity-goal completion. Its six
contributors are:

- Stay Active: inactivity across the past 24 hours excluding rest/sleep;
- Move Every Hour: avoidance of long passive periods;
- Meet Daily Goals: completion over the past seven days;
- Training Frequency: medium/high-intensity sessions over seven days;
- Training Volume: medium/high-intensity MET minutes over seven days;
- Recovery Time: easy-day balance across the week.

Oura documents reference behavior such as movement after 50 minutes of
inactivity, but these values are product guidance rather than universal medical
thresholds. The daily goal adapts using readiness and profile data.

The activity experience includes automatic detection, manually added/imported
activities, active/total calorie burn, steps, inactivity, daily movement and
live activity tracking. Imported duplicate workouts are resolved to one
preferred record, an important precedent for Body's source-resolution policy.

## Stress system

Oura separates three time horizons:

- Daytime Stress: continuous waking-hours physiology;
- Resilience: a daily mid-term view using roughly 14 days;
- Cumulative Stress: a weekly long-term result over 31 days.

Resilience combines Daytime Stress load, restorative time and sleep recovery.
Cumulative Stress requires at least 21 valid day-and-night days within the last
31 days and uses five documented contributors:

- Sleep continuity;
- Heart stress-response;
- Sleep micromotions;
- Temperature regulation;
- Activity impact.

Cumulative Stress is rated low, moderate or high. Oura correctly explains that
physiological stress is not identical to perceived mental stress and that a
slow metric should not react immediately to one behavior change.

## Heart and longevity

Heart Health includes resting/daytime/activity heart rate, HRV, Cardio Capacity
(VO2 max estimate) and Cardiovascular Age.

Cardiovascular Age:

- estimates pulse-wave velocity from the PPG waveform rather than directly
  measuring it;
- requires 14 nights in the past 30 days to establish its first result;
- compares the estimate with chronological age as Below, Aligned or Above;
- exposes estimated PWV and weekly history;
- is deliberately slow-moving.

Oura states that Cardiovascular Age and Cardio Capacity do not directly affect
one another. The app also has explicit medical limitations and device,
membership and profile-data requirements.

## Women's, metabolic and 2026 expansion

The product includes cycle tracking, fertile-window and pregnancy-related
experiences, menopause insights and cycle-regularity ratings. These are
conditional product surfaces, not universal widgets.

Metabolic features include Meals and glucose integrations. Announced 2026
expansion includes Health Radar, Blood Pressure Signals, Nighttime Breathing,
GLP-1 Insights, live workout tracking, lab-PDF upload and Health Panels. Each
has rollout, geography, device, membership or data-volume gates. Body must
model those gates explicitly instead of presenting the catalogue as universally
available.

## Trends and visual grammar

Oura's recurring patterns are:

- three circular daily scores;
- score plus contributor list;
- personal-baseline ranges rather than population-only thresholds;
- overnight timelines for sleep;
- line/trend charts with tags and activities as context;
- slow health metrics presented weekly or over months;
- day timeline for heterogeneous events;
- explicit calibration and “not enough data” states;
- color reserved for semantic condition and score families.

Oura's platform widgets show that concise score, goal, battery and mini-graph
views can coexist without forcing one card composition.

## Strengths

- Clear separation of daily, metric and long-term contexts.
- Strong baseline and calibration communication.
- Multiple stress horizons answer different questions.
- Contributor transparency without pretending the formula is open.
- Sleep-first sensing produces coherent recovery experiences.
- Long-term metrics change at an appropriately slow cadence.
- Manual/imported activity repair is supported.

## Weaknesses and opportunities for Body

- Deep value is heavily tied to Oura hardware and membership.
- Several high-value scores and formulas are proprietary.
- Product-visible breadth exceeds public API breadth.
- Readiness, Sleep, Activity, Resilience and health-area ratings can still
  create score overload.
- Some 2026 capabilities are region/device limited or staged rollouts.
- Nutrition and workout depth is secondary to recovery/sleep.

## Body product implications

Adopt:

- daily, metric-library and long-term-health separation;
- explicit temporal horizon on every derived result;
- baseline/calibration/insufficient-data states;
- score-to-contributor drill-down;
- slow cadence for slow physiology;
- duplicate-source resolution;
- timeline context through tags, activities and intake.

Improve:

- provider-neutral calculations and source provenance;
- usable value without one proprietary device;
- clearer distinction between measured, estimated and self-reported data;
- fewer overlapping summary scores unless each answers a distinct question;
- Body's full umbrella, variant and responsive-size system.

Do not copy:

- proprietary Oura formulas, score names or visual trade dress;
- product screens as proof of API access;
- guidance thresholds as universal medical truth;
- unlaunched or gated features as generally available;
- associations between tags and outcomes as causal claims.

## Open evidence tasks

- Verify Ring 5 public API exposure once its developer schema is updated.
- Capture empty, partial, calibration and subscription-gated screens.
- Verify regional availability for regulated and 2026 Health Radar features.
- Validate the scientific basis of readiness, stress, sleep-stage and
  cardiovascular estimates in the science phase.

