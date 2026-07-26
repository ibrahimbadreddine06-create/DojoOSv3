# Body provider coverage ledger

Verified: 2026-07-25

This ledger separates public-schema completion from access that requires a
commercial agreement, device, OS version, region or user permission.

| Provider | Public inventory | Field mapping | Remaining closed gate | Product treatment |
|---|---|---|---|---|
| WHOOP Developer API V2 | complete | canonical core mapped | continuous HR is not in standard cloud API; device generation affects SpO2/temperature | integrate documented summaries; never promise raw HR |
| Oura API V2 | complete against OpenAPI 1.37 | canonical core mapped | membership/device availability and future-marked fields | runtime eligibility; future fields excluded |
| Polar AccessLink V3 | complete public schema | canonical core mapped | device-specific Elixir/Biosensing outputs | capability discovery per user/device |
| Withings Health Data API | complete public OpenAPI 3.0.3 | measurement IDs and endpoint fields mapped | raw signals, medical features, regions and plans | runtime eligibility plus partner-contract validation |
| Google Health API V4 | complete public Discovery schema | canonical core mapped | some detailed enums/device semantics and specialist scopes | generated schema client; preserve Fitbit/Google provenance |
| Android Health Connect | all public record families and mandatory fields | canonical core mapped | optional fields, feature flags and OS/device availability | runtime feature/permission discovery |
| Apple HealthKit | all public identifier families | canonical core mapped | per-type OS availability, characteristic/correlation metadata and entitlement gates | generated availability table from SDK/DocC before connector release |
| Samsung Health Data SDK 1.1 | public read/write types and primary/nested session fields | canonical core mapped | device support, enums and partner approval | capability query plus approval gate |
| Garmin Health API | public data categories only | blocked at exact field level | approved Garmin Health API program access and licensed schema | no invented implementation contract; connector stays gated |
| Strava API V3 | complete for Body activity import | activity canonical mapping complete | rate limits, athlete authorization and stream availability | secondary activity source, deduplicated against device/health stores |

## Closure definition

A connector is implementation-ready only when:

1. exact fields and units are known;
2. permissions/scopes are known;
3. pagination, backfill, modification and deletion semantics are known;
4. device/application provenance is retained;
5. feature, region and plan eligibility can be represented;
6. test fixtures cover absent, partial, revoked and duplicate data;
7. unsupported fields fail closed.

## Access work that cannot be replaced by research

- Garmin: apply to the Garmin Health API program and obtain the licensed field
  schema.
- Withings: confirm the chosen API plan, webhook categories and any raw/medical
  feature contract.
- Samsung: complete partner approval and validate the production certificate.
- Apple: validate entitlements and current SDK availability in the shipping
  Xcode toolchain.
- Android: validate Health Connect feature availability across the supported
  Android range.

These are delivery dependencies, not reasons to guess. All other research and
product design continues independently.
