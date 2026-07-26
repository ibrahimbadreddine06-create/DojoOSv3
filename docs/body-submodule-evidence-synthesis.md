# Body submodule evidence synthesis

Status: pre-umbrella evidence map  
Updated: 2026-07-25

## Purpose and ontology guard

This document combines the competitor passes into evidence per Body submodule.
It deliberately does **not** select widget umbrellas.

The hierarchy remains:

`Body submodule → widget umbrella → widget variant → supported size`

A widget umbrella is the actual widget concept. A metric, raw provider field,
calculation, input method, visualization type, workflow, correlation or
research theme is not automatically an umbrella. The dimensions below exist
to make later umbrella decisions informed rather than premature.

## Evidence dimensions used in every submodule

| Dimension | Question it answers |
|---|---|
| Observable data | What can actually be measured, imported or entered? |
| Derived interpretation | What can defensibly be calculated from it? |
| User job | What question or action does the person need supported? |
| Time model | Is it current, session, daily, rolling, cyclical or historical? |
| Provenance | Which source, device, entry path and confidence produced it? |
| Visualization | What real relationship or state must the visual communicate? |
| Interaction | What can be inspected, logged, corrected, planned or opened? |
| Missingness | What happens before enough data exists or when a source fails? |
| Risk | Which claims, populations, regions or permissions constrain it? |

These dimensions may later converge inside one umbrella. They must not become
an extra grouping layer above umbrellas.

## Hub

### Product role

The Hub is a cross-submodule overview, not a generic action center and not a
dump of duplicate specialist widgets. Its evidence problem is prioritization:
what matters now, what changed, what needs attention and where deeper context
lives.

### Evidence available

- Cross-domain products repeatedly separate current state, recent change,
  baseline and recommendation.
- Apple, Fitbit, Garmin, Oura, WHOOP, Bevel, Athlytic, Ultrahuman, Huawei and
  Zepp show that summary states can combine multiple physiological domains.
- Exist, Bearable and Heads Up Health show the value of cross-source context,
  correlations and provenance.
- Source conflicts, duplicate data and differing freshness are platform
  problems below the widget layer.

### Requirements before Hub umbrella selection

1. Decide which specialist signals deserve overview status and why.
2. Define whether the Hub uses the exact specialist widget, a Hub-tailored
   umbrella, or no Hub representation.
3. Preserve drill-through to the specialist detail page.
4. Never hide stale, missing or low-confidence inputs behind a confident score.
5. Avoid showing the same conclusion twice under different labels.

### Unresolved

- Priority/ranking policy across submodules.
- Conflict behavior when sources disagree.
- Whether any composite overview score is scientifically and product-wise
  justified.

## Activity

### Observable data families

- Daily movement and sedentary time.
- Recorded activities with type, start/end, duration and energy.
- Route, distance, speed/pace, elevation and location where applicable.
- Heart rate, zones, cadence, power and device-specific performance signals.
- Strength execution: exercise, set, repetition, load, rest and completion.
- Planned workout or program structure.
- Subjective effort, feedback, soreness and readiness inputs.

### Derived interpretation families

- Personal records, estimated strength and progression.
- Session intensity/load and rolling training load.
- Fitness, fatigue, form/readiness and recommended load bands.
- Training consistency, distribution and goal progress.
- Route or segment performance and predicted performance.

These are research families, not umbrella names.

### User jobs evidenced

- Understand how much movement or training happened.
- Execute the correct next session with minimal friction.
- Inspect the quality and intensity of a completed session.
- See whether load and recovery are balanced over time.
- Understand progression in a specific activity or movement.
- Discover, plan and navigate a route.

### Product patterns

- Strength products separate program, live execution, exercise history and
  progression.
- Running/cycling products separate route context, live session metrics,
  completed result and longer-term fitness.
- TrainingPeaks, COROS, Garmin, Polar, WHOOP and related products compare
  short-term work with longer-term capacity.
- Gentler Streak and COROS demonstrate a personalized target band rather than
  “higher is always better”.
- Freeletics, Fitbod, Runna and similar products use feedback to adapt what
  comes next.

### Risks and open evidence

- Load models and estimated performance are not interchangeable across sports.
- Calories and optical heart-rate accuracy vary by device and activity.
- Route/location data needs heightened privacy controls.
- Proprietary recovery and readiness formulas need independent justification.
- Exercise libraries, user-created activities and imported sessions need a
  unified but provenance-aware model.

## Nutrition

### Observable data families

- Food, beverage, meal, serving and time.
- Energy, macro- and micronutrients.
- Water and other intake.
- Body weight and composition where connected.
- Meal images, barcode/label scans, voice/text entries and manual corrections.
- Fasting windows, symptoms or glucose response where the product supports
  them.

### Derived interpretation families

- Intake versus a target or range.
- Nutrient adequacy, distribution and trends.
- Energy expenditure/intake trend estimates.
- Weight trend and adaptive expenditure/goal models.
- Meal quality or categorization systems.
- Fasting state and adherence.

Again, none of these automatically defines an umbrella.

### User jobs evidenced

- Log intake with as little friction as possible.
- Know what has been consumed and what remains for the day.
- Understand nutritional quality beyond calories.
- Observe progress toward a body-weight or composition goal.
- Plan meals and shopping when the user wants planning support.
- Relate intake to symptoms, glucose or other outcomes without claiming
  causality.

### Product patterns

- Cronometer emphasizes nutrient completeness and source quality.
- MacroFactor separates logged intake, scale trend, inferred expenditure and
  coached target updates.
- Mainstream trackers combine diary, daily budget and progress reports.
- Photo/voice AI products reduce friction but introduce estimation confidence
  and correction requirements.
- Ate uses a visual journal and reflection rather than nutrient precision as
  the only product model.
- ZOE and symptom-oriented tools connect food with individual response but
  require strong evidence and clear scope.

### Risks and open evidence

- Image-based portions are estimates and require editable confidence-aware
  results.
- Food databases contain regional, branded and user-generated quality
  differences.
- Energy targets depend on personal data and assumptions.
- Clinical diets, eating disorders, pregnancy and age-specific use require
  careful safety boundaries.
- “Good/bad” food classifications can be reductive; their purpose and limits
  must be explicit.

## Rest & Recovery

### Observable data families

- Sleep interval, duration, timing and regularity.
- Sleep-stage estimates, awakenings and sleep continuity.
- Resting heart rate, HRV, respiratory rate, temperature and oxygen-related
  signals where supported.
- Naps, rest periods and environmental signals.
- Subjective sleep quality, fatigue, soreness, stress and readiness.
- Recent activity/training load.

### Derived interpretation families

- Sleep quality/score and contributing factors.
- Sleep need, debt, consistency and schedule alignment.
- Recovery/readiness and its contributing signals.
- Circadian timing or energy trajectory.
- Recovery time after training.

### User jobs evidenced

- Understand last night without reading a raw sensor dump.
- Distinguish sleep amount, sleep timing and sleep quality.
- Know which inputs drove a recovery interpretation.
- See whether current fatigue comes from sleep, strain or another factor.
- Decide how hard to train or when to rest, without presenting wellness
  guidance as diagnosis.

### Product patterns

- Oura, WHOOP, Garmin, Fitbit, Polar, RISE and Eight Sleep expose different
  relationships between sleep, strain and readiness.
- Athlytic distinguishes a relatively fixed morning recovery state from a
  changing daily battery.
- RISE centers sleep debt and predicted energy schedule.
- Sleep Cycle and Pillow make sleep report/score the main summary.
- Bearable demonstrates the value of subjective factors beside device data.

### Risks and open evidence

- Consumer sleep stages are estimates, not polysomnography.
- Baseline length, missing nights and late-arriving data materially change
  interpretation.
- Different vendors define readiness and recovery differently.
- Respiratory, oxygen and temperature anomalies can become medical-adjacent;
  claims and escalation language require review.

## Hygiene & Looks

### Observable data families

- User-defined routines, steps, schedules and completion.
- Menstrual-cycle dates, symptoms, temperature and test inputs where relevant.
- Skin observations, standardized photos, products and reactions.
- Hair, oral care, grooming, body care and other user-defined observations.
- Mood, symptoms, habits and environmental/contextual factors.

### Derived interpretation families

- Adherence and consistency against the user's own target.
- Cycle estimates and fertile-window predictions with uncertainty.
- Change over time from comparable images or repeated observations.
- Personal associations between routine/product/context and outcomes.

### User jobs evidenced

- Build and complete routines without assuming one universal routine.
- Track a personally relevant concern or condition.
- See change over time under comparable conditions.
- Understand possible associations without turning them into diagnoses.
- Add a custom practice, observation or goal when the catalogue does not fit.

### Product patterns

- Clue, Flo, Natural Cycles, Spot On, Glow and Ovia demonstrate that cycle
  tracking combines entries, prediction, uncertainty and life-stage context.
- TroveSkin, Miiskin, MDacne, Skin Bliss and FeelinMySkin combine imagery,
  routine/product context and progress, with very different evidence levels.
- Routinery, Finch, Streaks and Habitify show completion and routine-building
  patterns.
- Daylio and Bearable show flexible self-report and personal pattern finding.

### Risks and open evidence

- The submodule must remain customizable; a fixed “ideal” routine cannot cover
  personal, cultural, financial and access differences.
- Menstrual and fertility data is highly sensitive and predictions need clear
  uncertainty and mode-specific claims.
- Photo comparison requires consistent capture conditions and strong privacy.
- Skin or condition classification can cross into medical-device/diagnostic
  territory.
- Gender-, age- and life-stage-relevant behavior belongs in eligibility and
  model logic, not careless visual stereotyping.

## Platform-wide evidence requirements before any final umbrella is approved

1. **Provenance:** provider, device, manual/imported origin and timestamp.
2. **Freshness:** current, delayed, partial and stale states.
3. **Missingness:** no data, insufficient history, unavailable permission and
   unsupported device are distinct.
4. **Deduplication:** overlapping providers need deterministic priority rules.
5. **Correction:** manual and AI-derived entries must be editable.
6. **Confidence:** estimated and directly measured values cannot look
   identical when that difference matters.
7. **Population fit:** age, sex, pregnancy/life stage, medication and relevant
   exclusions must be handled where calculations depend on them.
8. **Claims:** wellness interpretation, medical-adjacent detection and
   regulated functionality are reviewed separately.
9. **History:** a widget summary must open a detail surface with provenance,
   history, explanation and contributing data where relevant.
10. **E language:** every production widget follows the locked E contract while
    retaining the primary freedom rule: **ALLES KAN**.

## Research saturation and next gate

Tier A reconstructs the main market models. Tier B captures distinctive
capabilities. Tier C tests for missed patterns and niches. The first breadth
pass is complete only when every named Tier C product has an explicit scan or
documented deferral.

After that, umbrella selection proceeds **one Body submodule and one candidate
at a time**:

1. state the user question;
2. show the supporting evidence dimensions;
3. prove it is an actual widget concept rather than a metric or grouping layer;
4. identify what the `1×1` must communicate;
5. only then explore variants and supported sizes.

