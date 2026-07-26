# Body core metric specifications

Status: first production specification tranche  
Contract: `body-metric-specification-contract.md`  
Registry: `body-metric-disposition-registry.json`

This tranche specifies foundational metrics used by several umbrellas. It does
not make every candidate metric production-ready.

## `activity.steps`

**Version:** 1.0.0  
**User question:** How many deduplicated steps were recorded for this local
day?

### Definition and disposition

A transparent daily total of eligible step-count records after overlap
resolution. Disposition: reproducible aggregation of source observations.

### Input contract

Required per record:

- step count;
- interval start and end, or provider-defined daily bucket with timezone;
- provider/source identity;
- source record identifier when supplied.

Optional:

- device identity;
- provider quality/status;
- manually entered classification.

### Calculation

1. Normalize eligible records to count.
2. Resolve exact duplicates by provider/source record identity.
3. Resolve overlapping records using the canonical source-resolution policy;
   never blindly sum competing full-day totals.
4. Split only interval records whose source semantics allow allocation across a
   local-day boundary.
5. Sum accepted non-overlapping contributions for the selected local day.

Body does not generate steps from distance or active minutes.

### Coverage and freshness

Coverage records the observed interval span and whether the provider supplied a
complete daily aggregate. The current day is explicitly “so far”. A past day
with unresolved gaps may still show a total but carries partial coverage.

### Manual and missing behavior

Manual step totals may be stored as manual observations and are never blended
with an overlapping device total without explicit conflict resolution.
Missing is not zero.

### Interpretation

Allowed: recorded daily steps and comparison with the user's own transparent
period. Prohibited: universal health grade, calorie inference or claims that a
single threshold proves adequate activity.

### Audit and history

Daily result retains all contributing record references, exclusions and
resolution decisions. Detail view can expose source contribution and coverage.

### Test vectors

- Two disjoint intervals: sum.
- Duplicate source record: count once.
- Phone and watch covering the same interval: resolve; do not sum blindly.
- No records: missing, not `0`.
- Explicit provider total `0` with valid coverage: valid zero.
- Day crossing timezone change: retain original time and apply declared display
  day.

### Sources

- Provider semantics from the applicable connection contract.
- WHO activity guidance informs context, not a universal step target:
  https://www.who.int/publications/i/item/9789240015128

## `activity.active_minutes`

**Version:** 1.0.0  
**User question:** How much eligible activity time was recorded today?

### Definition and disposition

Daily duration of eligible provider-recorded activity classifications.
Disposition: descriptive/reproducible only within a declared intensity
definition.

### Input contract

Duration or bounded intervals, intensity/classification, provider/source
identity and timestamps. Provider-specific intensity semantics are retained.

### Calculation

Overlapping intervals are deduplicated before duration is summed. Moderate and
vigorous minutes are not merged into a weighted total unless the view states
the rule. “Active minutes” from providers with materially different
definitions remain namespaced or separated.

### Interpretation

Allowed: time recorded under the stated classification. Prohibited: presenting
unharmonized provider definitions as one equivalent measure.

### Missing behavior

No eligible classification is missing unless the source explicitly confirms a
covered interval with zero qualifying minutes.

### Test vectors

- Overlapping moderate/vigorous intervals.
- Provider aggregate plus raw sessions.
- Current partial day.
- Provider switch in a trend.

## `activity.session_duration`

**Version:** 1.0.0  
**User question:** How long did this recorded session last?

### Definition

Elapsed session interval, with optional separately named active/moving duration.
Disposition: reproducible.

### Calculation

`elapsed_duration = end_timestamp - start_timestamp`.

Paused or moving duration is never substituted for elapsed duration without a
distinct field and label. Invalid negative or open-ended intervals are not
finalized.

### Interpretation

Allowed: elapsed, active or moving duration when explicitly named. Prohibited:
assuming duration represents intensity or training benefit.

### Test vectors

- Normal closed interval.
- Paused session with elapsed and moving time.
- Missing end time.
- Timezone/DST transition using absolute timestamps.

## `load.session_rpe`

**Version:** 1.0.0  
**User question:** How demanding was the session using a transparent subjective
load method?

### Definition and disposition

Session rating of perceived exertion multiplied by eligible session duration.
Disposition: reproducible, manual-compatible.

### Input contract

- session duration in minutes;
- user-entered session RPE on the declared scale;
- RPE capture timestamp and scale version.

### Calculation

`sRPE_load = duration_minutes × session_RPE`

The result is expressed in arbitrary units and never mislabeled as calories,
physiological strain or injury risk.

### Missing behavior

Without an RPE entry, sRPE load is unavailable. Body does not infer RPE from
heart rate.

### Interpretation

Useful for within-person training-load history when capture is consistent.
Prohibited: cross-person ranking and injury prediction.

### Sources

- Foster et al. session-RPE method:
  https://pubmed.ncbi.nlm.nih.gov/11708692/
- Load/injury-ratio critique:
  https://pubmed.ncbi.nlm.nih.gov/32502973/

## `sleep.total_sleep_time`

**Version:** 1.0.0  
**User question:** How much sleep did the eligible source estimate for this
episode?

### Definition and disposition

Provider-recorded or transparently derived sleep duration for a bounded sleep
episode. Disposition: descriptive; provider semantics retained.

### Input contract

Episode start/end, provider/source, reported sleep duration when available,
awake intervals when available and episode status.

### Calculation

Prefer an eligible provider's explicit sleep-duration field for its episode.
When transparently derived, sum eligible sleep-classified intervals without
overlap. Do not silently equate time in bed with sleep duration.

### Coverage and uncertainty

Consumer wearable sleep is an estimate. The episode records source, coverage
and whether duration was provider-reported or Body-derived.

### Interpretation

Duration may be compared with applicable sleep-duration guidance, but Body does
not diagnose sleep disorders or claim wearable staging equals PSG.

### Sources

- AASM/SRS adult duration recommendation:
  https://pubmed.ncbi.nlm.nih.gov/26039963/
- Consumer wearable sleep validation meta-analysis:
  https://pubmed.ncbi.nlm.nih.gov/39484805/

## `sleep.efficiency`

**Version:** 1.0.0  
**User question:** What share of the recorded in-bed interval was estimated as
sleep?

### Definition and disposition

`sleep_duration / time_in_bed × 100`. Disposition: reproducible screening
description when both inputs are compatible.

### Input contract

Compatible sleep duration and time-in-bed duration from the same episode
semantics.

### Calculation

Return a percentage only when `time_in_bed > 0` and sleep duration does not
exceed time in bed beyond an explicitly resolved source inconsistency. Inputs
from different providers are not combined.

### Interpretation

Allowed: descriptive episode efficiency. Prohibited: diagnosis or a universal
quality grade based on this value alone.

### Test vectors

- 420 minutes sleep / 480 minutes in bed = 87.5%.
- Zero time in bed: unavailable.
- Sleep greater than time in bed: conflict.
- Inputs from two providers: unsupported combination.

## `sleep.midpoint`

**Version:** 1.0.0  
**User question:** Where did the sleep episode fall in clock time?

### Definition and disposition

Midpoint between the eligible episode's start and end instants. Disposition:
reproducible descriptive timing.

### Calculation

Compute on absolute instants, then render in the applicable local timezone.
Episodes crossing midnight or DST remain one interval.

### Interpretation

Used for timing and regularity views. It is not a chronotype diagnosis.

## `recovery.hrv_rmssd`

**Version:** 1.0.0  
**User question:** What HRV value did this provider report under its measurement
protocol?

### Definition and disposition

A provider-namespaced HRV observation retaining statistic, protocol and unit.
Disposition: provider-namespaced physiological measurement.

### Input contract

Value, unit, HRV statistic when known (for example RMSSD or SDNN), measurement
window/protocol, timestamps and provider/source.

### Rules

- Do not merge different HRV statistics.
- Do not assume spot, overnight and exercise measurements are equivalent.
- Trends default to a stable source and compatible protocol.
- If the provider does not expose the statistic/protocol, that uncertainty is
  retained.

### Interpretation

Allowed: same-person, compatible-protocol trend with context. Prohibited:
diagnosing stress, illness or recovery from HRV alone.

### Sources

- HRV measurement standards:
  https://pubmed.ncbi.nlm.nih.gov/8598068/
- Wearable measurement limitations:
  https://pubmed.ncbi.nlm.nih.gov/39080098/

## `body.weight`

**Version:** 1.0.0  
**User question:** What body weight was recorded, and how has the compatible
series changed?

### Definition and disposition

A point-in-time mass observation. Disposition: direct measurement/manual
observation.

### Input contract

Value, original unit, timestamp, source, optional measurement conditions and
device status.

### Rules

Store canonical kilograms while preserving original value/unit. Trends prefer
consistent sources and may distinguish raw observations from an explicitly
named smoothing view. Body does not interpolate missing weigh-ins as measured
facts.

### Manual behavior

Manual entries are accepted, editable through supersession and labeled as
manual.

### Interpretation

Allowed: value and transparent change over a named interval. Prohibited:
automatic moral judgment or assuming short-term change is tissue change.

## `body.bmi`

**Version:** 1.0.0  
**User question:** What screening ratio follows from compatible weight and
height inputs?

### Definition and disposition

`weight_kg / height_m²`. Disposition: reproducible screening ratio.

### Input contract

Eligible weight observation and a valid height record applicable to the
measurement time.

### Rules

BMI is not computed when height is missing/non-positive. The calculation
version records which height record was used. Population interpretation must
match the intended age/population context and is kept separate from the raw
ratio.

### Interpretation

Allowed: screening ratio with limitations. Prohibited: diagnosis, direct body
fat claim or individualized health verdict.

### Source

- WHO BMI context:
  https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index

## `hydration.logged_fluid`

**Version:** 1.0.0  
**User question:** How much logged water/fluid intake is represented by the
eligible entries?

### Definition and disposition

Transparent sum of eligible intake events for a local day. Disposition:
reproducible logged intake.

### Input contract

Volume, unit, consumed-at timestamp, entry source and correction status.
Whether an entry represents plain water or another beverage remains available
to the view.

### Calculation

Normalize eligible volumes and sum non-superseded entries assigned to the local
day. Do not infer physiological hydration status.

### Coverage and interpretation

The total represents logged intake, not necessarily all consumed fluid and not
hydration state. Reference values, if shown, state their source and applicable
inputs.

### Test vectors

- Mixed mL/fl oz entries.
- Corrected entry.
- Entry around local midnight.
- No entries: “not logged”, not zero consumed.

### Source context

- EFSA dietary reference values:
  https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values

## `hygiene.routine_adherence`

**Version:** 1.0.0  
**User question:** Which user-defined routine occurrences were completed in the
selected period?

### Definition and disposition

Transparent completion facts for scheduled/expected occurrences under the
user's own routine definition. Disposition: reproducible behavioral
description.

### Input contract

Routine definition/version, expected occurrences, completion/skipped state,
timestamps and user timezone.

### Calculation

For a declared period:

`adherence = completed_eligible_occurrences / expected_eligible_occurrences`

Skipped, paused and not-applicable occurrences follow the routine's declared
policy and are visible in detail. No denominator means no percentage.

### Interpretation

Allowed: progress against the user's chosen routine. Prohibited: universal
hygiene judgment, medical effectiveness claim or comparison with other users.

### Customization

Built-in templates and user-created routines use the same semantic contract.
The product does not restrict what a user may represent merely because it is
not in a template.
