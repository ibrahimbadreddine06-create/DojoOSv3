# Body Wearable Connection Map

Status: architectural discovery, not final integration approval.

The same wearable can reach Body through more than one route. Route selection
must consider data completeness, provenance, latency, commercial access,
platform availability, privacy, maintenance cost, and user friction.

## Route 1 — operating-system health stores

### Apple HealthKit

Role:

- Primary on-device bridge for health and fitness data available in Apple
  Health on iPhone and Apple Watch.
- Requires a native Apple-platform application and granular user permission.
- Provides standardized HealthKit object types, source metadata, samples,
  workouts, activity summaries, clinical records, cycle data, nutrition,
  self-care events, and other supported categories.

Evidence:

- https://developer.apple.com/documentation/healthkit
- https://developer.apple.com/documentation/healthkit/data-types

Open gate:

- The current web application cannot treat HealthKit as a browser API. Native
  application architecture and the exact accessible type inventory require a
  dedicated implementation decision.

### Android Health Connect

Role:

- Primary on-device interoperability store for Android health and fitness data.
- Stores standardized records across activity, body measurements, cycle
  tracking, nutrition, sleep, vitals, and wellness.
- Preserves origin, device, timestamps, recording method, client identifiers,
  and version metadata needed for provenance and conflict resolution.

Evidence:

- https://developer.android.com/health-and-fitness/health-connect/data-types
- https://developer.android.com/health-and-fitness/health-connect/data-format

Open gate:

- Every requested data type requires a declared product use and Play review.
  Actual provider coverage varies with the apps installed by the user.

### Samsung Health Data SDK

Role:

- Direct Android access to supported Samsung Health records, including selected
  derived Samsung values not guaranteed to exist in generic Health Connect.

Evidence:

- https://developer.samsung.com/health/data/guide/features/data-types.html

Open gate:

- Compare Samsung-direct completeness and approval requirements against Health
  Connect before accepting the maintenance cost of a second Android route.

## Route 2 — direct vendor cloud APIs

### Google Health API

Role:

- Direct cloud route for current and previous Fitbit devices and Pixel Watch.
- Successor to the Fitbit Web API, using Google OAuth and standardized data
  bundles.

Evidence:

- https://developers.google.com/health
- https://developers.google.com/health/about

Constraint:

- The legacy Fitbit Web API is scheduled to stop syncing in September 2026.
  Body must target Google Health API rather than begin a legacy integration.

### Garmin Health API

Role:

- Cloud access after user consent and Garmin Connect synchronization.
- Offers all-day summaries and detailed feeds across Garmin-supported health
  and activity domains.

Evidence:

- https://developer.garmin.com/gc-developer-program/health-api/

Constraint:

- Production commercial use requires approval and a licence fee.

### Oura API V2

Role:

- OAuth cloud access to Oura user data and Oura-derived daily information.

Evidence:

- https://cloud.ouraring.com/v2/docs

Constraint:

- Applications begin with a ten-user limit and need approval for wider release.
  Subscription state can affect data access.

### WHOOP Developer API V2

Role:

- OAuth cloud access to profile, body measurements, cycles, recovery, workouts,
  and sleep.
- Webhooks can signal updated cloud data.

Evidence:

- https://developer.whoop.com/api/
- https://developer.whoop.com/docs/developing/user-data/recovery/

Constraint:

- Continuous heart-rate samples are not exposed through the standard cloud API.
  WHOOP can broadcast live heart rate over Bluetooth, which is a separate
  integration path.

### Polar AccessLink

Role:

- OAuth cloud access to exercise, daily activity, continuous heart-rate
  summaries, cardio load, sleep, recharge, biosensing, and physical profile
  information.

Evidence:

- https://www.polar.com/accesslink-api/

Constraint:

- Some outputs depend on supported devices and enabled device settings.

### Withings Health Data API

Role:

- Cloud access to a broad device family spanning scales, sleep sensors,
  watches, blood-pressure devices, thermometers, and other Withings hardware.

Evidence:

- https://developer.withings.com/developer-guide/v3/data-api/all-available-health-data/

Constraint:

- Availability varies materially by device, API plan, and region. These
  dimensions must remain explicit in the data inventory.

### Strava API

Role:

- Activity-specialist source for recorded activities and supported streams.
- Useful when the activity exists in Strava but its originating wearable is not
  connected directly to Body.

Evidence:

- https://developers.strava.com/docs/reference/

Constraint:

- It is an activity source, not a complete health-data route. API tiers and
  endpoint policies can change.

## Route 3 — normalized integration providers

### Terra

Role:

- Commercial normalization layer across many wearable, fitness, nutrition, and
  health providers.
- Potentially accelerates initial coverage and reduces provider-specific OAuth
  and parser work.

Evidence:

- https://tryterra.co/

Open gate:

- Vendor coverage claims do not establish field-level parity with direct APIs.
  Cost, data loss, provenance, latency, deletion behavior, regional hosting,
  contractual terms, and vendor lock-in require comparison against direct
  integrations.

### Additional candidates

- Validic
- Human API

These remain candidates until current official documentation, coverage,
commercial access, and field-level behavior are verified.

## Route 4 — user-controlled input

- Manual measurement or event entry
- Structured import where a provider export can be validated
- Device-specific file import where provenance and units are preserved

Manual and imported data must be labelled as such. They never silently replace
sensor measurements or proprietary scores.

## Current architectural direction

Do not choose one universal route prematurely.

- Use native operating-system stores for broad consumer interoperability.
- Evaluate direct APIs when they expose important vendor-derived or granular
  data that the operating-system store does not preserve.
- Evaluate a normalization provider as an acceleration layer, not as evidence
  that direct integrations are unnecessary.
- Preserve the original source, device, recording method, and derivation status
  for every record.
- Deduplicate without erasing provenance.
- Request only permissions justified by visible Body functionality.

## Next gate

Build a field-level availability matrix. Each row represents one canonical
measurement or event; each provider column records whether it is available,
its exact field, unit, granularity, latency, provenance, permissions, device
requirements, regional limits, and whether it is sensed, user-entered,
platform-derived, or vendor-derived.
