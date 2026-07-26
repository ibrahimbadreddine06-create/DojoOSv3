# Google Health API — Verified Data-Type Inventory

Verified against the official data-type index updated 20 July 2026:
https://developers.google.com/health/data-types

This is the successor to the Fitbit Web API for Fitbit devices and Pixel
Watches. The legacy Fitbit Web API is scheduled to stop syncing in September
2026.

## Access and provenance

- Google OAuth 2.0
- Restricted health scopes requiring product, privacy, and security review
- Device data becomes available after synchronization with Google/Fitbit
- Fitbit devices do not expose a direct third-party device connection
- Records can identify platform, device, and recording/derivation method
- Historical data can be retrieved back to first recorded availability
- Individual requests are limited to 14 or 90 days depending on data type

## Activity and fitness scope

| API data type | Record shape | Main read behavior |
|---|---|---|
| Active Energy Burned | interval | list, reconcile, rollups |
| Active Minutes | interval | list, reconcile, rollups |
| Active Zone Minutes | interval | list, reconcile, rollups |
| Activity Level | interval | list, reconcile |
| Altitude | interval | list, reconcile, rollups |
| Calories In Heart Rate Zone | interval | rollups |
| Daily VO₂ Max | daily | list, reconcile |
| Distance | interval | list, reconcile, rollups |
| Exercise | session | list, get, reconcile; writable |
| Floors | interval | reconcile, rollups |
| Run VO₂ Max | sample | list, reconcile, rollups |
| Sedentary Period | interval | list, reconcile, rollups |
| Steps | interval | list, reconcile, rollups |
| Swim Lengths Data | interval | list, reconcile, rollups |
| Time in Heart Rate Zone | interval | list, reconcile, rollups |
| Total Calories | interval | rollups |
| VO₂ Max | sample | list, reconcile |

## Health metrics and measurements scope

| API data type | Record shape | Main read behavior |
|---|---|---|
| Blood Glucose | sample | list, get, reconcile, rollups |
| Body Fat | sample | list, get, reconcile, rollups; writable |
| Core Body Temperature | sample | list, get, reconcile, rollups |
| Daily Heart Rate Variability | daily | list, reconcile |
| Daily Heart Rate Zones | daily | list, reconcile |
| Daily Oxygen Saturation | daily | list, reconcile |
| Daily Respiratory Rate | daily | list, reconcile |
| Daily Resting Heart Rate | daily | list, reconcile |
| Daily Sleep Temperature Derivations | daily | list, reconcile |
| Heart Rate | sample | list, reconcile, rollups |
| Heart Rate Variability | sample | list, reconcile |
| Height | sample | list, get, reconcile; writable |
| Oxygen Saturation | sample | list, reconcile |
| Respiratory Rate Sleep Summary | sample | list, reconcile |
| Weight | sample | list, get, reconcile, rollups; writable |

## Sleep scope

| API data type | Record shape | Main read behavior |
|---|---|---|
| Sleep | session | list, get, reconcile; writable |

The session payload and stage model require a separate field-level extraction;
the presence of the `Sleep` type alone is not treated as proof that every
Fitbit interface sleep metric is exported.

## Nutrition scope

| API data type | Record shape | Main behavior |
|---|---|---|
| Food | food reference | list, get |
| Food Measurement Unit | food reference | list, get |
| Hydration Log | session | list, get, reconcile, rollups; writable |
| Nutrition Log | sample | list, get, reconcile, rollups; writable |

## Restricted specialist scopes

| API data type | Scope | Behavior |
|---|---|---|
| Electrocardiogram | ECG | read sessions |
| Irregular Rhythm Notification | IRN | read sessions |

## Synchronization constraints

- Some detailed energy and heart-rate requests have a maximum 14-day query
  window; most other types allow 90 days per request.
- A response page can contain up to 10,000 data points.
- Full historical import therefore requires paginated, windowed backfill.
- Sync availability depends on the device reaching the Fitbit/Google app.
- Civil time and physical UTC time are both required. Days can contain 23, 24,
  or 25 hours and travel can span several offsets.
- Daily aggregation should follow the user's civil day instead of assuming a
  constant 24-hour UTC bucket.

## V4 field inventory

Verified against the official Discovery document:
`https://health.googleapis.com/$discovery/rest?version=v4`.

### Common time and provenance

`DataSource`:

- `recordingMethod`
- `device.formFactor`
- `device.manufacturer`
- `device.displayName`
- output-only `platform`
- output-only `application`

Sample time:

- `physicalTime`
- `utcOffset`
- output-only `civilTime`

Observation/session intervals:

- `startTime`, `endTime`
- `startUtcOffset`, `endUtcOffset`
- output-only `civilStartTime`, `civilEndTime`

### Activity and energy fields

| Schema | Fields |
|---|---|
| `ActiveEnergyBurned` | `interval`, `kcal` |
| `BasalEnergyBurned` | `interval`, `kcal` |
| `ActiveMinutes` | `interval`, `activeMinutesByActivityLevel[]` |
| `ActiveMinutesByActivityLevel` | `activityLevel`, `activeMinutes` |
| `ActiveZoneMinutes` | `interval`, `heartRateZone`, `activeZoneMinutes` |
| `ActivityLevel` | `interval`, `activityLevelType` |
| `Altitude` | `interval`, `gainMillimeters` |
| `Distance` | `interval`, `millimeters` |
| `Floors` | `interval`, `count` |
| `Steps` | `interval`, `count` |
| `SedentaryPeriod` | `interval` |
| `SwimLengthsData` | `interval`, `swimStrokeType`, `strokeCount` |
| `TimeInHeartRateZone` | `interval`, `heartRateZoneType` |

Active Zone Minutes telt volgens Google als 1 voor lage intensiteit en 2 voor
cardio/peak. Body bewaart dit systeem en presenteert het niet als gewone
minuten zonder uitleg.

### Heart and oxygen fields

| Schema | Fields |
|---|---|
| `HeartRate` | `sampleTime`, `beatsPerMinute`, optionele `metadata` |
| `HeartRateMetadata` | `motionContext`, `sensorLocation` |
| `HeartRateVariability` | `sampleTime`, `rootMeanSquareOfSuccessiveDifferencesMilliseconds`, `standardDeviationMilliseconds` |
| `DailyHeartRateVariability` | `date`, gemiddelde RMSSD, deep-sleep RMSSD, entropy, non-REM HR |
| `DailyHeartRateZones` | `date`, `heartRateZones[]` |
| `HeartRateZone` | type, minimum- en maximum-bpm |
| `DailyRestingHeartRate` | `date`, `beatsPerMinute`, calculation metadata |
| `OxygenSaturation` | `sampleTime`, `percentage` |
| `DailyOxygenSaturation` | `date`, gemiddelde, confidence bounds, optionele 7–30d standard deviation |

RMSSD en SDNN blijven afzonderlijke metrics. De dagelijkse entropy-waarde is
een Google-afleiding en geen generieke HRV-vervanger.

### Respiration and temperature fields

| Schema | Fields |
|---|---|
| `DailyRespiratoryRate` | `date`, `breathsPerMinute` |
| `RespiratoryRateSleepSummary` | `sampleTime`, full/light/deep/REM statistics |
| `RespiratoryRateSleepSummaryStatistics` | `breathsPerMinute`, `standardDeviation`, `signalToNoise` |
| `CoreBodyTemperature` | `id`, `sampleTime`, `temperatureCelsius`, `measurementLocation` |
| `DailySleepTemperatureDerivations` | `date`, nightly skin temperature, 30d baseline, relative 30d standard deviation |

### Body and glucose fields

| Schema | Fields |
|---|---|
| `BloodGlucose` | `sampleTime`, `bloodGlucoseMilligramsPerDeciliter`, `mealType`, `measurementTiming`, `specimen`, `measurementSource`, `notes` |
| `BodyFat` | `sampleTime`, `percentage` |
| `Height` | `sampleTime`, `heightMillimeters` |
| `Weight` | `sampleTime`, `weightGrams`, `notes` |

### VO2 fields

| Schema | Fields |
|---|---|
| `VO2Max` | `sampleTime`, `vo2Max`, `measurementMethod` |
| `RunVO2Max` | `sampleTime`, `runVo2Max` |
| `DailyVO2Max` | `date`, `vo2Max`, `vo2MaxCovariance`, `estimated`, `cardioFitnessLevel` |

Alle waarden gebruiken ml/kg/min. Meetmethode, covariance en estimationstatus
blijven behouden.

### Exercise fields

`Exercise`:

- `displayName`, `exerciseType`, `interval`
- `notes`
- `exerciseMetadata`
- `activeDuration`
- `metricsSummary`
- `splits`, `splitSummaries`
- `exerciseEvents`
- output-only `createTime`, `updateTime`

`ExerciseMetadata`: `poolLengthMillimeters`, `hasGps`.

`MetricsSummary`:

- distance, calories, steps;
- average heart rate and heart-rate-zone durations;
- average pace and speed;
- elevation gain;
- mobility metrics;
- run VO2 max;
- active zone minutes;
- total swim lengths.

`MobilityMetrics`:

- average ground-contact time;
- vertical oscillation;
- vertical ratio;
- stride length;
- cadence.

Events bewaren eventtype, fysieke tijd en UTC-offset. Split summaries bewaren
start/einde, offsets, actieve duur, splittype en een eigen metrics summary.
Samenvattingsvelden vervangen de afzonderlijke telemetrytypes niet.

### Sleep fields

`Sleep`:

- `interval`
- `type`
- `stages[]`
- `outOfBedSegments[]`
- `metadata`
- output-only `summary`, `createTime`, `updateTime`

`SleepMetadata`:

- `manuallyEdited`
- `processed`
- `nap`
- `stagesStatus`
- `externalId`

`SleepStage`:

- `startTime`, `endTime`
- `startUtcOffset`, `endUtcOffset`
- `type`
- output-only create/update time

`SleepSummary`:

- minutes to fall asleep;
- minutes awake;
- minutes after wake-up;
- minutes in sleep period;
- minutes asleep;
- per-stage duration and segment count.

Een onprocessed of deels verwerkte sleep wordt niet als definitief resultaat
gecached.

### Nutrition and hydration fields

`HydrationLog`: `interval`, `amountConsumed`.

`NutritionLog`:

- `interval`
- `food` of `foodDisplayName`
- `mealType`
- `serving`
- `energy`, `energyFromFat`
- `totalFat`, `totalCarbohydrate`
- `nutrients[]`

Quantityschemas bewaren hun gestandaardiseerde waarde én optionele
`userProvidedUnit`. Voeding gebruikt kcal, gram en milliliter als API-units.

`Food` bevat naam, beschrijving, merk, taal, access level, default serving,
servings, energie min/max/gemiddeld, macro’s, nutrients en meal type.

### ECG and irregular rhythm

`Electrocardiogram`:

- session interval;
- result classification;
- average bpm;
- waveform samples;
- sampling frequency;
- voltage scaling factor;
- lead count;
- medical device info.

Historische ECG-data kan timezone-offsets missen; fysieke tijd is dan leidend.

`IrregularRhythmNotification` bevat session interval, analysis windows en
medical device info. Een negative window garandeert volgens Google niet dat
AFib afwezig is.

Medical device info bewaart device model, firmware-, algorithm-, feature- en
serviceversie.

## Webhook coverage

De actuele release notes bevestigen notifications voor onder andere activity
level, blood glucose, HR/HRV, daily HR/oxygen/respiration/temperaturetypes,
exercise, sleep, steps, distance, floors, nutrition, hydration, VO2 en weight.
Body configureert subscriptions per daadwerkelijk zichtbare functie, niet als
onbeperkte bulktoegang.

## Remaining gates

- Extract enumwaarden en valid ranges from the Discovery schema.
- Map exact true-zero behavior per supported type.
- Verify device-generation and membership requirements.
- Verify which proprietary Fitbit/Google interface scores are actually exposed;
  interface visibility alone is not API availability.
