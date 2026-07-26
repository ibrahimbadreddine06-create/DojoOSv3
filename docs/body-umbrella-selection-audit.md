# Body umbrella selection audit

Status: first cross-submodule audit  
Updated: 2026-07-25

> Historical pre-functional audit. Use `body-widget-catalogue-v2.md` and
> `body-functional-widget-gate.md` for the current product selection.

## Scope

The five selection files contain 53 research-selected widget umbrellas:

| Submodule | Count | Source |
|---|---:|---|
| Hub | 8 | `body-hub-umbrella-selection.md` |
| Activity | 12 | `body-activity-umbrella-selection.md` |
| Nutrition | 10 | `body-nutrition-umbrella-selection.md` |
| Rest & Recovery | 15 | `body-rest-recovery-umbrella-selection.md` |
| Hygiene & Looks | 8 | `body-hygiene-looks-umbrella-selection.md` |

Every entry is directly under a submodule. No “group of umbrellas” is present.

## Ontology audit

### Passed

- No selected entry is merely a provider name.
- No selected entry is merely a visualization type.
- No selected entry exists only as a backend calculation.
- No selected entry contains a child catalogue of widgets.
- Every selected entry can be installed as a recognizable widget.
- Every selected entry can provide a useful `1×1` answer or action.
- Page-tailored rendering reuses the umbrella rather than cloning its identity.

### Explicitly rejected grouping labels

- Daily Movement
- Performance Specialist
- Today Intake
- Food Pattern
- Metabolic Observations
- Sleep Pattern
- Recovery Signals
- Body Signals
- Vitals
- Cross-domain Measurements

The concepts behind these labels remain usable as research/drawer language, but
they cannot sit in the product hierarchy.

## Overlap audit

Overlap is allowed when the widget question remains distinct.

| Pair | Why both can exist |
|---|---|
| Steps / Distance | count versus travelled distance; modalities differ |
| Steps / Active Minutes | ambulatory count versus classified time/intensity |
| Calories / Macronutrients | energy total versus nutrient composition |
| Last Sleep / Sleep Duration | session summary versus focused duration/trend |
| Last Sleep / Sleep Stages | resolved session summary versus provider stage estimate |
| Recovery / HRV | derived/provider state versus one underlying observation |
| Heart Rate / Resting Heart Rate | broad/contextual series versus standardized resting result |
| Weight / Body Composition | mass observation versus estimated composition |
| Routines / Routine Consistency | execution today versus longitudinal adherence |
| Skin Progress / Appearance Progress | skin-specific comparable observation versus user-defined non-skin appearance |
| Today / specialist widgets | scarce cross-domain orientation versus full specialist answer |
| Body Timeline / Recent Activities | all Body events versus activity-session recall |

None of these pairs should duplicate the same renderer and merely change its
title. Their variants need to answer the distinct question.

## Homogeneity audit

### Must share canonical logic when meaning matches

- source/time normalization;
- unit conversion;
- non-overlapping aggregation;
- deduplication;
- timezone/day boundary;
- freshness and missingness;
- robust same-source trend;
- tooltip/detail provenance.

### May deliberately diverge

- provider-owned recovery/readiness methods;
- provider activity-intensity classifications;
- HR-zone models;
- sleep-need/debt models;
- calorie or nutrient targets for different purposes/populations;
- strength progression/e1RM models;
- cycle projections;
- image/observation comparison methods.

The divergence must carry a named method/source and cannot accidentally look
like the same metric.

## Production disposition audit

### Broadly production-observable after connector/state work

Steps, Active Minutes, Sedentary Time, Distance, Active Energy, Floors Climbed,
Recent Activities, Heart Rate Zones, Cardio Fitness, Strength Progress,
Calories, Macronutrients, Fiber, Micronutrients, Water Intake, Recent Meals,
Caffeine, Alcohol, Supplements, Fasting, Last Sleep, Sleep Duration, Sleep
Schedule, Sleep Stages, Sleep Efficiency, Recovery, HRV, Resting Heart Rate,
Respiratory Rate, Skin Temperature, Blood Oxygen, Physiological Stress,
Perceived Stress, Naps, Routines, Routine Consistency, Cycle, Skin Progress,
Appearance Progress, Products, Symptoms, Custom Tracker, Body Timeline, Data
Coverage, Heart Rate, Weight, Body Composition, Blood Pressure and Blood
Glucose.

“Production-observable” does not mean every interpretation or provider is
ready. Each still needs its exact states, variants, sizes and detail contract.

### Additional calculation/research gate

- Training Load: selected method/source per instance.
- Sleep Debt: no generic Body model ships without validated need/window logic.
- Today: inclusion/ranking policy and explanation must be validated.
- Skin/Appearance Progress: comparison and privacy contract.
- Cycle: prediction method, eligibility and regulatory wording.
- Blood Pressure/Blood Glucose: medical-adjacent content and source eligibility.

### Action integration gate

- Next Workout: planner/session execution contract.
- Routines: routine execution and planner link.
- Supplements: schedule/completion versus clinical medication boundary.

## Missingness gate for every umbrella

Each umbrella must design and test:

1. no history yet;
2. insufficient history;
3. permission denied;
4. source unsupported;
5. device not worn;
6. source not synced/stale;
7. partial coverage;
8. conflicting/duplicate sources;
9. provider result unavailable while raw observations exist;
10. manual alternative available or genuinely impossible.

## Next production sequence

The catalogue itself is not enough. The next pass begins with `Steps` and moves
through one umbrella at a time:

1. exact information contract;
2. provider/manual data paths;
3. calculation/disposition;
4. states and detail/history behavior;
5. purposeful variants;
6. supported sizes;
7. E-design compositions;
8. implementation and tests.
