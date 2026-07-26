# Garmin Connect — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Garmin Connect, compatible-device health/training features and
Garmin Connect+ where it changes information access

## Evidence boundary

Garmin publicly documents product behavior in Support, Garmin Technology,
device manuals and newsroom/blog material. The Garmin Health API's exact
licensed field schema is not public. Product reconstruction is therefore
possible; connector implementation remains gated and no API field is inferred
from a screen.

Primary sources:

- Home customization:
  https://support.garmin.com/en-AU/?faq=35qboQSvKC2WpKkTaDaRP7
- Training Readiness science:
  https://www.garmin.com/en-CA/garmin-technology/running-science/physiological-measurements/training-readiness/
- Current Training Readiness factors and bands:
  https://www8.garmin.com/manuals/webhelp/GUID-0221611A-992D-495E-8DED-1DD448F7A066/EN-AU/GUID-C21BE0C8-A08E-4DA1-B6C6-2E0E2DDDB372.html
- Training load:
  https://support.garmin.com/en-CA/?faq=SEkNpdGyhR917js0qQL3Q6
- Training status:
  https://support.garmin.com/en-AU/?faq=VxKazDQ2mkAmDoQbJriEBA
- Body Battery:
  https://www.garmin.com/en-US/garmin-technology/health-science/body-battery/
- HRV baseline:
  https://support.garmin.com/en-GB/?faq=HnFAR4oFRF4kHeqYme3bU6
- Sleep tracking:
  https://support.garmin.com/en-GB/?faq=mBRMf4ks7XAQ03qtsbI8J6
- Stress:
  https://support.garmin.com/en-US/?faq=WT9BmhjacO4ZpxbCc0EKn9
- Endurance Score:
  https://www.garmin.com/en-GB/garmin-technology/running-science/physiological-measurements/endurance-score/
- Connect+ performance dashboard:
  https://www.garmin.com/en-US/blog/fitness/what-is-the-garmin-connect-performance-dashboard/

Public API evidence is separately recorded in
[`garmin-health-api.md`](../body-provider-inventory/garmin-health-api.md).

## Home architecture

Garmin Connect's home is section-based:

- today's activities, workouts and near-term events;
- In Focus;
- Sleep Coach;
- At a Glance;
- Events;
- Garmin Coach plans;
- Challenges;
- Yesterday;
- Last 7 Days.

Users can enable/disable these sections.

### In Focus

Up to six large cards. Intended for deeper, priority metrics such as sleep
score, Body Battery and training status, plus a weekly activity-trend view.
Cards can be added, removed and reordered.

### At a Glance

Up to twenty compact stats can be selected, with eight shown directly on Home.
Examples include HR, intensity minutes, steps, calories, stress, floors,
hydration, fitness age, HRV status, VO2 max, training load, acclimation and
endurance.

### Goal presets and navigation

Reset Home offers:

- Be healthy;
- Stay active;
- Track my training.

These choose an initial information emphasis without locking the user into it.
The bottom tab bar is also customizable with up to three user-selected entries.

Garmin's large/small two-tier card model is a useful precedent, but Body's
umbrella/variant/size system should avoid hard-coding only two densities.

## Body Battery

Body Battery is a continuous provider-derived energy estimate, generally
presented from 5–100. Garmin describes its inputs at a high level:

- heart rate;
- HRV;
- movement;
- physical activity intensity and duration;
- physiological stress during inactivity;
- rest;
- sleep and sleep pressure.

Behavior:

- activity and stress drain the value;
- restorative rest may slow draining or charge it;
- sleep is the largest charging opportunity;
- illness, alcohol and residual stress can inhibit overnight charge;
- naps can add charge;
- prolonged wakefulness creates homeostatic sleep pressure that continues to
  drain energy.

Garmin all-day stress is a related 0–100 measure:

- 0–25 resting;
- 26–50 low;
- 51–75 medium;
- 76–100 high.

Stress is generally not recorded during high physical activity and those
periods may appear Unmeasurable. Body Battery is not simply inverted stress:
sleep pressure, activity and restorative context also matter.

Product strength: the visualization can tell a day-long story of charge/drain
rather than only show one morning score. Product risk: the formula and unit are
proprietary, so Body cannot duplicate it honestly.

## Training Readiness

Training Readiness is continuously updated from 1–100:

- 1–24 Poor;
- 25–49 Low;
- 50–74 Moderate;
- 75–94 High;
- 95–100 Prime.

Documented contributors:

- last-night Sleep Score;
- Recovery Time;
- HRV Status;
- Acute Load;
- sleep history, documented in device manuals as the last three nights;
- stress history, last three days.

The largest update happens after waking when sleep, HRV and histories refresh.
During the day, workouts can raise Acute Load and Recovery Time, while the
countdown toward recovery can improve readiness.

Garmin explicitly distinguishes training readiness from race-day performance.
A poor pre-race night does not necessarily predict poor performance; the metric
is designed for sustainable training decisions over time.

This is a strong explanation pattern: define purpose, components, temporal
behavior and what the score does *not* mean.

## HRV Status

Garmin requires roughly three weeks of consistent sleep—at least four nights
per week during initial personalization—to establish a baseline. The baseline
then shifts gradually.

Balanced means the seven-day average HRV is within the personal baseline.
Garmin contextualizes an unbalanced status with recovery, workload, alcohol and
possible illness but does not claim one definitive cause.

Resetting a device can require rebuilding the baseline. Sync can be delayed
until sleep is ended and the device calculates its morning results. Body should
represent both `calculating` and `awaiting sync`, not a generic missing state.

## Training load

Garmin's current load family includes:

- Exercise Load per recorded activity/day;
- Acute Load over the recent period;
- Chronic Load;
- Load Ratio;
- Load Focus by aerobic/anaerobic contribution;
- an adaptive Acute Load optimal range.

### Acute Load

Each activity's impact is added immediately and gradually expires across the
following ten days. Garmin displays an adaptive optimal-range band influenced
by recent activity frequency and fitness.

### Load Ratio

Garmin compares acute and chronic load. Current device documentation/support
uses:

- below 0.8: Low;
- 0.8–1.5: Optimal;
- above the optimal band: High, with some newer manuals additionally
  distinguishing Very High at 2.0+.

The app offers graphs for acute, chronic, ratio and daily exercise load, with an
activity list linking sessions to their load.

### Training Status

Training Status connects load (effort) with changes in fitness. Documented
states include Peaking, Productive, Maintaining, Recovery and additional
device-dependent states such as Unproductive, Strained or Detraining.

Body must keep load, load balance, readiness and training status as distinct
concepts. Garmin's own product uses them for different questions.

## Recovery Time

Recovery Time is a countdown to expected full recovery from the most recent
activity. It depends on:

- strenuousness of the new activity;
- recovery time remaining before it;
- subsequent sleep quality;
- stress;
- daily physical activity.

This is dynamic, not a static “hours = workout load” lookup. Exact weighting is
proprietary.

## Sleep

Depending on device, Garmin records:

- bed/wake time;
- duration;
- Awake/restless moments;
- Light, Deep and REM;
- sleep score;
- overnight HR and HRV;
- respiration and breathing variations;
- Pulse Ox;
- skin temperature;
- stress;
- Body Battery change.

Garmin Sleep Score is 0–100 and considers duration, stage distribution and
evidence of autonomic recovery derived from HRV. Exact weights are not public.

Sleep Coach estimates sleep need using age, daily and longer-term activity,
recent sleep, naps and HRV. Newer compatible devices also expose sleep
alignment and seven-day consistency.

Practical gates include:

- optical HR active;
- watch worn at least two hours before bed;
- correct sleep schedule;
- Primary Wearable selection when multiple devices exist;
- feature availability by device.

## Physiological-performance suite

Garmin's competitive depth comes from keeping many specialist insights
separate:

- VO2 max;
- Training Effect;
- EPOC-based exercise load;
- heat/altitude acclimation;
- performance condition;
- lactate threshold;
- race predictions;
- real-time stamina;
- endurance score;
- hill score;
- running dynamics/economy/tolerance;
- recovery heart rate.

Endurance Score combines recorded HR activities with fitness and training
history to estimate sustained-performance capacity across sports. It shows
which activity types contributed most. Exact formula remains proprietary.

This is valuable research evidence for specialist umbrellas, not justification
to overload every general user's dashboard.

## Connect+ performance dashboard

In 2026 Garmin Connect+ added a premium performance dashboard for customizable
cross-metric graphs and correlations, for example:

- run history versus Sleep Score;
- Training Load versus resting HR.

This confirms demand for exploratory comparison, but correlation does not
establish causation. Body detail/history can offer cross-metric overlays without
auto-generating causal claims.

## Visualization grammar

- large In Focus cards and compact At a Glance cards;
- continuous day line for Body Battery and stress;
- score plus classification and component contributions;
- adaptive optimal-range bands;
- acute/chronic line comparisons;
- load-focus distributions;
- countdown for Recovery Time;
- sleep stage timeline and overnight vitals;
- activity lists under aggregate training graphs;
- event/coach/challenge modules separate from biometrics.

Garmin's best visualizations match temporal semantics: continuous resources are
lines, balance is a range, recovery is a countdown and contributors are linked
sessions.

## Strengths

- Deepest performance/training concept system among major ecosystems.
- Strong explanations of purpose and contributing factors.
- Continuous readiness updates rather than morning-only state.
- Clear calibration periods and temporal windows.
- Home customization supports both priority and compact metrics.
- Activity detail links into aggregate load/status.
- Broad device and sport ecosystem.

## Weaknesses and opportunities for Body

- Many overlapping scores create high cognitive load.
- Exact formulas are usually proprietary.
- Feature availability fragments heavily by device.
- Garmin Health API implementation remains partner-gated.
- New cross-metric dashboard is premium.
- Home customization still uses fixed In Focus/At a Glance card classes.
- Specialist athletic framing can dominate general wellbeing.

## Body product implications

Adopt:

- purpose-specific separation of load, recovery, readiness and status;
- component contributions and time-window explanations;
- dynamic day behavior for metrics that genuinely change intraday;
- calibration/missing/sync states;
- adaptive range visualizations;
- drill-down from aggregate to contributing activities;
- goal-based dashboard presets as onboarding, not restrictions.

Improve:

- a simpler conceptual vocabulary;
- source and formula version traceability;
- cross-provider compatibility rather than Garmin-device lock-in;
- free access to a person's own comparisons/history;
- Body's full widget variant and sizing language;
- balanced product coverage beyond performance sport.

Do not copy:

- proprietary Firstbeat/Garmin formulas or names;
- fixed score thresholds as universal physiology;
- screen-visible fields as proof of API access;
- causal interpretations from dashboard correlations;
- every specialist metric merely because Garmin exposes it.

## Open evidence and access tasks

- Obtain approved Garmin Health API access and licensed schema before connector
  implementation.
- Capture current mobile/web empty, partial and unsupported-device states.
- Verify all current Training Status states by compatible device generation.
- Record free versus Connect+ history/comparison limits by region.
- Scientific validation of EPOC load, acute/chronic ratios, sleep scoring,
  readiness inputs and recovery-time claims occurs in the science phase.
