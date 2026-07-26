# Provider Inventory

This folder contains field-level inventories of data that Body can actually
retrieve. Product-interface metrics that are not exposed through a verified
connection remain outside the inventory until proven accessible.

## Completion states

- `verified-complete`: every current public consumer endpoint and field has
  been checked against the official schema.
- `verified-category-complete`: every top-level data type is verified, but
  nested fields or device conditions still require extraction.
- `in-progress`: meaningful verified extraction exists, but the provider is not
  complete.
- `blocked`: official access or documentation is unavailable; the missing
  information and required stakeholder/vendor action are recorded.

## Required columns for the canonical matrix

Every provider field will eventually map to:

| Column | Purpose |
|---|---|
| Provider | Originating platform or vendor |
| Connection route | Health store, direct API, aggregator, import, or manual |
| Provider object | Exact endpoint, record, or object type |
| Provider field | Exact field name |
| Provider meaning | Vendor definition without reinterpretation |
| Unit | Exact source unit |
| Record shape | Sample, interval, series, session, daily summary, or event |
| Resolution | Sample interval or aggregation resolution |
| Availability | Device, membership, setting, plan, and region conditions |
| Permission | Exact scope or permission |
| Recording class | Sensed, manually entered, platform-derived, vendor-derived |
| Source metadata | Available provenance fields |
| Latency | Expected delay before Body can retrieve it |
| Historical access | Backfill window and pagination behavior |
| Writable | Whether Body may write or update it |
| Canonical candidate | Proposed Dojo field, not final until harmonization |
| Confidence | Verified, partial, inferred, unknown |
| Evidence | Official source closest to the claim |
| Verified date | Date the evidence was checked |

## Current provider status

| Provider | Status |
|---|---|
| WHOOP Developer API V2 | verified-complete for standard consumer API |
| Google Health API V4 | verified-complete for public Discovery schemas; enum/device gates pending |
| Oura API V2 | verified-complete for public API OpenAPI 1.37 |
| Polar AccessLink V3 | verified-complete for public API schema |
| Withings Health Data API | verified-complete for public OpenAPI 3.0.3 fields; contract/device/region gates remain |
| Apple HealthKit | verified-category-complete; exact per-type field gates pending |
| Android Health Connect | verified-category-complete; mandatory fields complete, optional fields/gates pending |
| Samsung Health Data SDK 1.1 | primary fields verified; nested enum/device gates pending |
| Garmin Health API | public categories complete; exact schema blocked by program access |
| Strava API V3 | verified-complete for Body activity-import scope |

Completion refers to documented technical availability, not scientific
validity or a decision to expose the field in Body.
