# Body source resolution and deduplication policy

Status: **draft production policy**

Body can receive the same real-world event through a direct wearable API, an
OS health store and an activity platform. This policy prevents double counting
without destroying provenance.

## Non-negotiable rule

All source records are retained. Resolution chooses what a product query uses;
it does not delete the losing record or rewrite it as the winner.

## Resolution unit

Resolution happens per canonical type and natural record shape:

- samples resolve within a tolerance window appropriate to sampling cadence;
- intervals resolve by temporal overlap;
- sessions resolve by identity, time overlap and activity/sleep context;
- daily summaries resolve by local-day definition and algorithm owner;
- provider scores do not deduplicate across providers because their meaning and
  weighting differ.

## Evidence used for matching

In descending strength:

1. explicit origin/source reference supplied by the platform;
2. shared provider record ID or imported external ID;
3. device identity plus exact start/end time;
4. session type plus strong temporal overlap and matching duration;
5. sample-series fingerprint after unit normalization;
6. value/time similarity as supporting evidence only.

Value equality alone never proves duplication.

## Source graph

Every record can point to:

- the application that wrote it;
- the physical device that sensed it;
- the platform store that transported it;
- the upstream provider record it references;
- the Body connector that imported it.

For example, a Garmin activity observed through Apple Health and Strava is not
three independent workouts when both downstream records identify Garmin as
origin. Body retains three transport records but creates one resolved
real-world session with linked evidence.

## Precedence dimensions

Precedence is not one global provider ranking. It is calculated per type using:

- directness to the sensing device;
- provider ownership of the algorithm;
- sample resolution and completeness;
- modification and deletion support;
- source quality/status flags;
- explicit manual versus sensed recording method;
- device and feature eligibility;
- freshness and synchronization completeness;
- user-selected preferred source;
- known duplicate transport route.

The decision and all contributing evidence are inspectable.

## Default resolution behavior

### Raw or near-raw samples

Prefer the highest-quality direct source series when it is complete. A health
store series may fill uncovered intervals but may not be interleaved blindly
when timestamp or filtering semantics differ.

### Sessions

Prefer the source that owns the session or algorithm. Preserve enrichments from
other sources as linked observations only when field meaning is compatible.
Route, power, heart rate and calories may each have different best sources.

### Daily totals

Never sum totals from multiple providers. Recalculate from a resolved interval
set when safe; otherwise select one daily total according to the type policy
and surface the source.

### Provider-derived scores

Keep each score in its provider namespace. WHOOP Recovery, Oura Readiness,
Polar Nightly Recharge and Fitbit Readiness are not duplicates.

### Manual records

Manual records remain visible and editable. They can fill missing data but do
not silently override a sensed observation. Exact duplicates created by Body
edits use revision identity, not heuristic matching.

## Temporal rules

- Store source timestamp, offset and timezone exactly.
- Resolve calendar-day summaries using the provider's stated day boundary.
- Sleep sessions may cross midnight and belong to the provider-defined sleep
  day; they are not split merely for storage.
- Travel and daylight-saving transitions retain historical timezone offsets.
- A late provider modification reruns resolution for the affected window.

## Aggregation safety

A canonical type declares allowed aggregations:

- additive: steps, distance and energy only across non-overlapping intervals;
- duration-weighted: rates only when the source semantics permit it;
- extrema: min/max only across compatible contexts;
- latest-valid: profile measurements such as height;
- non-aggregatable: classifications, ECG, provider scores and many clinical
  records.

No generic average or sum is available to UI code without this declaration.

## Missing and partial data

Resolution outputs one of:

- `available`
- `partial`
- `not_recorded`
- `not_worn`
- `not_synced`
- `permission_denied`
- `unsupported_device`
- `unsupported_region`
- `unsupported_plan`
- `invalid`
- `deleted_at_source`
- `temporarily_unavailable`
- `unknown_reason`

Zero is a value only where the provider contract makes zero meaningful.

## Conflict handling

When two credible sources conflict and no policy resolves them safely:

1. retain both;
2. mark the resolved view `conflicted`;
3. avoid a falsely precise merged value;
4. show source context in detail views;
5. allow a user preference when medically and statistically safe;
6. log the decision for later policy improvement.

## Audit record

Each resolution produces:

- policy version;
- input record IDs;
- selected record or composition;
- rejected alternatives;
- match confidence;
- reason codes;
- unit conversions;
- aggregation window;
- execution time.

This makes every widget value traceable back to its source.
