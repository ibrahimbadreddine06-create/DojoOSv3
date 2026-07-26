# Body canonical type registry

Status: **draft contract — provider harmonisation in progress**

This registry gives provider-neutral meaning to Body records. It is not the
widget catalogue and does not constrain what a widget may contain. Everything
can be represented when it has a defensible meaning, provenance and record
shape.

## Type contract

Every canonical type declares:

- stable key and semantic version;
- value shape: measurement, series, interval, session, event, summary,
  profile, clinical resource, provider insight or Body derivation;
- canonical unit or enum;
- valid context and aggregation rules;
- whether manual entry is meaningful;
- whether it is raw, normalized, provider-derived or Body-derived;
- sensitivity and consent class;
- source mappings and evidence;
- missing-data vocabulary.

Changing a label is not a semantic change. Changing meaning, unit basis,
aggregation window or eligible population requires a new semantic version.

## Identity and provenance

These records do not become user-facing metrics but are mandatory:

- `source.connection`
- `source.application`
- `source.device`
- `source.recording_method`
- `source.permission_state`
- `source.sync_cursor`
- `source.eligibility`
- `source.quality`
- `source.missing_reason`
- `source.raw_reference`

## Person and physiological context

- `person.birth_date`
- `person.biological_sex`
- `person.height`
- `person.weight`
- `person.wheelchair_use`
- `person.pregnancy_context`
- `person.timezone_history`
- `person.resting_heart_rate_setting`
- `person.maximum_heart_rate_setting`
- `person.activity_class`
- `person.sleep_goal`

Profile values are time-versioned. A calculation uses the value valid at the
observation time, not silently the latest profile.

## Activity and mobility

- `activity.steps`
- `activity.cadence.steps`
- `activity.distance`
- `activity.floors`
- `activity.elevation_gain`
- `activity.intensity`
- `activity.active_duration`
- `activity.inactivity_event`
- `activity.wheelchair_pushes`
- `mobility.walking_speed`
- `mobility.walking_step_length`
- `mobility.walking_asymmetry`
- `mobility.walking_double_support`
- `mobility.stair_ascent_speed`
- `mobility.stair_descent_speed`
- `mobility.six_minute_walk_distance`
- `mobility.gait_steadiness`
- `mobility.fall_event`

Counts, durations and distances retain their interval. Overlapping intervals
cannot be summed until source overlap has been resolved.

## Exercise and training

- `exercise.session`
- `exercise.segment`
- `exercise.route`
- `exercise.lap`
- `exercise.repetition_set`
- `exercise.speed`
- `exercise.pace`
- `exercise.cadence`
- `exercise.power`
- `exercise.torque`
- `exercise.resistance`
- `exercise.incline`
- `exercise.stroke_count`
- `exercise.swim_lap`
- `exercise.heart_rate_zone_duration`
- `exercise.energy`
- `exercise.distance`
- `exercise.elevation`
- `exercise.perceived_exertion`
- `exercise.training_load.external`
- `exercise.training_load.internal`
- `exercise.recovery_time.provider`

Sport types preserve provider codes and map, when possible, to a versioned
Body taxonomy. Unknown and user-created activities remain valid.

## Energy and metabolism

- `energy.active`
- `energy.basal`
- `energy.resting`
- `energy.total`
- `metabolic.basal_rate`
- `metabolic.vo2`
- `metabolic.vo2_max`
- `metabolic.blood_glucose`
- `metabolic.insulin_delivery`
- `metabolic.ketone`
- `metabolic.lactate`

Energy estimates record the algorithm owner and input provenance. They are not
treated as direct calorimetry.

## Cardiovascular

- `cardio.heart_rate`
- `cardio.heart_rate.resting`
- `cardio.heart_rate.recovery`
- `cardio.heart_rate.zone_duration`
- `cardio.hrv.rmssd`
- `cardio.hrv.sdnn`
- `cardio.rr_interval`
- `cardio.blood_pressure`
- `cardio.pulse_pressure`
- `cardio.pulse_wave_velocity`
- `cardio.vascular_age.provider`
- `cardio.ecg`
- `cardio.ecg.classification.provider`
- `cardio.irregular_rhythm.provider`
- `cardio.atrial_fibrillation_burden.provider`

Medical classifications stay namespaced to the supplying regulated feature.
Body does not infer a diagnosis from a consumer HR or PPG series.

## Respiratory and oxygen

- `respiration.rate`
- `respiration.chest_movement_rate`
- `respiration.snoring_duration`
- `respiration.breathing_sound_duration`
- `respiration.disturbance.provider`
- `respiration.apnea_hypopnea_index.provider`
- `oxygen.saturation`
- `oxygen.saturation.exercise`
- `oxygen.variation.provider`

Wellness breathing disturbance, regulated AHI and vendor indexes are separate
types even when their display ranges resemble one another.

## Sleep and circadian

- `sleep.session`
- `sleep.stage`
- `sleep.time_in_bed`
- `sleep.total_sleep`
- `sleep.awake_duration`
- `sleep.light_duration`
- `sleep.deep_duration`
- `sleep.rem_duration`
- `sleep.latency`
- `sleep.wake_latency`
- `sleep.waso`
- `sleep.efficiency`
- `sleep.interruption`
- `sleep.out_of_bed`
- `sleep.movement`
- `sleep.timing`
- `sleep.regularity`
- `sleep.need.provider`
- `sleep.debt.provider`
- `sleep.score.provider`
- `circadian.preferred_sleep_period.provider`
- `circadian.alertness.provider`

Stage labels retain original resolution and uncertainty. Body may harmonize
display categories without pretending provider algorithms are identical.

## Temperature

- `temperature.body`
- `temperature.core`
- `temperature.skin`
- `temperature.basal_body`
- `temperature.sleep_skin`
- `temperature.deviation_from_baseline.provider`
- `temperature.status.provider`

Location, method and context are compulsory. A skin-temperature deviation is
not converted into an absolute core temperature.

## Body composition

- `body.weight`
- `body.height`
- `body.mass_index`
- `body.fat.percentage`
- `body.fat.mass`
- `body.lean_mass`
- `body.muscle_mass`
- `body.bone_mass`
- `body.water_mass`
- `body.water.intracellular`
- `body.water.extracellular`
- `body.visceral_fat.provider`
- `body.segmental.fat_mass`
- `body.segmental.lean_mass`
- `body.segmental.muscle_mass`
- `body.metabolic_age.provider`
- `body.nerve_health.provider`
- `body.electrochemical_skin_conductance`

Segment and measurement position are part of identity, not optional notes.

## Nutrition and intake

- `nutrition.meal`
- `nutrition.food`
- `nutrition.energy`
- `nutrition.protein`
- `nutrition.carbohydrate`
- `nutrition.fat`
- `nutrition.fiber`
- `nutrition.sugar`
- `nutrition.sodium`
- `nutrition.cholesterol`
- `nutrition.vitamin`
- `nutrition.mineral`
- `nutrition.caffeine`
- `nutrition.alcohol`
- `hydration.water`
- `intake.medication`
- `intake.supplement`

Nutrient records preserve serving, food database, barcode/recipe and user-edit
provenance. Estimated and measured portions are not silently equivalent.

## Reproductive health

- `cycle.menstruation.flow`
- `cycle.menstruation.period`
- `cycle.intermenstrual_bleeding`
- `cycle.cervical_mucus`
- `cycle.ovulation_test`
- `cycle.sexual_activity`
- `cycle.contraceptive`
- `cycle.pregnancy_test`
- `cycle.pregnancy`
- `cycle.lactation`
- `cycle.symptom`
- `cycle.prediction.provider`

These are sensitive records with granular consent and optional use. Prediction
and observation remain separate.

## Hygiene, looks and self-care

- `selfcare.routine`
- `selfcare.routine_completion`
- `selfcare.custom_event`
- `selfcare.symptom`
- `selfcare.skin_observation`
- `selfcare.hair_observation`
- `selfcare.oral_care`
- `selfcare.product_use`
- `selfcare.photo`
- `selfcare.user_rating`

This domain is intentionally extensible. User-created routines, observations
and events remain first-class records; the schema must not pretend a fixed list
contains every possible practice.

## Mindfulness, symptoms and clinical data

- `wellness.mindfulness_session`
- `wellness.mood`
- `wellness.stress.provider`
- `wellness.resilience.provider`
- `symptom.observation`
- `clinical.allergy`
- `clinical.condition`
- `clinical.immunization`
- `clinical.lab_result`
- `clinical.medication`
- `clinical.procedure`
- `clinical.vital_sign`
- `clinical.document`

Clinical resources retain coding system, issuer, status and original document.
They are never reduced to an untraceable scalar.

## Provider insights and Body derivations

Provider insights use `provider.<provider>.<metric>` when meaning or weighting
is proprietary. Body derivations use `body_derived.<metric>@<version>` and must
reference:

- exact inputs;
- eligibility population;
- window and timezone logic;
- missing-data policy;
- formula or model version;
- validation evidence;
- confidence and known limitations.

No Body derivation can overwrite a source record or present itself as a
provider-native value.
