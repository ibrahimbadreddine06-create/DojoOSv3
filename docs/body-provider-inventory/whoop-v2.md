# WHOOP Developer API V2 — Verified Consumer Data Inventory

Verified against the official OpenAPI specification on 25 July 2026:
https://api.prod.whoop.com/developer/doc/openapi.json

This inventory covers the standard user-authorized developer API. The separate
healthcare Partner API is not treated as generally available consumer data.

## Access

- OAuth 2.0 per user
- Scopes: profile, body measurement, cycles, recovery, sleep, workout
- Collection endpoints are paginated
- States must be preserved: `SCORED`, `PENDING_SCORE`, `UNSCORABLE`
- Continuous heart-rate samples are not available through this cloud API

## Profile

| Field | Meaning |
|---|---|
| `user_id` | WHOOP user identifier |
| `email` | Email |
| `first_name` | First name |
| `last_name` | Last name |

## Body measurement

| Field | Unit / meaning |
|---|---|
| `height_meter` | metres |
| `weight_kilogram` | kilograms |
| `max_heart_rate` | bpm; WHOOP-calculated value |

## Physiological cycle

Identity and time:

- Cycle ID and user ID
- Created and updated timestamps
- Start timestamp
- Optional end timestamp for completed cycles
- Time-zone offset
- Score state

Scored outputs:

| Field | Unit / meaning |
|---|---|
| `strain` | WHOOP cardiovascular strain, 0–21 |
| `kilojoule` | expended energy, kJ |
| `average_heart_rate` | bpm |
| `max_heart_rate` | bpm |

WHOOP cycles are physiological awake/sleep cycles, not guaranteed calendar
days. Body must not silently convert them into calendar-day records.

## Recovery

Identity and state:

- Associated cycle ID
- Associated sleep UUID
- User ID
- Created and updated timestamps
- Score state

Scored outputs:

| Field | Unit / meaning | Availability |
|---|---|---|
| `user_calibrating` | calibration state | always within score |
| `recovery_score` | 0–100% | scored recovery |
| `resting_heart_rate` | bpm | scored recovery |
| `hrv_rmssd_milli` | RMSSD, ms | scored recovery |
| `spo2_percentage` | % | compatible WHOOP generations |
| `skin_temp_celsius` | °C | compatible WHOOP generations |

The proprietary recovery score may be stored and displayed as a
vendor-derived metric. Its visible inputs do not reveal its hidden weighting.

## Sleep

Identity and time:

- Sleep UUID, associated cycle ID, user ID
- Created and updated timestamps
- Start and end timestamps
- Time-zone offset
- Nap flag
- Score state

Stage summary:

| Field | Unit / meaning |
|---|---|
| `total_in_bed_time_milli` | ms |
| `total_awake_time_milli` | ms |
| `total_no_data_time_milli` | ms without received data |
| `total_light_sleep_time_milli` | ms |
| `total_slow_wave_sleep_time_milli` | ms |
| `total_rem_sleep_time_milli` | ms |
| `sleep_cycle_count` | count |
| `disturbance_count` | count |

Sleep need:

| Field | Unit / meaning |
|---|---|
| `baseline_milli` | baseline need from history, ms |
| `need_from_sleep_debt_milli` | additional sleep debt need, ms |
| `need_from_recent_strain_milli` | additional strain-derived need, ms |
| `need_from_recent_nap_milli` | nap-derived reduction, zero or negative ms |

Other scored outputs:

| Field | Unit / meaning |
|---|---|
| `respiratory_rate` | breaths/min |
| `sleep_performance_percentage` | actual sleep relative to WHOOP sleep need |
| `sleep_consistency_percentage` | similarity of sleep/wake timing to previous day |
| `sleep_efficiency_percentage` | asleep time relative to time in bed |

## Workout

Identity and time:

- Workout UUID and user ID
- Created and updated timestamps
- Start and end timestamps
- Time-zone offset
- Sport name
- Score state

Scored outputs:

| Field | Unit / meaning | Availability |
|---|---|---|
| `strain` | WHOOP cardiovascular strain, 0–21 | scored workout |
| `average_heart_rate` | bpm | scored workout |
| `max_heart_rate` | bpm | scored workout |
| `kilojoule` | expended energy, kJ | scored workout |
| `percent_recorded` | received HR coverage, % | scored workout |
| `distance_meter` | metres | only when distance supplied |
| `altitude_gain_meter` | cumulative ascent, metres | only when altitude supplied |
| `altitude_change_meter` | end minus start altitude, metres | only when altitude supplied |

Heart-rate-zone durations:

- Zone 0 duration, ms
- Zone 1 duration, ms
- Zone 2 duration, ms
- Zone 3 duration, ms
- Zone 4 duration, ms
- Zone 5 duration, ms

## Explicit limitations

- No continuous heart-rate time series through the standard cloud API.
- Device generation affects SpO₂ and skin-temperature availability.
- A present metric in the WHOOP product interface is not assumed available
  unless it exists in the verified API schema.
- Strength Trainer is represented through workout access, but no unsupported
  set-level fields are inferred from that fact.
