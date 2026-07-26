# Oura API v2 — veldinventaris

Status: **veld-compleet voor de publieke Oura API v2, OpenAPI 1.37**

Primaire bron:

- Oura API-documentatie: https://cloud.ouraring.com/v2/docs
- Officiële OpenAPI-specificatie: https://cloud.ouraring.com/v2/static/json/openapi-1.37.json

## Integratie- en productbeperkingen

- OAuth2 is vereist voor gebruikersdata.
- Een applicatie die data van meer dan tien gebruikers ophaalt, moet door Oura worden goedgekeurd.
- Beschikbaarheid van data hangt af van apparaatgeneratie, firmware, draaggedrag, abonnement en algoritmische verwerking door Oura.
- Oura-scores en contributors zijn provider-afgeleide waarden. Body bewaart ze met `source=oura` en behandelt ze niet als eigen, uit ruwe signalen reproduceerbare berekeningen.
- De API bevat geen algemene, onbeperkte ruwe sensordump.

## Persoon en profiel

| Oura-veld | Betekenis | Eenheid / type |
|---|---|---|
| `id` | Oura-gebruikers-ID | string |
| `age` | Leeftijd | jaren |
| `weight` | Gewicht | kg |
| `height` | Lengte | m |
| `biological_sex` | Biologisch geslacht | enum |
| `email` | Account-e-mail | string |

## Dagactiviteit

### Hoofdrecord

`id`, `day`, `timestamp`, `score`, `active_calories`, `total_calories`,
`average_met_minutes`, `equivalent_walking_distance`, `steps`,
`high_activity_met_minutes`, `high_activity_time`,
`medium_activity_met_minutes`, `medium_activity_time`,
`low_activity_met_minutes`, `low_activity_time`,
`sedentary_met_minutes`, `sedentary_time`, `resting_time`,
`non_wear_time`, `inactivity_alerts`, `meters_to_target`,
`target_calories`, `target_meters`.

### Tijdreeksen

- `class_5_min`: per vijf minuten een classificatie voor non-wear, rust,
  inactief, lage, middelmatige of hoge activiteit.
- `met`: bemonsterde MET-reeks met `timestamp`, `interval` en `items`.

### Activity-scorecontributors

`meet_daily_targets`, `move_every_hour`, `recovery_time`, `stay_active`,
`training_frequency`, `training_volume`; ieder in bereik 1–100 wanneer
beschikbaar.

## Readiness

### Hoofdrecord

`id`, `day`, `timestamp`, `score`, `temperature_deviation`,
`temperature_trend_deviation`.

### Readiness-contributors

`activity_balance`, `body_temperature`, `hrv_balance`,
`previous_day_activity`, `previous_night`, `recovery_index`,
`resting_heart_rate`, `sleep_balance`, `sleep_regularity`; ieder in bereik
1–100 wanneer beschikbaar.

## Cardiovasculaire leeftijd

| Veld | Betekenis |
|---|---|
| `day` | Dag van de voorspelling |
| `pulse_wave_velocity` | Afgeleide polsgolfsnelheid in m/s |
| `vascular_age` | Voorspelde vasculaire leeftijd, bereik 18–100 |

Deze waarden zijn Oura-afleidingen, geen medische diagnose.

## Resilience

`id`, `day`, `level`, plus de contributors:

- `sleep_recovery` (0–100)
- `daytime_recovery` (0–100)
- `stress` (0–100)

## Dagelijkse slaapscore

### Hoofdrecord

`id`, `day`, `timestamp`, `score`.

### Sleep-scorecontributors

`deep_sleep`, `efficiency`, `latency`, `rem_sleep`, `restfulness`, `timing`,
`total_sleep`; ieder in bereik 1–100 wanneer beschikbaar.

## Slaapperioden en slaapfysiologie

### Identiteit en tijd

`id`, `day`, `bedtime_start`, `bedtime_end`, `period`, `type`, `ring_id`,
`time_in_bed`, `total_sleep_duration`.

### Slaapstadia en gedrag

`awake_time`, `deep_sleep_duration`, `light_sleep_duration`,
`rem_sleep_duration`, `latency`, `efficiency`, `restless_periods`,
`movement_30_sec`, `sleep_phase_30_sec`, `sleep_phase_5_min`,
`app_sleep_phase_5_min`.

`app_sleep_phase_5_min` is in de officiële specificatie als toekomstig te
verwijderen gemarkeerd en mag daarom niet de enige interne bron zijn.

### Hart, ademhaling en temperatuurgerelateerde slaapdata

`average_breath`, `average_heart_rate`, `lowest_heart_rate`, `average_hrv`,
`heart_rate` (bemonsterde reeks), `hrv` (bemonsterde reeks).

Oura waarschuwt dat de gemiddelde en laagste hartslag in dit endpoint anders
kunnen worden berekend dan de waarden die de Oura-app toont.

### Algoritme en score-effect

`readiness`, `readiness_score_delta`, `sleep_score_delta`,
`sleep_algorithm_version`, `sleep_analysis_reason`, `low_battery_alert`.

## SpO2 en ademhalingsverstoringen

| Veld | Betekenis |
|---|---|
| `day` | Dag |
| `spo2_percentage.average` | Gemiddelde dagelijkse SpO2 |
| `breathing_disturbance_index` | Oura BDI op basis van gedetecteerde SpO2-dalingen |

Deze data mag niet als diagnose van slaapapneu of een andere aandoening worden
gepresenteerd.

## Dagelijkse stress

`id`, `day`, `day_summary`, `recovery_high`, `stress_high`.

- `recovery_high`: seconden in Oura's hoge-herstelzone.
- `stress_high`: seconden in Oura's hoge-stresszone.
- `day_summary`: providerclassificatie van de volledige dag.

## Hartslag

Discrete samples bevatten:

- `timestamp`
- `timestamp_unix`
- `bpm`
- `source`

De bronwaarde moet behouden blijven om context en meetwijze te onderscheiden.

## Workouts

`id`, `day`, `activity`, `label`, `start_datetime`, `end_datetime`,
`calories`, `distance`, `intensity`, `source`.

## Sessions / Moments

`id`, `day`, `start_datetime`, `end_datetime`, `type`, `mood`,
`heart_rate`, `heart_rate_variability`, `motion_count`.

De drie laatstgenoemde velden zijn bemonsterde reeksen.

## VO2 max

`id`, `day`, `timestamp`, `vo2_max`.

Dit is een Oura-schatting en moet als zodanig worden gelabeld.

## Slaaptijdadvies

`id`, `day`, `optimal_bedtime`, `recommendation`, `status`.

Een optimaal-bedtijdvenster bevat `day_tz`, `start_offset` en `end_offset`.

## Rustmodus

### Periode

`id`, `start_day`, `start_time`, `end_day`, `end_time`, `episodes`.

### Episode

`timestamp`, `tags`.

## Tags

### Enhanced tags

`id`, `tag_type_code`, `custom_name`, `comment`, `start_time`, `end_time`,
`start_day`, `end_day`.

### Legacy tags

`id`, `day`, `timestamp`, `text`, `tags`.

## Ring en batterij

### Batterijsamples

`timestamp`, `timestamp_unix`, `charging`, `in_charger`, `level`.

### Ringconfiguratie

`id`, `color`, `design`, `firmware_version`, `hardware_type`, `set_up_at`,
`size`.

## Body-normalisatie

Bij ingest bewaart Body naast de canonieke waarde altijd:

- provider en provider-record-ID;
- exact Oura-bronveld en endpoint;
- bron- en ontvangsttijd;
- tijdzone;
- eenheid en eventuele conversie;
- sample-interval;
- provider-algoritmeversie wanneer geleverd;
- apparaat/ring-ID en firmware wanneer beschikbaar;
- provenance: `measured`, `provider_derived`, `user_entered` of `metadata`;
- ontbrekendheidsreden in plaats van een verzonnen nulwaarde.

Oura-scores worden nooit stilzwijgend samengevoegd met een eigen Body-score.
