# Polar AccessLink API v3 — veldinventaris

Status: **veld-compleet voor de publieke AccessLink v3-schema’s**

Primaire bronnen:

- Officiële documentatie: https://www.polar.com/accesslink-api/
- Officiële OpenAPI: https://www.polar.com/accesslink-api/swagger.yaml

## Integratiebeperkingen

- OAuth2 met `accesslink.read_all` en alle verplichte Polar-consents is vereist.
- Een gebruiker moet bij de client worden geregistreerd voordat data beschikbaar
  wordt.
- Beschikbaarheid hangt af van het Polar-apparaat, sensoren, gekozen features,
  synchronisatie en de sport.
- Oude transactionele activity- en physical-info-endpoints zijn deprecated; Body
  gebruikt de niet-transactionele endpoints.
- Provider-afleidingen blijven herkenbaar als Polar-data en worden niet als eigen
  Body-metingen voorgesteld.

## Fysiek profiel

`weight`, `height`, `birthday`, `gender`, `maximum_heart_rate`,
`resting_heart_rate`, `aerobic_threshold`, `anaerobic_threshold`, `vo2_max`,
`weight_source`, `training_background`, `typical_day`, `sleep_goal`, `created`,
`modified`.

## Dagelijkse activiteit

### Samenvatting

`start_time`, `end_time`, `active_duration`, `inactive_duration`,
`daily_activity`, `calories`, `active_calories`, `steps`,
`inactivity_alert_count`, `distance_from_steps`.

### Activiteitssamples

- Stappen: `steps`, `timestamp`.
- Activiteitszone: `zone`, `timestamp`.
- Zones: `SLEEP`, `SEDENTARY`, `LIGHT`, `MODERATE`, `VIGOROUS`; oudere
  tijdreeksen kunnen ook `NON_WEAR` onderscheiden.
- Samenvattingen kunnen alle samples als geneste `samples` leveren.

## Continue hartslag

Per dag:

- `polar_user`
- `date`
- `heart_rate_samples[]`
  - `heart_rate` in bpm
  - `sample_time`

De standaard is een gemiddelde per vijf minuten; op sommige momenten kunnen
samples frequenter voorkomen.

## Exercise

### Kernvelden

`id`, `upload-time`, `polar-user`, `transaction-id`, `device`, `device-id`,
`start-time`, `start-time-utc-offset`, `duration`, `calories`, `distance`,
`heart-rate.average`, `heart-rate.maximum`, `training-load`, `sport`,
`detailed-sport-info`, `has-route`, `club-id`, `club-name`.

### Energie en performance

`fat-percentage`, `carbohydrate-percentage`, `protein-percentage`,
`running-index`.

### Training Load Pro

`date`, `cardio-load`, `muscle-load`, `perceived-load`,
`cardio-load-interpretation`, `muscle-load-interpretation`,
`perceived-load-interpretation`, `user-rpe`.

### Exercise-sampletypes

| Sleutel | Signaal | Eenheid |
|---:|---|---|
| 0 | Hartslag | bpm |
| 1 | Snelheid | km/h |
| 2 | Cadans | rpm |
| 3 | Hoogte | m |
| 4 | Vermogen | W |
| 5 | Pedaling index | % |
| 6 | Links-rechts-vermogensbalans | % |
| 7 | Luchtdruk | hPa |
| 8 | Loopcadans | spm |
| 9 | Temperatuur | °C |
| 10 | Afstand | m |
| 11 | RR-interval | ms |

Elk sampleobject bevat `recording-rate`, `sample-type` en `data`. RR-intervallen
kunnen expliciete ontbrekende samples bevatten en vereisen compatibele sensoren.

### Route

Routepunten bevatten `latitude`, `longitude`, `time`, `satellites` en `fix`.
Exercises kunnen ook als FIT, TCX en GPX beschikbaar zijn.

### Hartslagzones

Per zone: `index`, `lower-limit`, `upper-limit`, `in-zone`.

## Cardio Load

Per dag:

`date`, `cardio_load_status`, `cardio_load`, `strain`, `tolerance`,
`cardio_load_ratio`, plus grenzen voor `very_low`, `low`, `medium`, `high` en
`very-high`.

Dit zijn Polar-afleidingen. De exacte bronwaarden en status moeten behouden
blijven, inclusief `not available`.

## Sleep Plus Stages

### Tijd en bron

`polar_user`, `date`, `sleep_start_time`, `sleep_end_time`, `device_id`.

### Duur, stadia en onderbrekingen

`light_sleep`, `deep_sleep`, `rem_sleep`, `unrecognized_sleep_stage`,
`total_interruption_duration`, `short_interruption_duration`,
`long_interruption_duration`, `sleep_cycles`, `hypnogram`.

### Kwaliteit en doelen

`continuity`, `continuity_class`, `sleep_score`, `sleep_charge`, `sleep_goal`,
`sleep_rating`, `group_duration_score`, `group_solidity_score`,
`group_regeneration_score`.

### Samples

`heart_rate_samples`, geïndexeerd op tijdstip.

## Nightly Recharge

`polar_user`, `date`, `heart_rate_avg`, `beat_to_beat_avg`,
`heart_rate_variability_avg`, `breathing_rate_avg`,
`nightly_recharge_status`, `ans_charge`, `ans_charge_status`, `hrv_samples`,
`breathing_samples`.

De kernwaarden zijn gebaseerd op Polar’s nachtvenster en algoritmen; Body
presenteert ze niet als onafhankelijk gereconstrueerde waarden.

## SleepWise

### Alertness

`grade`, `grade_validity_seconds`, `grade_type`, `grade_classification`,
`validity`, `sleep_inertia`, `sleep_type`, `result_type`,
`period_start_time`, `period_end_time`, `sleep_period_start_time`,
`sleep_period_end_time`, `sleep_timezone_offset_minutes`, `hourly_data`.

Uurdata bevat `validity`, `alertness_level`, `start_time`, `end_time`.

### Circadian bedtime

`validity`, `quality`, `result_type`, `period_start_time`, `period_end_time`,
`preferred_sleep_period_start_time`, `preferred_sleep_period_end_time`,
`sleep_gate_start_time`, `sleep_gate_end_time`,
`sleep_timezone_offset_minutes`.

## Elixir Biosensing

### Lichaamstemperatuurreeks

Per periode: `source_device_id`, `measurement_type`, `sensor_location`,
`start_time`, `end_time`, `modified_time`, `samples`.

Per sample: `temperature_celsius`, `recording_time_delta_milliseconds`.

### Slaaphuidtemperatuur

`sleep_time_skin_temperature_celsius`, `deviation_from_baseline_celsius`,
`sleep_date`.

### Huidcontact

Per periode: `source_device_id`, `start_time`, `end_time`, `modified_time`,
`skin_contact_changes`.

Per wijziging: `skin_contact`, `recording_time_delta_milliseconds`.

### Pols-ECG-test

`source_device_id`, `test_time`, `time_zone_offset`,
`average_heart_rate_bpm`, `heart_rate_variability_ms`,
`heart_rate_variability_level`, `rri_ms`, `pulse_transit_time_systolic_ms`,
`pulse_transit_time_diastolic_ms`, `pulse_transit_time_quality_index`,
`samples`, `quality_measurements`.

ECG-samples bevatten `recording_time_delta_ms` en `amplitude_mv`.
Kwaliteitssamples bevatten `recording_time_delta_ms` en `quality_level`.

### SpO2-test

`source_device_id`, `test_time`, `time_zone_offset`, `test_status`,
`blood_oxygen_percent`, `spo2_class`, `spo2_value_deviation_from_baseline`,
`spo2_quality_average_percent`, `average_heart_rate_bpm`,
`heart_rate_variability_ms`, `spo2_hrv_deviation_from_baseline`,
`altitude_meters`.

Testresultaten zijn geen continue klinische monitoring en krijgen geen
diagnostische presentatie.

## Synchronisatie en provenance

Body bewaart voor elk Polar-record:

- endpoint en exact bronveld;
- Polar-user, record-ID, device-ID en sportcontext;
- meet-, upload- en ontvangsttijd plus tijdzone-offset;
- oorspronkelijke eenheid en eventuele conversie;
- recording rate en sampletype;
- `measured`, `provider_derived`, `user_entered` of `metadata`;
- quality/status/validity en ontbrekendheidsreden;
- oorspronkelijke payloadversie voor herverwerking.
