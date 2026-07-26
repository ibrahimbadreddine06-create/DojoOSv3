# Body information universe

Status: complete candidate universe before widget selection  
Updated: 2026-07-25  
Scope: information Body can legitimately ingest, calculate, contextualize or
let the user record

This is not the widget catalogue. Inclusion means “a legitimate candidate
exists,” not “it must appear on a dashboard.” Selection occurs later.

## Organizing principle

- **Hub** answers: what deserves attention across the body right now?
- **Activity** answers: what work/output did the body perform and tolerate?
- **Nutrition** answers: what entered the body and how complete/balanced was
  the recorded intake?
- **Rest & Recovery** answers: what restored or strained the body, and how is
  recovery evolving?
- **Hygiene & Looks** answers: what self-care was intended/performed and what
  user-observed changes occurred?

The same underlying record may support multiple page-specific questions. That
does not make the same widget appropriate on every page.

## Universal information layers

Every page can use these non-domain layers:

1. source, device and recording method;
2. last sync and covered period;
3. permissions and connection health;
4. valid-wear/data completeness;
5. measured, estimated, logged or calculated status;
6. baseline/calibration progress;
7. missing reason;
8. personal goal/reference;
9. confidence/uncertainty;
10. detail/history link;
11. manually corrected versus original value;
12. provider/formula version.

These are product information, not decorative metadata.

## Hub universe

The hub is a selective overview, not a second copy of every specialist page.

### Cross-domain current state

- current provider readiness/recovery result;
- sleep duration/timing summary from the latest main sleep;
- recent activity/load relative to personal history;
- current movement/steps progress;
- current logged intake coverage;
- current hydration logging coverage;
- current physiological stress provider result;
- significant same-source RHR/HRV/RR/temperature deviations;
- time-sensitive menstrual/cycle context when opted in;
- self-care routines due/overdue today;
- active medication or measurement reminders when explicitly configured;
- device/sync/coverage issue that makes another insight unreliable.

### Prioritized attention

- one or more explainable changes that pass data-quality and evidence gates;
- recovery-versus-planned-output tension;
- unusually low data coverage;
- repeated short sleep or irregular timing;
- recent load substantially different from the person's descriptive baseline;
- repeated missed user-selected routine or intake goal;
- measurement requiring confirmation under a proper protocol;
- explicit provider alert under its permitted wording.

No opaque “overall health score” is required. The hub can rank explainable
cards without pretending unlike domains belong on one scale.

### Cross-domain history

- daily/weekly body timeline;
- selected domain trajectories;
- user-added context/tags;
- source changes and coverage breaks;
- correlations only in the experimental, uncertainty-labelled analysis layer.

## Activity universe

Activity means body output: intentional exercise and incidental physical work.

### Daily movement and mobility

- steps and wheelchair pushes;
- distance;
- active duration by explicit method/intensity;
- sedentary/inactivity classification;
- move reminders/inactivity events;
- floors and elevation gain;
- walking speed;
- step length;
- walking asymmetry;
- double-support time;
- stair ascent/descent speed;
- six-minute walk distance;
- gait steadiness;
- fall events under the provider's intended use;
- coverage/non-wear during the day.

### Exercise session identity

- activity/sport type, including unknown and user-created;
- start/end, elapsed/moving duration;
- route and privacy state;
- distance/elevation;
- indoor/outdoor;
- planned versus unplanned;
- linked planner block/goal;
- source/device;
- manual edits;
- notes, perceived exertion and symptoms;
- gear/equipment.

### Session performance

- pace/speed and distributions;
- splits, laps and segments;
- HR series, average, peak and recovery;
- time in explicitly defined HR zones;
- power, normalized/provider power and zones where available;
- cadence, stride, ground contact and vertical metrics where available;
- torque/resistance/incline;
- swim lengths, strokes, style and SWOLF-like provider results;
- cycling dynamics;
- running dynamics;
- GPS/elevation trace and data quality;
- calories as provider estimates;
- sport-specific records and personal comparisons.

### Strength and muscular work

- exercise identity and target regions;
- sets, reps and load;
- bodyweight/assistance;
- duration/isometric time;
- range/tempo when entered or measured;
- RIR/RPE;
- personal bests;
- total volume as a transparent arithmetic summary;
- exercise-specific progression;
- soreness/fatigue check-in;
- provider muscular-load result where available.

No single universal muscular-work score is assumed.

### Training load and development

- sRPE session load;
- provider Cardio/Training/Exercise Load;
- separate short- and long-window load trajectories;
- descriptive relation to personal history;
- training frequency and volume;
- intensity distribution;
- sport/modality distribution;
- monotony/consistency only after exact specification;
- provider Training Status/Load Focus;
- recovery-time provider estimate;
- VO2 max estimate/source;
- pace/power/HR performance trends;
- race/event plan and progress;
- missed/completed planned sessions.

### Activity actions

- start/record an activity;
- add or correct a session;
- build/select a workout;
- execute sets/intervals;
- rate exertion and add context;
- connect/import a source;
- resolve duplicates;
- review session detail/history.

## Nutrition universe

Nutrition means intake, not merely calories.

### Logged intake identity

- meal/snack/drink timestamp and type;
- food, recipe and ingredient identity;
- amount, serving and preparation;
- barcode/database/manual source;
- photo/note as unstructured support;
- confidence in portion;
- logged-day coverage and known missing meals;
- supplements, caffeine and alcohol;
- medication as a separate sensitive intake record.

### Nutrient quantities

- logged energy;
- protein;
- carbohydrate;
- total, saturated, unsaturated and trans fats where database supports them;
- fibre;
- total and free/added sugar only when source semantics support distinction;
- sodium and salt conversion;
- potassium;
- cholesterol;
- vitamins;
- minerals;
- water from drinks/foods where known;
- alcohol grams/standard units with jurisdictional semantics;
- caffeine.

Unknown is not zero. Database absence, unlogged intake and true zero are
distinct.

### Intake patterns

- meal timing and spacing;
- eating window;
- regularity;
- distribution of protein/energy across meals;
- food-group diversity;
- fruit/vegetable quantity;
- whole-grain/pulse representation;
- logged nutrient adequacy/reference comparisons;
- repeated excess/shortfall under an applicable guideline;
- subjective hunger/fullness/energy;
- intake around exercise;
- symptom/food context without causal attribution.

### Hydration

- plain water logged;
- total beverages;
- food-water estimate;
- caffeine/alcohol context;
- exercise fluid intake;
- provider/device hydration entries;
- user goal;
- intake coverage;
- optional pre/post-exercise body-mass protocol in a future advanced workflow.

There is no universal Body hydration-status score.

### Metabolic observations

- glucose records/CGM trace under source and intended use;
- insulin delivery;
- ketones;
- lactate;
- provider AGEs/antioxidant/metabolic score;
- meal-linked glucose response as observation;
- weight trend as contextual outcome;
- lab biomarkers as clinical records, not nutrient-score ingredients by
  default.

### Nutrition actions

- log/scan/search/build a meal;
- reuse recipe or recent meal;
- correct serving/database entry;
- mark logging incomplete;
- set evidence-appropriate goals;
- connect a food/CGM source;
- review nutrient/meal detail and history.

## Rest & Recovery universe

Rest includes sleep, passive/active restoration and physiological recovery.

### Sleep session

- main sleep and naps;
- bedtime, sleep onset, wake and out-of-bed time;
- time in bed and total sleep;
- awake/WASO/latency;
- wearable-estimated stage intervals/durations;
- efficiency;
- interruptions/movement;
- snoring and breathing sounds;
- SpO2 and breathing disturbances under provider context;
- overnight HR/RHR/HRV/RR/temperature;
- source, edits and detection confidence;
- subjective sleep quality/restedness;
- environment/context/tags.

### Sleep pattern and circadian context

- duration history;
- onset/offset regularity;
- midpoint/timing;
- social jetlag-style difference only after exact specification;
- chronotype/provider preferred sleep period;
- bedtime guidance/provider sleep need;
- provider sleep debt;
- nap pattern;
- shift-work/travel/timezone context;
- adult guideline comparison under applicable population.

### Recovery physiology

- same-source resting HR trend;
- same-metric HRV trend;
- respiratory-rate trend;
- temperature/deviation trend;
- SpO2 trend;
- provider readiness/recovery/energy score and contributors;
- autonomic-versus-sleep components where provider exposes them;
- recovery-time provider result;
- soreness, fatigue, pain and subjective readiness;
- provider Body Battery/energy-resource timeline;
- calibration and valid-night coverage.

### Stress and restoration

- provider physiological stress timeline;
- perceived-stress check-ins;
- restorative time/provider result;
- meditation/breathwork/mindfulness sessions;
- relaxation/rest sessions;
- active recovery;
- cumulative/mid-term provider stress/resilience results;
- stress versus physical activity distinction;
- experimental behavior association with explicit uncertainty.

### Rest actions

- correct sleep;
- log nap/rest/check-in;
- perform breathing/mindfulness session;
- add context;
- adjust sleep schedule/goal;
- connect/troubleshoot wearable;
- review contributors and long-term history.

## Hygiene & Looks universe

This is deliberately extensible. Everything can be tracked when the user gives
it meaning; a scientific or medical claim requires separate evidence.

### Routine definition and execution

- user-created routine and arbitrary custom steps;
- evidence-labelled optional templates;
- schedule, frequency, order and duration;
- time/location/context link;
- completion, partial completion, skip and reason;
- reminder;
- product/tool used;
- notes and subjective result;
- routine history and consistency;
- planner link;
- goal link.

### Oral care

- toothbrushing occurrence/duration;
- fluoride toothpaste selection where user records it;
- interdental cleaning;
- tongue/retainer/denture care as user-defined;
- dental appointment/reminder;
- pain, bleeding or sensitivity observation;
- dentist-personalized routine.

### Skin and sun care

- cleanse/moisturize/treatment/sunscreen steps as configurable routines;
- product and active ingredient record;
- sun-protection action;
- UV/context input;
- irritation/dryness/oiliness/acne or other user-described observation;
- photo under controlled-capture guidance;
- dermatologist plan and reminders;
- patch-test/allergy context.

### Hair, grooming and appearance

- wash/style/treatment/grooming routines;
- product/tool use;
- haircut/maintenance schedule;
- scalp/hair observations;
- user-defined looks-maxing exercises/practices;
- posture/mobility/grooming goals;
- neutral private ratings/photos;
- change history without attractiveness scoring.

### General hygiene and environment

- shower/bath and user-defined frequency;
- hand care/handwashing routines;
- nail/foot care;
- laundry/bedding/towel routines;
- deodorant/fragrance and sensitivity notes;
- room/environment cleaning linked to personal routine;
- custom condition/symptom tracking.

### Cycle and reproductive context

Because this page contains intimate self-care, it may host tailored cycle
information when the user opts in:

- period timing/flow and symptoms;
- predicted next-period window;
- provider fertile-window result;
- contraception/hormone context;
- pregnancy/postpartum/menopause routines and symptoms.

The canonical records remain one sensitive reproductive domain; page placement
is a user/product presentation choice.

### Hygiene & Looks actions

- create/edit/execute routine;
- log observation, symptom, product or photo;
- mark private/sensitive;
- compare controlled observations;
- connect routine with planner/goal;
- export/share selected history;
- seek professional care through neutral escalation, never automated diagnosis.

## Clinical and profile context

Clinical information can contextualize Body but does not automatically become a
dashboard widget:

- allergies;
- conditions;
- medications and adherence;
- immunizations;
- lab results;
- procedures;
- health records/documents;
- emergency/medical IDs;
- profile age/height/sex where required;
- pregnancy/menopause context;
- mobility/accessibility context;
- clinician-entered targets.

Clinical provenance, issuer, code system and status remain intact.

## Candidate exclusion before widget selection

The following are not valid candidates in their rejected form:

- one universal overall health score;
- one Body-authored readiness or sleep score without validation;
- ACWR injury prediction;
- exact daily energy balance;
- universal hydration status;
- HRV-only stress/illness interpretation;
- consumer sleep-stage clinical truth;
- opaque nutrition quality score;
- guaranteed fertility or contraception prediction;
- universal habit-formation countdown;
- attractiveness score or automated medical image diagnosis.

## Completeness rule

The universe remains open. A new provider field, user-created record or future
scientifically supported concept may enter when it has:

- a defensible semantic identity;
- provenance;
- a record shape;
- page-specific purpose;
- evidence disposition;
- privacy class;
- missing/unsupported behavior.

“Not currently listed” never means “forbidden.” Everything can be represented;
production interpretation is what requires proof.

