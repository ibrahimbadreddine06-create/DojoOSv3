# Withings Health Data API — beschikbare datainventaris

Status: **verified-complete voor de publieke Health Data API-specificatie;
contract-, regio- en devicegates blijven runtimevoorwaarden**

Primaire bronnen:

- Beschikbare gezondheidsdata: https://developer.withings.com/developer-guide/v3/data-api/all-available-health-data/
- API-referentie: https://developer.withings.com/api-reference/
- In de developerwebsite ingebedde OpenAPI 3.0.3-specificatie, versie 2.0
  (uitgelezen op 2026-07-25)
- Publieke integratiegids: https://developer.withings.com/developer-guide/v3/integration-guide/public-health-data-api/public-health-data-api-overview/
- Raw Data API: https://developer.withings.com/developer-guide/v3/integration-guide/public-health-data-api/data-api/raw-data/

## Kritieke beschikbaarheidsregels

- OAuth2 en expliciete scopes zijn vereist.
- De gebruiker installeert en synchroniseert apparaten via de Withings-app.
- Beschikbaarheid verschilt per apparaat, land/regio, API-plan en contract.
- Sleep/Sleep Rx is volgens Withings alleen in de VS beschikbaar; Sleep
  Analyzer in de EU, Australië en het VK.
- Raw PPG- en accelerometerdata is alleen voor gecontracteerde partners en zet
  een apparaat in een speciale capturemodus met sterk hoger batterijverbruik.
- Aangekondigde maar nog niet beschikbare scores zijn geen productievelden.

## Algemene meetstructuur

`POST https://wbsapi.withings.net/measure`, action `getmeas`, levert
`body.measuregrps[]`. Iedere groep bevat `grpid`, `attrib`, `date`, `created`,
`modified`, `category`, `deviceid`/`hash_deviceid`, `model`, `model_id` en
`measures[]`. Een meting bevat `value`, `type`, `unit` en optioneel `position`;
de echte SI-waarde is `value * 10^unit`.

`attrib` bewaart onder meer device-toewijzing, ambiguïteit, manuele invoer en
bevestiging. `category=1` is een meting; `category=2` een gebruikersdoel. Body
vermengt doelen niet met observaties.

| `type` | Publieke betekenis |
|---:|---|
| 1 | gewicht (kg) |
| 4 | lengte (m) |
| 5 | vetvrije massa (kg) |
| 6 | vetpercentage |
| 8 | vetmassa (kg) |
| 9 | diastolische bloeddruk (mmHg) |
| 10 | systolische bloeddruk (mmHg) |
| 11 | pols (bpm; BPM- en schaalapparaten) |
| 12 | temperatuur (°C) |
| 54 | SpO2 (%) |
| 71 | lichaamstemperatuur (°C) |
| 73 | huidtemperatuur (°C) |
| 76 | spiermassa (kg) |
| 77 | hydratatiemassa (kg) |
| 88 | botmassa (kg) |
| 91 | polsgolfsnelheid (m/s) |
| 123 | VO2 max (ml/min/kg) |
| 130 | AFib-classificatie |
| 135–138 | QRS-, PR-, QT- en QTc-interval |
| 139 | AFib-classificatie uit PPG |
| 155 | vasculaire leeftijd |
| 167 | Nerve Health Score, geleiding via twee voetelektroden |
| 168–169 | extracellulair en intracellulair water (kg) |
| 170 | visceraal vet |
| 173–175 | segmentale vetvrije, vet- en spiermassa |
| 196 | Nerve Response Score |
| 226 | basaal metabolisme |
| 227 | metabole leeftijd |
| 229 | elektrochemische huidgeleiding |

## Activiteit

`Measure v2 - Getactivity` levert per dag:

`date`, `timezone`, `deviceid`, `hash_deviceid`, `brand`, `is_tracker`,
`modified`, `model`, `modelid`, `steps`, `distance`, `elevation`, `soft`,
`moderate`, `intense`, `active`, `calories`, `totalcalories`, `hr_average`,
`hr_min`, `hr_max`, `hr_zone_0`, `hr_zone_1`, `hr_zone_2`, `hr_zone_3`.

`Measure v2 - Getintradayactivity` levert een timestamp-keyed serie met
`deviceid`, `model`, `model_id`, `steps`, `elevation`, `calories`, `distance`,
`stroke`, `pool_lap`, `duration`, `heart_rate`, `spo2_auto`, `rmssd`, `sdnn1`,
`hrv_quality`, `core_body_temperature`, `rr` en `chest_movement_rate`.

`Measure v2 - Getworkouts` levert per workout `id`, `category`, `timezone`,
`model`, `attrib`, `startdate`, `enddate`, `date`, `modified`, `deviceid` en:

`algo_pause_duration`, `calories`, `core_body_temperature_avg`,
`core_body_temperature_max`, `core_body_temperature_min`,
`core_body_temperature_status`, `distance`, `elevation`, `hr_average`,
`hr_max`, `hr_min`, `hr_zone_0..3`, `intensity`, `manual_calories`,
`manual_distance`, `manual_intensity`, `pause_duration`, `pool_laps`,
`pool_length`, `spo2_average`, `steps`, `strokes`.

## Slaap

`Sleep v2 - Get` levert tijdssegmenten met `startdate`, `enddate`, `state`,
`model` en `model_id`. `state` onderscheidt wakker, licht, diep, REM, manueel,
ongespecificeerd en — alleen met een specifiek plan — uit bed. Optionele
timestampseries zijn `hr`, `rr`, `snoring`, `sdnn_1`, `rmssd`, `hrv_quality`,
`mvt_score`, `chest_movement_rate`, `withings_index` en `breathing_sounds`.

`Sleep v2 - Getsummary` levert `id`, `timezone`, `model`, `model_id`,
`startdate`, `enddate`, `date`, `created`, `modified`, `hash_deviceid`,
`completed` en:

`total_timeinbed`, `total_sleep_time`, `asleepduration`,
`lightsleepduration`, `remsleepduration`, `deepsleepduration`,
`sleep_efficiency`, `sleep_latency`, `wakeup_latency`, `wakeupduration`,
`wakeupcount`, `waso`, `nb_rem_episodes`, `durationtosleep` (deprecated),
`durationtowakeup` (deprecated), `out_of_bed_count`, `hr_average`, `hr_min`,
`hr_max`, `rr_average`, `rr_min`, `rr_max`,
`breathing_quality_assessment`, `breathing_disturbances_intensity`, `snoring`,
`snoringepisodecount`, `sleep_score`, `night_events`,
`apnea_hypopnea_index`, `mvt_score_avg`, `mvt_active_duration`,
`rmssd_start_avg`, `rmssd_end_avg`,
`chest_movement_rate_wellness_average/min/max`, `withings_index`,
`breathing_sounds`, `breathing_sounds_episode_count`,
`chest_movement_rate_average/min/max`, `core_body_temperature_min/max/avg` en
`core_body_temperature_status`.

Medisch gereguleerde waarden worden alleen getoond wanneer apparaat, regio en
toegangsplan ze legaal en technisch leveren. Body leidt geen diagnose af uit
wellnessdata.

## ECG, bloeddruk en ritme

`Heart v2 - List` levert per opname `deviceid`, `model`, `timestamp`,
`modified`, `heart_rate`, `ecg.signalid`, `ecg.afib`,
`bloodpressure.systole`, `bloodpressure.diastole`, `stetho.signalid` en
`stetho.vhd`.

`Heart v2 - Get` levert het ECG-signaal in µV, `sampling_frequency`,
`wearposition`, `model` en de gekoppelde gemiddelde hartslagmeting met groep-ID,
waarde, datum en verwijderstatus. Providerclassificaties worden met hun context
bewaard en niet als nieuwe Body-diagnose geherinterpreteerd.

## Stethoscoop

`Stetho v2 - List` levert `hash_deviceid`, `signalid`, `vhd`, `timestamp` en
`timezone`. `Stetho v2 - Get` levert het A-law G.711-gecodeerde `signal`,
`frequency`, `duration`, `format`, `size`, `resolution`, `channel`, `model`,
`position` en `vhd`.

## Raw Data API — contractueel

De publieke Raw Data API gebruikt `rawdata_type=1` voor accelerometer en
`rawdata_type=2` voor optische sensor. De respons bewaart `data`,
`hash_deviceid`, `type`, `format_version`, `firmware_version`, `sensor_name`,
`startdate` en `enddate`, plus `more` en `offset`.

De gedocumenteerde sensoren zijn accelerometer en optische PPG, beide ongeveer
25 Hz. Voorbeeldvelden voor PPG zijn `timestamp`, `id`, `ppg_green`, `ppg_ir`,
`ppg_red`, `agc_green_adc_range`, `agc_green_current_ua`, `agc_ir_adc_range`,
`agc_ir_current_ua`, `agc_red_adc_range`, `agc_red_current_ua`.

Raw capture wordt een afzonderlijke, expliciet geconsenteerde feature; nooit
een verborgen standaardmodus.

## Niet als beschikbaar modelleren

Tot officiële release blijven deze aangekondigde outputs `not_available`:

- Vitality Score
- Health Improvement Score
- Hypertension Score
- Diabetes Risk Score
- CHF Risk Score
- Withings Intelligence Data Insight
- Withings Intelligence Trends Insight

## Synchronisatie- en implementatiegates

- OAuth2 en de bij het partnerplan toegestane scopes blijven verplicht.
- `getmeas`, `getactivity`, `getworkouts`, Heart List, Stetho List en raw data
  pagineren met `more` plus `offset`; relevante summary-endpoints bieden
  `lastupdate` voor incrementele synchronisatie.
- Devicegegevens via `User v2 - Getdevice`: `type`, `model`, `model_id`,
  `battery`, device-ID's, `timezone`, eerste/laatste sessie en
  partnerafhankelijke firmware-/netwerkvelden.
- Plan-, contract-, regio- en apparaatvoorwaarden worden niet als statische
  beschikbaarheid hardgecodeerd. De connector registreert eligibility-evidence
  en een exacte missing reason.
- Exacte webhookcategorieën en toegekende scopes worden bij partner-onboarding
  tegen het contract gevalideerd.

## Body-normalisatie

Elke waarde bewaart het exacte service/action-paar, oorspronkelijke veld of
measurement type ID, apparaatmodel, tijden, eenheid en schaalfactor,
recording-class, regio-/planvoorwaarden, status, kwaliteit, provenance en
ontbrekendheidsreden.
