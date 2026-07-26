# Samsung Health — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Samsung Health, Galaxy Watch/Ring and Samsung Health Data SDK

## Evidence boundary

Samsung's catalogue varies by hardware, phone, OS, country, age and regulatory
approval. Product support, newsroom science explanations and developer data
types are kept distinct. Exact accessible fields are recorded in
[`samsung-health-data-sdk.md`](../body-provider-inventory/samsung-health-data-sdk.md).

Primary sources:

- Samsung Health product:
  https://www.samsung.com/us/apps/samsung-health/
- Tracker catalogue:
  https://www.samsung.com/us/support/answer/ANS10001351/
- Sleep and coaching:
  https://www.samsung.com/us/support/answer/ANS10003657/
- Energy Score research:
  https://news.samsung.com/global/samsung-collaborates-with-the-university-of-georgia-to-define-and-measure-energy-for-innovative-digital-health-experiences
- Energy Score developer type:
  https://developer.samsung.com/health/data/api-reference/-shd/com.samsung.android.sdk.health.data.request/-data-type/-energy-score-type/index.html

## Product architecture and breadth

Samsung Health is a broad tracker platform rather than one narrow loop. Its
editable tracker surface spans:

- steps, activity, workouts and history;
- sleep and coaching;
- heart rate, stress, SpO2 and temperature;
- weight and body composition;
- food and water;
- medications and health records;
- blood glucose and blood pressure;
- cycle tracking;
- community challenges.

Manual tracking remains available for many domains and more than 90 exercises.
This breadth is strategically close to Body, though Samsung's depth varies
widely by tracker.

## Energy Score

Energy Score is a daily readiness estimate for the upcoming day. Samsung
documents these input families:

- previous-day physical activity relative to usual activity;
- average sleep duration over seven days;
- sleep/wake consistency;
- sleep latency;
- sleeping heart rate;
- sleeping HRV;
- age and sex-dependent weighting.

Samsung describes seven contributing factors and frames the model as “overall
capacity.” Activity uses acute-versus-chronic workload logic; sleep uses an
energy-reservoir/circadian model. The score requires synced compatible Galaxy
Watch or Ring activity, sleep and sleeping-HR data.

The developer SDK exposes an Energy Score data type with consent, but the
proprietary calculation itself is not open.

## Sleep

Samsung's sleep experience includes:

- sleep time and score;
- Light, Deep and REM;
- sleep consistency;
- blood oxygen;
- skin-temperature trends;
- snore detection using the nearby phone;
- Sleep Apnea screening on approved device/region combinations;
- bedtime guidance;
- Sleep Coaching.

Sleep Coaching requires at least seven nights, assigns a sleep-animal pattern
and creates a four-to-five-week program with missions, checklists, education,
meditation and reports. The metaphor may aid recall but is product trade dress,
not a model Body should copy.

## Activity and body composition

Samsung combines automatic/watch workouts, manual exercise, personalized HR
zones, routines and device-specific running/cycling features. Compatible
watches estimate body composition through BIA; results include weight/body
composition trends and depend strongly on measurement protocol.

The broad intake/activity trackers make Samsung useful for domain completeness,
but not every user has the sensor required for each field.

## Heart, metabolic and regulated features

Depending on device/market:

- continuous/spot HR and alerts;
- ECG and irregular-rhythm notifications;
- blood pressure;
- sleep-apnea risk detection;
- blood glucose logging/integrations;
- AGEs Index;
- Antioxidant Index;
- vascular-load/heart-health experiences.

Antioxidant Index is presented as a 0–100 optical estimate of skin carotenoids.
AGEs is presented as a metabolic/lifestyle indicator. Both require careful
scientific and hardware validation before Body treats them as portable metrics.

## Visual grammar

- editable tracker cards;
- score plus contributing factors and tips;
- stage/timing sleep graphs;
- exercise route, zones and lap/session details;
- body-composition breakdown and trends;
- goal progress rings/bars;
- health-monitor results separated from general wellness;
- coaching programs as task sequences.

## Strengths

- Broadest single-app domain coverage in this competitor set.
- Strong wearable/phone ecosystem integration.
- Manual and sensor-fed trackers coexist.
- Energy Score inputs are explained at useful conceptual depth.
- Regulatory gates are stated for medical-adjacent features.
- No separate subscription for many Galaxy experiences.

## Weaknesses and Body opportunities

- Device/phone/region fragmentation is high.
- Tracker depth and visual consistency vary.
- Galaxy lock-in limits cross-provider usefulness.
- Several advanced signals are proprietary or hardware-specific.
- Broad catalogue risks becoming a card drawer rather than a coherent system.

Body should adopt the breadth, manual fallback and permissioned data-type
model, but add explicit provenance, provider neutrality, stronger domain
coherence and a consistent umbrella/variant/detail language. It must not imply
regulated availability or transplant proprietary Energy Score logic.

## Open evidence tasks

- Build a current device/region/age compatibility table before launch.
- Confirm Samsung Health Data SDK versus Health Connect field precedence.
- Validate BIA, sleep stages, Energy Score, AGEs and antioxidant claims.
- Capture unavailable, permission-denied and unsupported-device states.

