# Samsung Health Data SDK — datainventaris

Status: **type-compleet voor SDK 1.1.0; exacte velden per type nog te extraheren**

Primaire bronnen:

- Overzicht: https://developer.samsung.com/health/data/overview.html
- API-referentie: https://developer.samsung.com/health/data/api-reference/index.html
- Data access: https://developer.samsung.com/health/data/guide/features/data-access.html
- Release notes: https://developer.samsung.com/health/data/release-note.html

## Platform en toegang

- Android 10/API 29 of hoger.
- Samsung Health 6.30.2 of hoger.
- Java 17 of hoger.
- Geen emulatorondersteuning.
- Gebruikerstoestemming per datatype.
- Lezen kan in developer mode worden getest; schrijven en distributie vereisen
  een Samsung-partnership.
- Dit is een native Android-SDK, geen browser-API.
- Samsung classificeert de data voor fitness en wellness, niet voor diagnose of
  behandeling.

## Algemene recordmetadata

Ieder datapunt kan een unieke ID en datasource bevatten. De datasource verwijst
naar de app en het apparaat dat de waarde oorspronkelijk heeft gemeten.

Ondersteunde synchronisatielogica:

- lezen met tijd- en bronfilters;
- aggregaties per datatype;
- change feed met `UPSERT` en `DELETE`;
- associated reads;
- inserts, updates en deletes voor ondersteunde writable types;
- client data ID voor eigen ingevoerde records.

Body bewaart deze provenance en behandelt aggregaten niet als ruwe samples.

## Read-datatypes

- Activity summary
- Active calories burned goal
- Active time goal
- Blood glucose
- Blood oxygen
- Blood pressure
- Body composition
- Body temperature
- Energy score
- Exercise
- Exercise location
- Floors climbed
- Heart rate
- Irregular heart rhythm notification
- Nutrition
- Nutrition goal
- Skin temperature
- Sleep
- Sleep apnea
- Sleep goal
- Steps
- Step goal
- Water intake
- Water intake goal
- User profile

## Write-datatypes

- Blood glucose
- Blood oxygen
- Blood pressure
- Body composition
- Body temperature
- Exercise
- Exercise location
- Floors climbed
- Heart rate
- Nutrition
- Sleep
- Water intake

Body schrijft alleen waarden die de gebruiker of Body zelf heeft gecreëerd en
probeert nooit records van een andere bron te overschrijven of verwijderen.

## Belangrijke dataverbanden

- Exercise kan gekoppelde Exercise Location-data hebben.
- Sleep kan gekoppelde Blood Oxygen- en Skin Temperature-data hebben.
- Health records kunnen afkomstig zijn van Galaxy Watch, Galaxy Ring, telefoon,
  weegschaal of andere verbonden bronnen.
- Aggregaties kunnen waarden over meerdere apparaten samenvoegen; de onderliggende
  bronnen moeten waar mogelijk afzonderlijk traceerbaar blijven.

## Algemene velden

Health datapoints gebruiken, afhankelijk van instant of interval:

- `uid`;
- `startTime`;
- `endTime` waar relevant;
- `zoneOffset`;
- `dataSource` met package en device ID.

## Exacte velden per publiek datatype

### Activity summary en goals

Activity Summary biedt officiële aggregaties voor totale actieve tijd, actieve
calorieën, totale calorieën en afstand. De goaltypes bevatten de targets voor
actieve calorieën, actieve tijd, stappen, slaap, voeding en water. Goals blijven
aparte records en worden niet als metingen opgeslagen.

### Steps en floors

- Steps: source-aware total-step aggregation.
- Floors: `FLOOR` plus interval en algemene velden.

### Hartslag en bloedzuurstof

Hartslag:

- required `HEART_RATE`;
- optional continuous `SERIES_DATA`;
- `MIN_HEART_RATE`;
- `MAX_HEART_RATE`.

Bloedzuurstof:

- required `OXYGEN_SATURATION`;
- optional continuous `SERIES_DATA`;
- `MIN_OXYGEN_SATURATION`;
- `MAX_OXYGEN_SATURATION`.

### Bloedglucose

- required `GLUCOSE_LEVEL` in mmol/L;
- required `MEASUREMENT_TYPE`;
- required `MEAL_STATUS`;
- optional continuous `SERIES_DATA`;
- `MEAL_TIME`;
- `INSULIN_INJECTED`;
- `MEDICATION_TAKEN`;
- `SAMPLE_SOURCE_TYPE`.

### Bloeddruk

- required `SYSTOLIC`;
- required `DIASTOLIC`;
- required `MEAN`;
- optional `PULSE_RATE`;
- optional `MEDICATION_TAKEN`.

Pressure is expressed in mmHg.

### Body composition

- required `WEIGHT` in kg;
- `HEIGHT` in cm;
- `BASAL_METABOLIC_RATE` in kcal/day;
- `BODY_FAT` percentage;
- `BODY_FAT_MASS` kg;
- `FAT_FREE` percentage;
- `FAT_FREE_MASS` kg;
- `MUSCLE_MASS` percentage;
- `SKELETAL_MUSCLE` percentage;
- `SKELETAL_MUSCLE_MASS` kg;
- `TOTAL_BODY_WATER` liter;
- Samsung-calculated `BODY_MASS_INDEX`.

### Temperatuur

- Body temperature: required `BODY_TEMPERATURE` in Celsius.
- Skin temperature: required `SKIN_TEMPERATURE`, optional continuous
  `SERIES_DATA`, minimum and maximum skin temperature.

### Provider scores en flags

- Energy Score: required `ENERGY_SCORE`.
- Irregular rhythm notification: required `STATUS`.
- Sleep apnea: required `DETECTED_SIGN`.

Dit zijn Samsung-outputs. Body leidt hun classificatie niet zelf af uit
ongerelateerde records.

### Nutrition

Required:

- `CALORIES`;
- `TITLE`;
- `MEAL_TYPE`.

Optional:

`CALCIUM`, `CARBOHYDRATE`, `CHOLESTEROL`, `DIETARY_FIBER`, `IRON`,
`MONOSATURATED_FAT`, `POLYSATURATED_FAT`, `POTASSIUM`, `PROTEIN`,
`SATURATED_FAT`, `SODIUM`, `SUGAR`, `TOTAL_FAT`, `TRANS_FAT`, `VITAMIN_A`,
`VITAMIN_C`.

Ontbrekende nutrientvelden blijven onbekend.

### Water intake

Required `AMOUNT` in milliliters.

### Exercise

Top-level:

- required `EXERCISE_TYPE`;
- required `SESSIONS[]`;
- optional `CUSTOM_TITLE`.

Elke `ExerciseSession` bevat required start/end time, exercise type, duration
en calories. Optionele detailvelden omvatten route, exercise log, swimming log,
distance, count/type, title/comment, altitude gain/loss, maximum altitude,
incline/decline distance en exercise-specific extrema.

Een `ExerciseLog` kan timestamp, heart rate, speed, cadence, count en power
bevatten. Multi-session activities kunnen meerdere niet-overlappende sessions
gebruiken.

### Sleep

Top-level:

- required `DURATION`;
- required `SESSIONS[]`;
- optional `SLEEP_SCORE`.

Elke `SleepSession` bevat required start time, end time en duration, plus
optionele stages. Iedere stage bevat required start time, end time en stage.

### User profile

`DATE_OF_BIRTH`, `HEIGHT`, `WEIGHT`, `GENDER`, `NICKNAME`.

## Expliciete aggregatievoorbeelden

- totaal stappen;
- totale actieve tijd uit Activity Summary;
- laatste doel voor actieve tijd;
- minimum- en maximumhartslag.

## Productimplicatie

Samsung Health Data SDK is voor Body een directe Android-native route. Data die
ook via Android Health Connect binnenkomt, wordt niet dubbel geteld: deduplicatie
gebruikt datasource, apparaat, tijd, client ID, provider-ID en payloadsignatuur.

## Remaining gates

De primaire publieke velden zijn nu geïnventariseerd. Voor implementatie moeten
enumwaarden, alle exercise/swimming/location-logvelden, goal payloads,
device/firmware-gates en de capabilitymatrix per type nog machine-verifieerbaar
worden vastgelegd.
