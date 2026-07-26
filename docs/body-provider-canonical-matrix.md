# Body provider-to-canonical matrix

Status: **harmonisation in progress**

This matrix maps verified provider fields to neutral Body records. It does not
mean that every field becomes a widget. Provider scores remain provider scores;
Body-derived values require a separately versioned calculation contract.

Evidence is the provider inventory in
[`body-provider-inventory`](./body-provider-inventory/README.md), which points
to the closest official source and records access gates.

## Mapping rules

- A canonical record describes meaning, shape and unit; it does not erase the
  original provider field.
- Source values and source units are stored unchanged beside normalized values.
- A daily summary never silently replaces samples or sessions.
- Provider-derived and Body-derived values occupy separate namespaces.
- Missing, unsupported, permission-denied, not-worn and not-synced are distinct
  states.
- Multiple sources may coexist. Deduplication needs identity, time, device,
  source priority and overlap evidence; value similarity alone is insufficient.

## Cardio, HRV, respiration and oxygen

| Canonical candidate | Shape / unit | Verified provider source fields |
|---|---|---|
| `cardio.heart_rate.sample` | sample, bpm | Google `HeartRate.samples[].beatsPerMinute`; Health Connect `HeartRateRecord.samples[].beatsPerMinute`; Apple `HKQuantityTypeIdentifierHeartRate`; Samsung `HeartRate.HEART_RATE`/`SERIES_DATA`; Polar continuous HR `heart_rate_samples[].heart_rate`; Oura `heartrate.bpm`; Withings intraday `heart_rate`; Strava stream `heartrate` |
| `cardio.heart_rate.resting` | sample or daily summary, bpm | WHOOP recovery `resting_heart_rate`; Google `RestingHeartRate`; Health Connect `RestingHeartRateRecord.beatsPerMinute`; Apple resting HR identifier; Polar profile `resting_heart_rate`; Oura sleep `lowest_heart_rate` is retained as nightly-low, not remapped to resting HR |
| `cardio.heart_rate.average` | session/daily summary, bpm | WHOOP cycle/workout `average_heart_rate`; Oura sleep `average_heart_rate`; Polar exercise `heart-rate.average`; Withings activity/workout/sleep `hr_average`; Samsung activity/exercise summaries where exposed |
| `cardio.heart_rate.maximum` | session/daily summary, bpm | WHOOP cycle/workout `max_heart_rate`; Polar exercise `heart-rate.maximum`; Withings `hr_max`; Samsung HR/session maximum |
| `cardio.hrv.rmssd` | sample or summary, ms | WHOOP recovery `hrv_rmssd_milli`; Google HRV RMSSD records/daily derivations; Health Connect `HeartRateVariabilityRmssdRecord.heartRateVariabilityMillis`; Oura sleep `average_hrv`/HRV series with provider context; Polar `heart_rate_variability_avg`; Withings intraday/sleep `rmssd`, summary `rmssd_start_avg`/`rmssd_end_avg` |
| `cardio.hrv.sdnn` | sample or summary, ms | Google HRV SDNN records; Apple `HKQuantityTypeIdentifierHeartRateVariabilitySDNN`; Withings `sdnn1`/`sdnn_1`; Polar ECG/RR-derived provider field when explicitly supplied |
| `respiration.rate.sample` | sample, breaths/min | Google respiration records; Health Connect `RespiratoryRateRecord.rate`; Apple respiratory rate; Polar Nightly Recharge `breathing_rate_avg`; Oura sleep `average_breath`; Withings `rr`/`rr_average`; Samsung respiratory records where supplied |
| `oxygen.saturation.sample` | sample, % | Google oxygen saturation; Health Connect `OxygenSaturationRecord.percentage`; Apple oxygen saturation; Samsung BloodOxygen; Polar SpO2 `blood_oxygen_percent`; Withings type 54 / intraday `spo2_auto`; Oura daily SpO2 average |
| `cardio.blood_pressure` | paired measurement, mmHg | Google blood pressure; Health Connect `BloodPressureRecord.systolic`/`diastolic`; Apple systolic/diastolic correlation; Samsung BP systolic/diastolic; Withings types 9/10 and Heart `bloodpressure` |
| `cardio.ecg.signal` | time series, provider sampling unit | Google ECG waveform; Apple electrocardiogram samples/classification; Samsung ECG where permitted; Polar wrist ECG `rri_ms` and related test output; Withings Heart `signal` + `sampling_frequency` |

## Activity, exercise and energy

| Canonical candidate | Shape / unit | Verified provider source fields |
|---|---|---|
| `activity.steps` | interval/daily, count | Google Steps; Health Connect `StepsRecord.count`; Apple step count; Samsung Steps; Polar `steps`; Oura `steps`; Withings `steps`; Strava run/walk activity context where supplied |
| `activity.distance` | interval/session, m | Google Distance; Health Connect `DistanceRecord.distance`; Apple distance identifiers by modality; Samsung distance; Polar `distance_from_steps`/exercise distance; Oura `equivalent_walking_distance` plus workout distance as distinct semantics; Withings `distance`; Strava `distance` |
| `activity.elevation_gain` | session/daily, m | Google elevation; Health Connect `ElevationGainedRecord.elevation`; Apple flights/elevation-related workout fields; Polar route/exercise ascent; Withings `elevation` is floors and therefore maps to floors, not meters; Strava `total_elevation_gain` |
| `activity.floors` | interval/daily, count | Google floors; Health Connect `FloorsClimbedRecord.floors`; Apple flights climbed; Samsung floors; Withings `elevation` per provider definition |
| `energy.active` | interval/session/daily, kcal | Google active calories; Health Connect `ActiveCaloriesBurnedRecord.energy`; Apple active energy; Samsung active calories; Polar `active_calories`; Oura `active_calories`; Withings `calories`; Strava `calories` |
| `energy.total` | interval/session/daily, kcal | Google total calories; Health Connect `TotalCaloriesBurnedRecord.energy`; Apple basal + active remain separately traceable; Samsung total calories; Polar `calories`; Oura `total_calories`; Withings `totalcalories` |
| `exercise.session` | session | Google ExerciseSession; Health Connect ExerciseSessionRecord; Apple Workout; Samsung Exercise/ExerciseSession; Polar exercise; Oura workout; Withings workout; Strava activity |
| `exercise.heart_rate_zone_duration` | session/daily, seconds | Google heart-rate zones; WHOOP workout zones; Polar HR zones; Withings `hr_zone_0..3`; Strava zones |
| `exercise.power.sample` | series, W | Health Connect PowerRecord; Apple cycling power; Samsung ExerciseLog power; Polar power samples; Strava watts stream |
| `exercise.speed.sample` | series, m/s | Google speed; Health Connect SpeedRecord; Apple speed identifiers; Samsung ExerciseLog speed; Polar speed samples; Strava velocity stream |
| `exercise.route` | geospatial series | Google exercise route; Health Connect ExerciseRoute; Apple workout route; Samsung ExerciseSession route; Polar route; Strava latlng stream |

## Sleep and recovery

| Canonical candidate | Shape / unit | Verified provider source fields |
|---|---|---|
| `sleep.session` | session | Google Sleep; Health Connect SleepSessionRecord; Apple SleepAnalysis; Samsung Sleep; WHOOP sleep start/end; Oura sleep period; Polar Sleep Plus Stages; Withings Sleep Get/Summary |
| `sleep.stage` | interval, canonical plus original code | Google sleep stages; Health Connect SleepSession stages; Apple sleep-analysis values; Samsung SleepStage; WHOOP light/SWS/REM durations; Oura `sleep_phase_30_sec`; Polar `hypnogram`; Withings `state` |
| `sleep.time_in_bed` | session summary, seconds | WHOOP sleep timing; Oura `time_in_bed`; Polar sleep interval/summary; Withings `total_timeinbed`; Google/Apple/HC derived only when their interval semantics support it |
| `sleep.total_sleep` | session summary, seconds | WHOOP stage totals; Oura `total_sleep_duration`; Polar stage totals; Withings `total_sleep_time`; Google/Fitbit exported sleep summary |
| `sleep.efficiency` | session summary, % | WHOOP `sleep_efficiency_percentage`; Oura `efficiency`; Polar sleep solidity/continuity stay provider-specific; Withings `sleep_efficiency` |
| `sleep.latency` | session summary, seconds | Oura `latency`; Withings `sleep_latency`; other providers only when explicitly exposed or reproducibly derivable from stage boundaries |
| `sleep.waso` | session summary, seconds | Withings `waso`; derivation from other providers is a separate Body calculation, never field equivalence |
| `sleep.respiratory_disturbance` | provider result | Oura breathing regularity/disturbances; Withings `breathing_disturbances_intensity`, AHI and Withings Index as three distinct fields |
| `provider.recovery.score` | vendor-derived, provider scale | WHOOP `recovery_score`; Oura readiness score; Polar `nightly_recharge_status`/`ans_charge`; Google/Fitbit readiness where API-exposed. Values are not interchangeable |
| `provider.sleep.score` | vendor-derived, provider scale | WHOOP sleep performance; Oura daily sleep score; Polar `sleep_score`; Withings `sleep_score`; Google/Fitbit sleep score where API-exposed |

## Body, temperature, glucose and nutrition

| Canonical candidate | Shape / unit | Verified provider source fields |
|---|---|---|
| `body.weight` | sample, kg | WHOOP body measurement `weight_kilogram`; Google `Weight.weightGrams`; Health Connect WeightRecord; Apple body mass; Samsung body composition; Polar profile `weight`; Oura profile `weight`; Withings type 1 |
| `body.height` | sample/profile, m | WHOOP `height_meter`; Google height; Health Connect HeightRecord; Apple height; Samsung profile; Polar profile; Oura profile; Withings type 4 |
| `body.fat.percentage` | sample, % | Google body fat; Health Connect BodyFatRecord; Apple body-fat percentage; Samsung body composition; Withings type 6 |
| `body.lean_mass` | sample, kg | Google lean mass where supplied; Health Connect LeanBodyMassRecord; Apple lean body mass; Samsung body composition; Withings type 5 |
| `body.bone_mass` | sample, kg | Health Connect BoneMassRecord; Samsung body composition; Withings type 88 |
| `body.water_mass` | sample, kg | Health Connect WaterMassRecord; Samsung body composition; Withings type 77 |
| `temperature.body` | sample, °C | Google CoreBodyTemperature; Health Connect BodyTemperatureRecord; Apple body temperature; Samsung BodyTemperature; Withings types 12/71 |
| `temperature.skin` | sample/series, °C | Google skin/nightly temperature; Health Connect SkinTemperatureRecord; Apple wrist temperature; Samsung SkinTemperature; Polar skin temperature; Oura temperature deviation stays a deviation; Withings type 73 |
| `metabolic.blood_glucose` | sample, mmol/L canonical | Google blood glucose; Health Connect BloodGlucoseRecord; Apple blood glucose; Samsung BloodGlucose. Source unit remains preserved |
| `nutrition.intake` | event/meal | Google Nutrition; Health Connect NutritionRecord; Apple dietary quantity types; Samsung Nutrition |
| `hydration.intake` | event, mL canonical | Google Hydration; Health Connect HydrationRecord; Apple dietary water; Samsung WaterIntake |

## Reproductive, mindfulness and clinical records

| Canonical candidate | Shape / unit | Verified provider source fields |
|---|---|---|
| `cycle.menstruation` | event/interval | Health Connect MenstruationFlow/Period; Apple menstrual flow/cycle tracking; Google menstrual-health records where available |
| `cycle.ovulation_test` | event | Health Connect OvulationTestRecord; Apple ovulation test result |
| `cycle.cervical_mucus` | event | Health Connect CervicalMucusRecord; Apple cervical mucus quality |
| `wellness.mindfulness` | session | Health Connect MindfulnessSessionRecord; Apple mindful session; Oura session/moment retains its provider context |
| `clinical.record` | clinical resource | Apple clinical records; Health Connect medical records when feature and permission are available; Google specialist scopes. No wellness connector may synthesize one |

## Unresolved harmonisation decisions

1. Exact source-precedence policy per canonical type.
2. Complete optional-field and OS/device gate expansion for HealthKit, Health
   Connect and Samsung.
3. Garmin field-level mapping after approved program access.
4. Provider-specific enums that require generated lookup tables.
5. Whether an exposed provider insight deserves a widget; scientific validity
   and product value are evaluated later.

These are recorded gaps, not invitations to infer missing schemas.
