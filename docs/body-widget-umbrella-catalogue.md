# Body widget umbrella catalogue

Status: **INVALIDATED — do not use for product or implementation decisions**  
Updated: 2026-07-25

> This catalogue was derived before the planned competitor research was
> complete and introduced an incorrect grouping layer above actual widget
> umbrellas. It is retained only as an audit trail. A replacement must be
> rebuilt from the verified research with the correct model:
> Body submodule → widget umbrella → widget variant → supported size.

An umbrella is a product concept, not one card. It can contain any number of
widget variants and each variant can support purposefully chosen sizes.
Everything can exist inside an element slot; this catalogue only decides which
user questions deserve a maintained product family.

## Status vocabulary

- **Core**: initial default/drawer candidate with broad value.
- **Optional**: production-ready but opt-in or page-specific.
- **Conditional**: appears only with eligible data/profile/device/consent.
- **Advanced**: specialist value; not part of the general default.
- **Action**: primarily enables execution rather than reporting a KPI.
- **Deferred**: valid concept, but evidence/product definition is not ready.

Status does not forbid future umbrellas.

## Hub umbrellas

### `hub.body_today` — Core

**Question:** What across my body deserves attention today?

Dynamic cross-domain overview that ranks a small number of explainable,
eligible items. It is not an overall score and does not require every domain to
contribute every day.

Possible information: current recovery provider result, last sleep, meaningful
signal change, recent load, intake coverage, due routine and data-quality issue.
Its detail targets the source umbrella for each item.

### `hub.daily_timeline` — Optional

**Question:** What body-relevant events happened or are expected today?

Chronological composition of sleep boundary, activities, meals, check-ins,
routines, measurements and linked planner blocks. Entries remain canonical
events; this umbrella provides temporal composition.

### `hub.body_signals` — Conditional

**Question:** Which qualified physiological signals differ from my established
same-source baseline?

RHR, HRV, respiratory rate, temperature, SpO2 or other eligible signals. It
requires valid coverage and never attributes a cause.

### `hub.data_coverage` — Conditional

**Question:** Can I trust today's Body picture, and what is missing?

Shows wearable coverage, last sync, permissions, calibration and conflicts.
This becomes visible when data quality materially affects interpretation.

### `hub.quick_capture` — Action

**Question:** What context or missing observation do I want to record now?

Context-sensitive access to check-in, meal, water, symptom, activity, routine or
measurement capture. It is an action widget, not a generic “log everything”
button in the page header.

## Activity umbrellas

### `activity.daily_movement` — Core

**Question:** How much incidental and intentional movement have I recorded
today?

Steps/pushes, distance, active duration and coverage, with user-selected
emphasis. It distinguishes observations from goals.

### `activity.movement_pattern` — Optional

**Question:** When was I moving or inactive across the day/week?

Time distribution, inactivity events and daily rhythm. Device-classified
sedentary time is explicitly labelled.

### `activity.recent_sessions` — Core

**Question:** What activities did I perform recently?

Resolved session list/timeline with type, duration, load/performance summary and
source. It links to authoritative session detail.

### `activity.session_performance` — Core

**Question:** What happened inside one selected workout?

Variant family for route, pace/speed, HR, power, elevation, splits, zones and
sport-specific traces. The selected sport and available data determine the
composition.

### `activity.training_load` — Core for trained users; Optional otherwise

**Question:** How is recent training load developing relative to my own longer
history?

Transparent short/long trajectories, sessions and modality. It does not predict
injury or use a universal safe ACWR zone.

### `activity.perceived_load` — Optional/manual fallback

**Question:** How demanding did my sessions feel when sensor load is absent or
incomplete?

sRPE and subjective exertion history with transparent arbitrary units.

### `activity.cardio_fitness` — Conditional

**Question:** How is my measured or provider-estimated aerobic fitness changing?

VO2 max/cardio fitness remains labelled measured or estimated and source-bound.

### `activity.heart_rate_zones` — Optional

**Question:** How was my exercise time distributed under my selected HR-zone
model?

The model, thresholds and data coverage are part of the widget.

### `activity.strength_progress` — Core for strength users

**Question:** How is my performance changing for the exercises and movements I
care about?

Sets, reps, loads, RIR/RPE, personal bests and exercise-specific trends. It
avoids a fake universal muscular score.

### `activity.mobility` — Conditional

**Question:** How are my walking, wheelchair or mobility measurements changing?

Uses eligible provider observations such as speed, step length, asymmetry,
double support, pushes or gait steadiness. It is not a diagnosis/fall forecast.

### `activity.plan_and_execute` — Action

**Question:** What activity is planned, and can I start or complete it?

Links Body to the planner without making the Activity page a duplicate planner.
Supports workout execution and post-session capture.

### `activity.performance_specialist` — Advanced

**Question:** Which sport-specific performance signal deserves focused
monitoring?

An extensible family for power, running dynamics, swim metrics, race progress,
thresholds and similar specialist concepts. Each child concept needs its own
semantic/evidence specification.

## Nutrition umbrellas

### `nutrition.today_intake` — Core

**Question:** What have I logged as entering my body today, and how complete is
the record?

Meals, drinks, supplements and coverage. It never calls an incomplete log a
complete diet.

### `nutrition.meal_timeline` — Core

**Question:** What did I eat or drink, and when?

Chronological meals/snacks/drinks with direct edit/reuse/detail actions.

### `nutrition.macronutrients` — Optional

**Question:** What logged energy and macronutrient quantities compose the
selected period?

Energy, protein, carbohydrate, fat and fibre with database/coverage provenance.

### `nutrition.nutrient_adequacy` — Optional

**Question:** How does sufficiently logged intake compare with applicable,
explicit reference values?

Uses exact EFSA/WHO reference type and population. Unknown is not zero.

### `nutrition.food_pattern` — Optional

**Question:** What recurring timing, diversity or food-group pattern is visible
without reducing my diet to one opaque score?

Transparent dimensions such as meal timing, fruit/vegetable, fibre, diversity
and repeated logged patterns.

### `nutrition.hydration_intake` — Core

**Question:** How much plain water/total fluid did I log relative to my chosen
reference?

It is intake tracking, not a hydration-status diagnosis.

### `nutrition.caffeine_alcohol` — Optional/sensitive

**Question:** What caffeine or alcohol did I log, and when?

Supports timing and amount history. Cross-domain associations remain
experimental and non-causal.

### `nutrition.metabolic_observations` — Conditional

**Question:** What did my glucose, ketone or other eligible metabolic source
record?

Source/intended-use specific. Meal linking is observational.

### `nutrition.body_trend` — Optional

**Question:** How are measured weight and source-consistent composition trends
changing?

Raw measurements plus honest smoothing/uncertainty. BIA stays estimated.

### `nutrition.capture` — Action

**Question:** How can I record intake quickly without sacrificing provenance?

Search, barcode, recipe, recent meal, manual food, drink and incomplete-day
actions.

## Rest & Recovery umbrellas

### `rest.last_sleep` — Core

**Question:** What happened during my latest main sleep?

Duration/timing, efficiency, interruptions and source. Stages can appear as
provider estimates but do not define the entire result.

### `rest.sleep_pattern` — Core

**Question:** How are sleep duration, timing and regularity evolving?

Longitudinal view with naps, travel/shift context and valid-night coverage.

### `rest.sleep_architecture` — Optional

**Question:** What stage pattern did my provider estimate during the night?

Provider-stage timeline and trends with explicit non-PSG status.

### `rest.overnight_signals` — Optional

**Question:** How did HR/RHR, HRV, respiratory rate, temperature and SpO2 behave
overnight?

Multiple signals can be composed without turning them into a Body recovery
score.

### `rest.provider_recovery` — Conditional/Core when available

**Question:** What recovery/readiness result did my chosen provider calculate,
and which contributors did it expose?

Namespaced provider result. Multiple providers are never averaged.

### `rest.recovery_signals` — Core/manual-compatible

**Question:** What objective and subjective recovery observations are changing?

Same-source RHR/HRV/RR/temp plus fatigue, soreness, pain or readiness check-in.
It remains component-based.

### `rest.physiological_stress` — Conditional

**Question:** What physiological activation did my provider estimate across the
day?

Provider result and timeline, separate from perceived stress.

### `rest.perceived_stress_mood` — Optional

**Question:** How have I reported stress, mood, fatigue or calm?

Self-report history using a stable instrument/scale.

### `rest.restoration` — Optional/Action

**Question:** What restorative actions did I perform and how did I report their
immediate effect?

Mindfulness, breathing, nap, rest and active-recovery sessions. Pre/post
observations do not prove long-term efficacy.

### `rest.sleep_plan` — Action

**Question:** What sleep schedule/goal is planned, and what should I do next?

Connects provider bedtime guidance or user schedule with planner/routine
execution.

## Hygiene & Looks umbrellas

### `hygiene.routines_today` — Core

**Question:** Which self-care routines are due, complete, partial or skipped?

Fully user-customizable. Any routine/step can exist; evidence-labelled
templates are optional.

### `hygiene.routine_consistency` — Core

**Question:** How consistently am I executing the routine I chose?

Transparent schedule adherence without a fake habit-formation date.

### `hygiene.oral_care` — Optional template family

**Question:** What oral-care routine did I intend and record?

Evidence-based default template plus dentist/user customization.

### `hygiene.skin_and_sun` — Optional template family

**Question:** What skin/sun-care routine and product context did I record?

Supports user-defined steps, SPF/context and neutral observations without
diagnosis.

### `hygiene.hair_grooming` — Optional

**Question:** What hair/grooming maintenance is due and how is the user-observed
result changing?

Everything is configurable; no attractiveness score.

### `hygiene.appearance_observation` — Optional/sensitive

**Question:** What private appearance or condition observation did I record,
under comparable capture conditions?

Notes, ratings and photos. No medical image diagnosis.

### `hygiene.products` — Optional

**Question:** Which products/tools did I use and how did I report tolerance or
response?

Supports patch-test/allergy/context recording without causal efficacy claims.

### `hygiene.cycle` — Conditional/sensitive

**Question:** What menstrual events, symptoms and estimate windows are relevant
now?

Logged events are separate from provider predictions. Fertility estimates are
not contraception.

### `hygiene.custom_observation` — Optional

**Question:** What self-defined symptom, condition or care outcome do I want to
track?

Open schema and neutral history. Everything can be recorded; interpretation
requires separate evidence.

### `hygiene.routine_builder` — Action

**Question:** How can I create or adapt a self-care routine that fits my actual
life?

Builds schedule, steps, reminders, products and planner/goal links.

## Cross-domain measurement umbrellas

These can be placed on the page most meaningful to the user.

### `measurements.vitals` — Conditional

**Question:** What validated or provider-recorded vital measurements need
history or follow-up?

Blood pressure, HR, temperature, SpO2 and other eligible measurements, each
with intended-use and protocol context.

### `measurements.body` — Optional

**Question:** What anthropometric/body measurements were recorded?

Weight, BMI screening ratio, circumferences and provider-estimated composition.

### `measurements.clinical` — Conditional/sensitive

**Question:** What clinical record or lab result did an authorized source
provide?

Preserves issuer/coding/status and routes to a separate clinical-detail
experience.

### `measurements.medication` — Conditional/sensitive/Action

**Question:** What medication/supplement intake was planned or logged?

No prescription advice; supports provenance, schedule and adherence history.

## Catalogue invariants

1. Umbrellas exist because their questions differ, not because a chart type is
   available.
2. A ring, line, bar, number, timeline, map, composition or unique visual is a
   variant choice—not an umbrella.
3. Every umbrella must offer a meaningful 1×1 variant; larger sizes preserve
   its essential information and may add justified context.
4. Intermediate supported sizes cannot be skipped during drag-resize.
5. Provider-only results remain named and sourced.
6. Manual fallback is first-class where meaningful, but does not impersonate a
   sensor.
7. Missing/unsupported states are designed with the umbrella.
8. The drawer preview renders the actual 1×1 component.
9. Any element may occupy an element slot; top fixed elements follow the
   selected E design language.
10. The catalogue is extensible: everything can be added when it has purpose,
    meaning, evidence disposition and privacy behavior.
