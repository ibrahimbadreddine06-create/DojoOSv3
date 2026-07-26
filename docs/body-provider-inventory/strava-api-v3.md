# Strava API v3 — activity-importinventaris

Status: **activity- en streamvelden compleet voor Body’s importscope**

Primaire bronnen:

- API-reference: https://developers.strava.com/docs/reference/
- Authenticatie: https://developers.strava.com/docs/authentication/
- Changelog: https://developers.strava.com/docs/changelog/
- API policy: https://www.strava.com/legal/api_policy

## Rol binnen Body

Strava is een activitybron, geen complete gezondheidsstore. Body gebruikt de
connector voor activities die in Strava bestaan maar niet via een directere
wearable- of OS-storebron beschikbaar zijn.

## Activity-identiteit en tijd

`id`, `external_id`, `upload_id`, `upload_id_str`, `athlete`, `name`,
`description`, `start_date`, `start_date_local`, `timezone`, `sport_type`,
deprecated `type`, `workout_type`.

## Duur, afstand en hoogte

`distance`, `moving_time`, `elapsed_time`, `total_elevation_gain`, `elev_high`,
`elev_low`, `average_speed`, `max_speed`.

## Context en provenance

`device_name`, `trainer`, `commute`, `manual`, `private`, `flagged`,
`hide_from_home`, `gear_id`, `gear`, `start_latlng`, `end_latlng`, `map`.

## Energie en vermogen

`calories`, `kilojoules`, `average_watts`, `max_watts`,
`weighted_average_watts`, `device_watts`.

`device_watts=false` betekent dat vermogen geschat kan zijn en mag niet als
directe powermetermeting worden gepresenteerd.

## Detailstructuur

- `segment_efforts`
- `splits_metric`
- `splits_standard`
- `laps`
- `best_efforts`

Splits bevatten `average_speed`, `distance`, `elapsed_time`,
`elevation_difference`, `pace_zone`, `moving_time`, `split`.

Laps bevatten:

`id`, `activity`, `athlete`, `average_cadence`, `average_speed`, `distance`,
`elapsed_time`, `start_index`, `end_index`, `lap_index`, `max_speed`,
`moving_time`, `name`, `pace_zone`, `split`, `start_date`,
`start_date_local`, `total_elevation_gain`.

## Streams

Het officiële `StreamSet` kan bevatten:

- `time` — seconden;
- `distance` — meters;
- `latlng` — latitude/longitude;
- `altitude` — meters;
- `velocity_smooth` — m/s;
- `heartrate` — bpm;
- `cadence`;
- `watts` — watt;
- `temp` — °C;
- `moving` — boolean;
- `grade_smooth` — percentage.

Elke stream bewaart:

- `original_size`;
- `resolution`: low, medium of high;
- `series_type`: distance of time;
- `data`.

Streams kunnen door Strava zijn gedownsampled. Body mag geïnterpoleerde of
low-resolution data niet voorstellen als het originele sensorsignaal.

## Zones

Activity zones ondersteunen:

- `type`: heartrate of power;
- `sensor_based`;
- `score`;
- `points`;
- `custom_zones`;
- `max`;
- distribution buckets met `min`, `max`, `time`.

## Sporttypes

De officiële enum omvat brede activitygroepen zoals lopen, fietsen, zwemmen,
wandelen, hike, ski, watersport, racketsport, teamsport, fitness, yoga,
weight training, wheelchair en virtuele varianten. Body bewaart de originele
`sport_type` en mapt die daarnaast naar een eigen, versieerbare taxonomie.

## Toegang en beperkingen

- OAuth-scopes bepalen publieke, private en writable activities.
- `activity:read_all` is vereist voor “Only Me”-activities.
- Webhooks signaleren create/update/delete.
- Rate limits, API-tiers en display-/privacyregels moeten voor productie
  opnieuw tegen de actuele policy worden gevalideerd.
- Starttijd kan volgens het actuele changelog worden versluierd wanneer de
  gebruiker die in Strava verbergt.

## Deduplicatie

Bij overlap met Garmin, HealthKit, Health Connect of een andere bron kiest Body
een canonical activity zonder de Strava-kopie te wissen. Matching gebruikt:

- external/upload ID;
- starttijd en duur;
- sporttype;
- afstand;
- device;
- routefingerprint;
- streamvergelijking.

De gebruiker moet bron en mergebeslissing kunnen terugzien.
