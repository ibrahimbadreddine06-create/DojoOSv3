# Body metric specification contract

Status: production contract template  
Purpose: prevent a visual, provider field or convenient number from becoming a
Body metric before its meaning is defined.

## Core rule

A metric is not a label and value. It is a versioned semantic contract. Every
rendered value must be traceable to source observations, an allowed
transformation and the exact specification version that produced it.

## Required specification fields

Every production metric specification must define:

| Field | Required meaning |
|---|---|
| `metric_id` | Stable canonical identifier |
| `version` | Semantic/calculation version |
| `user_question` | The question the metric answers |
| `definition` | Precise meaning, without marketing language |
| `disposition` | Reproducible, provider-namespaced, descriptive, regulated-context or unsupported |
| `input_contract` | Required and optional source fields |
| `source_eligibility` | Which source types may produce the value |
| `calculation` | Formula/algorithm or explicit pass-through rule |
| `unit` | Canonical storage and display-unit behavior |
| `time_basis` | Instant, interval, local day, sleep episode, session or rolling window |
| `aggregation` | Permitted aggregation and forbidden combinations |
| `deduplication` | Duplicate and overlap behavior |
| `freshness` | When the value becomes stale |
| `coverage` | How completeness is measured and disclosed |
| `uncertainty` | Known limitations and how they are shown |
| `reference_context` | Population/reference range, if applicable |
| `manual_behavior` | Whether/how manual input is accepted |
| `missing_behavior` | Empty, partial, stale and unsupported states |
| `privacy_class` | Sensitivity and consent requirements |
| `interpretation` | What may safely be said |
| `prohibited_claims` | What must not be inferred or displayed |
| `history_contract` | How points/episodes appear in detail/history |
| `audit_fields` | Provenance fields retained with every result |
| `test_vectors` | Deterministic examples including edge cases |
| `citations` | Primary scientific/regulatory/provider sources |

## Universal audit fields

Every raw observation and derived result must retain enough information to
reconstruct its origin:

- canonical metric ID and specification version;
- value and canonical unit;
- start/end/recorded timestamps with original timezone context;
- source provider, source device/app and source record ID where available;
- ingestion route and ingestion timestamp;
- original provider field and unit;
- user-entered/provider-derived/Body-derived classification;
- transformation identifiers and input record references;
- confidence/quality/status flags supplied by the source;
- correction/deletion/supersession state;
- consent scope or connection authorization that permitted ingestion.

## Disposition behavior

### Reproducible

Body may compute and name the result when the documented input contract and
algorithm are satisfied. The formula and version are inspectable.

### Provider-namespaced

Body stores and displays the provider result without pretending the underlying
algorithm is known. Provider name, source and timestamp remain visible.

### Descriptive

Body may summarize observed facts or transparent trends without claiming a
validated physiological construct.

### Regulated-context

Body may transport and display eligible source output only with its issuer,
status, intended-use context and jurisdictional constraints intact.

### Unsupported

The value is not computed or marketed. A future design concept cannot override
this gate.

## Time and aggregation rules

1. Raw observations retain original timestamps and timezone context.
2. User-facing “day” uses the user's applicable local-day boundary while
   retaining source time.
3. Sleep belongs to an episode first; assigning it to a display day is a view
   rule, not destruction of its interval.
4. Sessions remain bounded intervals with type and source.
5. Rolling windows expose their duration, eligible-day rule and missing-day
   behavior.
6. Values are summed only when their semantics permit summation and overlapping
   contributions have been resolved.
7. Samples are averaged only when the measure, sampling process and weighting
   rule make that meaningful.
8. Provider scores from different providers never form one continuous series
   by default.

## Manual-input rules

Manual data is first-class evidence of what the user entered, not synthetic
sensor data.

- It retains author, timestamp and entry context.
- It never gains a device-quality flag it did not earn.
- A subjective rating remains subjective and is labeled accordingly.
- Corrections supersede rather than silently rewrite the audit trail.
- Body may combine manual and wearable facts only when the metric specification
  explicitly defines the relationship.

## Missing-data states

Every metric must distinguish:

- **Not configured**: no eligible source or manual path selected.
- **Awaiting data**: configured, but no qualifying observation yet.
- **Partial**: some required coverage is missing.
- **Stale**: last eligible value exceeds the freshness contract.
- **Unsupported**: connected source cannot provide the metric.
- **Permission lost**: the route exists but access is absent/revoked.
- **Conflict**: competing records cannot be resolved safely.
- **Valid zero**: a real value of zero, never confused with missing.

## Presentation invariants

1. Units are never inferred solely from locale when the source meaning could
   change.
2. Rounding is a display rule; stored precision and source precision remain
   traceable.
3. A trend states its comparison window.
4. A reference range states its origin and applicability.
5. Provider estimates and regulated outputs remain visibly attributed.
6. Tooltip/hover copy clarifies compact content; it does not carry the only
   safety-critical meaning.
7. The 1x1 widget preserves the essential interpretation, not merely the
   largest number.

## Specification acceptance tests

Before implementation, each metric requires:

- normal input vector;
- unit-conversion vector;
- timezone/day-boundary vector;
- duplicate/overlap vector;
- missing/partial vector;
- stale vector;
- conflicting-source vector;
- manual correction vector where applicable;
- source deletion/revocation vector;
- display-rounding vector;
- prohibited-claim review.

