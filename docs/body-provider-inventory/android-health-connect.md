# Android Health Connect — datatypeinventaris

Status: **recordtype-compleet voor de actuele publieke catalogus; veldmatrix in uitvoering**

Primaire bronnen:

- Datatypes: https://developer.android.com/health-and-fitness/health-connect/data-types
- Dataformat en metadata: https://developer.android.com/health-and-fitness/health-connect/data-format
- Aggregaties: https://developer.android.com/health-and-fitness/health-connect/aggregate-data
- Platformreferentie: https://developer.android.com/reference/android/health/connect/datatypes/package-summary

## Platform- en publicatiegates

- Health Connect is een Android-platform/store-route, niet rechtstreeks een
  browser-API.
- Ieder datatype heeft afzonderlijke read/write-permissions.
- Een gepubliceerde app moet het gebruik van ieder gevraagd datatype in Play
  Console verklaren en kan aanvullende goedkeuring nodig hebben.
- Beschikbare data hangt af van apps en apparaten die de gebruiker met Health
  Connect verbindt.
- Achtergrondlezen vereist een afzonderlijke permission.
- Historische leestoegang en exercise routes hebben specifieke platformregels.

## Algemene recordmetadata

Elk `Record` kan bevatten:

- Health Connect `id`;
- `lastModifiedTime`;
- `dataOrigin` met package name;
- `device` met fabrikant, model en type;
- `clientRecordId`;
- `clientRecordVersion`;
- recording method;
- tijd/interval en zone offsets.

Recording methods:

- unknown;
- manual entry;
- automatically recorded;
- actively recorded.

Body behoudt deze classificatie. Een ontbrekende waarde wordt nooit als nul
geschreven; nul mag alleen echte, geobserveerde inactiviteit betekenen.

## Activity-records

- `ActiveCaloriesBurnedRecord`
- `ActivityIntensityRecord`
- `CyclingPedalingCadenceRecord`
- `DistanceRecord`
- `ElevationGainedRecord`
- `ExerciseSessionRecord`
- `FloorsClimbedRecord`
- `PlannedExerciseSessionRecord`
- `PowerRecord`
- `SpeedRecord`
- `StepsCadenceRecord`
- `StepsRecord`
- `TotalCaloriesBurnedRecord`
- `Vo2MaxRecord`
- `WheelchairPushesRecord`

Exercise sessions kunnen route- en segmentinformatie bevatten. Series-records
bevatten samples binnen een start/eindinterval.

## Body-measurement-records

- `BasalMetabolicRateRecord`
- `BodyFatRecord`
- `BodyWaterMassRecord`
- `BoneMassRecord`
- `HeightRecord`
- `LeanBodyMassRecord`
- `WeightRecord`

## Cycle-tracking-records

- `BasalBodyTemperatureRecord`
- `CervicalMucusRecord`
- `IntermenstrualBleedingRecord`
- `MenstruationFlowRecord`
- `MenstruationPeriodRecord`
- `OvulationTestRecord`
- `SexualActivityRecord`

## Nutrition-records

- `HydrationRecord`
- `NutritionRecord`

Nutrition bevat energie en voedingsstoffen als optionele velden. Body behandelt
ontbrekende voedingsstoffen als onbekend, niet als nul.

## Sleep-records

- `SleepSessionRecord`

Een sessie kan slaapstadia als segments bevatten. Body bewaart de originele
stageclassificatie, grenzen, titel/notities en bron in plaats van stadia van
verschillende providers zonder context samen te voegen.

## Vitals-records

- `BloodGlucoseRecord`
- `BloodPressureRecord`
- `BodyTemperatureRecord`
- `HeartRateRecord`
- `HeartRateVariabilityRmssdRecord`
- `OxygenSaturationRecord`
- `RespiratoryRateRecord`
- `RestingHeartRateRecord`
- `SkinTemperatureRecord`

Voor bloedglucose blijven specimen source, meal type en relation to meal
behouden. Voor bloeddruk blijven body position en measurement location
behouden. Temperatuur behoudt measurement location. Skin temperature kan een
baseline en deltas bevatten.

## Wellness-records

- `MindfulnessSessionRecord`
- `AlcoholConsumptionRecord` wanneer ondersteund door de actieve
  platform/library-versie.

## Geverifieerde recordvormen en verplichte velden

`metadata` is verplicht op ieder record en blijft hieronder expliciet onderdeel
van het contract.

| Record | Vorm | Verplichte inhoud |
|---|---|---|
| Active calories | interval | `energy`, `startTime`, `endTime`, `metadata` |
| Activity intensity | interval | `activityIntensityType`, tijden, `metadata` |
| Basal body temperature | instant | `temperature`, `measurementLocation`, `time`, `metadata` |
| Basal metabolic rate | instant | `basalMetabolicRate`, `time`, `metadata` |
| Blood glucose | instant | `level`, `specimenSource`, `mealType`, `relationToMeal`, `time`, `metadata` |
| Blood pressure | instant | `systolic`, `diastolic`, `bodyPosition`, `measurementLocation`, `time`, `metadata` |
| Body fat | instant | `percentage`, `time`, `metadata` |
| Body temperature | instant | `temperature`, `measurementLocation`, `time`, `metadata` |
| Body water mass | instant | `mass`, `time`, `metadata` |
| Bone mass | instant | `mass`, `time`, `metadata` |
| Cervical mucus | instant | `appearance`, `sensation`, `time`, `metadata` |
| Cycling cadence | series | `samples`, `startTime`, `endTime`, `metadata` |
| Distance | interval | `distance`, tijden, `metadata` |
| Elevation gained | interval | `elevation`, tijden, `metadata` |
| Exercise | interval | `exerciseType`, `laps`, `segments`, tijden, `metadata` |
| Floors climbed | interval | `floors`, tijden, `metadata` |
| Heart rate | series | `samples`, tijden, `metadata` |
| HRV RMSSD | instant | `heartRateVariabilityMillis`, `time`, `metadata` |
| Height | instant | `height`, `time`, `metadata` |
| Hydration | interval | `volume`, tijden, `metadata` |
| Intermenstrual bleeding | instant | `time`, `metadata` |
| Lean body mass | instant | `mass`, `time`, `metadata` |
| Menstruation flow | instant | `flow`, `time`, `metadata` |
| Menstruation period | interval | tijden, `metadata` |
| Mindfulness | interval | `mindfulnessSessionType`, tijden, `metadata` |
| Nutrition | interval | `mealType`, tijden, `metadata`; nutrientvelden zijn optioneel |
| Ovulation test | instant | `result`, `time`, `metadata` |
| Oxygen saturation | instant | `percentage`, `time`, `metadata` |
| Planned exercise | interval | `block`, `exerciseType`, `hasExplicitTime`, `endTime`, `metadata` |
| Power | series | `samples`, tijden, `metadata` |
| Respiratory rate | instant | `rate`, `time`, `metadata` |
| Resting heart rate | instant | `beatsPerMinute`, `time`, `metadata` |
| Sexual activity | instant | `protectionUsed`, `time`, `metadata` |
| Skin temperature | series | `deltas`, `measurementLocation`, tijden, `metadata` |
| Sleep session | interval | `stages`, tijden, `metadata` |
| Speed | series | `samples`, tijden, `metadata` |
| Steps | interval | `count`, tijden, `metadata` |
| Steps cadence | series | `samples`, tijden, `metadata` |
| Total calories | interval | `energy`, tijden, `metadata` |
| VO2 max | instant | `measurementMethod`, `vo2MillilitersPerMinuteKilogram`, `time`, `metadata` |
| Weight | instant | `weight`, `time`, `metadata` |
| Wheelchair pushes | interval | `count`, tijden, `metadata` |

## Aggregaties

Health Connect biedt officiële aggregaties per recordtype, waaronder:

- actieve en totale calorieën;
- activiteits- en intensiteitsduur;
- bloeddruk min/max/gemiddelde;
- cadans min/max/gemiddelde;
- afstand, hoogte, floors en stappen;
- hartslag min/max/gemiddelde;
- voedingstotalen;
- power, snelheid en andere seriestatistieken.

Body gebruikt waar mogelijk de officiële origin-aware aggregatie om
dubbeltelling tussen apps/apparaten te vermijden, maar bewaart ook de
onderliggende bronrecords voor audit en detail.

## Medische records

Nieuwere Health Connect-versies ondersteunen ook medical records en een
`MedicalDataSource`. Dit is een afzonderlijke scope met andere product-,
privacy- en validatie-eisen. Body activeert dit niet impliciet via algemene
wellnesspermissies.

## Synchronisatiecontract

- Initial sync met expliciet tijdvenster.
- Daarna changes token/feed voor inserts, updates en deletes.
- Idempotentie via Health Connect ID en client record ID/version.
- Tijdzone-offset altijd bewaren; ontbreken expliciet markeren.
- Data-origin en device nooit wegaggregateren.
- De gebruiker kan permissies intrekken en records verwijderen; Body moet dat
  door de volledige afgeleide keten verwerken.

## Permissions en featuregates

- Ieder record gebruikt zijn eigen `READ_*` en `WRITE_*` permission.
- Cycling cadence gebruikt de exercise-permission.
- Exercise routes vereisen afzonderlijk `READ_EXERCISE_ROUTE` en
  `WRITE_EXERCISE_ROUTE`.
- Activity intensity, mindfulness, planned exercise en skin temperature zijn
  feature-gated.
- Historische data ouder dan dertig dagen vereist
  `READ_HEALTH_DATA_HISTORY`.
- Achtergrondlezen vereist `READ_HEALTH_DATA_IN_BACKGROUND`.

## Open restwerk

De verplichte velden en recordvormen zijn nu vastgelegd. Voor implementatie
blijven de volledige optionele velden, units/ranges, minimumversies,
exercise-/sleep-segmentdetails en exacte feature-availability nog te koppelen.
