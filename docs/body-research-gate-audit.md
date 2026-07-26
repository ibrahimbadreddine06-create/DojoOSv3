# Body research gate audit

Status: evidence-system audit before umbrella selection  
Updated: 2026-07-25

## Result

The project already contains more provider and scientific work than the failed
umbrella catalogue reflected. The repair must reuse and verify that work, not
restart it or promote its rows into umbrellas.

## Research layers now present

| Layer | Artifact | Current state |
|---|---|---|
| Competitor universe and depth | `body-competitor-priorities.md` | Tier A/B/C pool explicitly defined |
| Product reconstructions | `competitor-deep-dives/` | Tier A complete first passes; Tier B targeted passes; Tier C first gap scans |
| Original-file audit | `body-original-deep-dive-audit.md` | structural audit complete; statement-level gaps retained |
| Provider inventories | `body-provider-inventory/` | ten provider/platform inventories plus index |
| Canonical mapping | `body-provider-canonical-matrix.md` | core harmonisation mapped; named unresolved decisions |
| Connector readiness | `body-provider-coverage-ledger.md` | public schema versus closed access gates separated |
| Scientific disposition | `body-scientific-validation-matrix.md` | initial Body metric families covered |
| Machine-readable disposition | `body-metric-disposition-registry.json` | product-use constraints encoded |
| Calculation contracts | `body-core-metric-specs.md` | versioned reproducible calculations |
| Submodule synthesis | `body-submodule-evidence-synthesis.md` | evidence dimensions synthesized without umbrellas |
| Design production contract | `body-e-design-production-contract.md` | E language retained as locked visual/interaction baseline |

## Provider readiness finding

The public-schema core is substantially mapped for:

- Apple HealthKit;
- Android Health Connect;
- Google Health API;
- Samsung Health Data SDK;
- Oura API v2;
- WHOOP Developer API v2;
- Polar AccessLink v3;
- Withings Health Data API;
- Strava API v3.

Garmin remains intentionally blocked at exact field level until approved
program access provides the licensed schema. This is the correct behavior:
public product knowledge is not an implementation contract.

This list describes audited provider coverage. It is not a list of umbrellas
and it does not limit future connectors.

## Scientific readiness finding

The scientific matrix already assigns product dispositions across activity,
exercise intensity, training load, resting physiology, recovery, sleep,
cardiovascular observations, body composition, nutrition, hydration, stress,
cycle tracking, routines and appearance-related tracking.

The allowed dispositions are:

- Body-calculated under a named method;
- observation;
- provider-owned result;
- research only;
- rejected.

The important result is not that every possible metric is approved. It is that
unsupported interpretation is prevented from silently becoming a production
widget.

## Closed and open gates

### Closed enough to continue product reasoning

- Correct widget ontology restored.
- Competitor breadth pool inspected through Tier C.
- Main provider schemas inventoried and core fields mapped.
- Provider-derived results kept separate from Body calculations.
- Initial scientific claim boundaries recorded.
- E design language remains available for any later production widget.

### Still open before connector release

- Garmin program approval and field schema.
- Samsung partner approval and production certificate.
- Apple entitlement/current-SDK validation.
- Android feature/permission validation across supported OS versions.
- Withings contract/plan and raw or medical feature eligibility.
- Runtime capability and permission discovery for every connector.
- Test fixtures for absent, partial, duplicated, revoked and delayed data.

### Still open before a specific umbrella ships

- The umbrella must answer a real user question.
- Every shown value needs a disposition and source path.
- Every calculation needs a versioned contract.
- Every visual mark needs real data/state semantics.
- Every supported size needs a deliberate information hierarchy.
- Missing, stale, insufficient-history and unsupported states need designs.
- The detail surface needs history, explanation, provenance and correction
  where relevant.

## Exact next decision method

Umbrellas are now selected one by one, inside one submodule at a time:

1. define the user question;
2. retrieve all relevant evidence, without turning evidence categories into
   hierarchy;
3. state what data is available with and without a wearable;
4. state what may be observed, calculated or only provider-namespaced;
5. decide whether this deserves an actual widget umbrella;
6. only after approval, define variants and supported sizes under E.

At no point may a “group of umbrellas” be inserted between submodule and
umbrella.

