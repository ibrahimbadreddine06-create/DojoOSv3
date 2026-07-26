# Body metric detail and history contract

Status: production information architecture baseline

## Purpose

Clicking a metric widget opens the canonical detail surface for its umbrella
and selected subject. The surface explains the current result, its history,
source and meaning. It is not merely “a larger widget” and not merely a chart.

Action widgets may open their action flow instead. Mixed widgets clearly
separate “open detail” from direct controls.

## Entry contract

The detail route receives stable identifiers, not display text:

- umbrella ID;
- optional subject/entity ID;
- variant/instance context;
- selected time or episode/session where relevant;
- source preference context.

The route remains usable if the originating widget is later removed.

## Detail surface structure

### Current interpretation

Answer the umbrella's question with:

- current/selected value or state;
- unit and time basis;
- source/provider attribution where material;
- freshness and coverage;
- compact, safe interpretation.

### History

History uses the metric's native structure:

- observations remain observations;
- episodes remain bounded episodes;
- sessions retain session boundaries;
- daily aggregates retain day/timezone logic;
- provider scores remain provider-specific series.

The time-range selector offers only ranges supported by the data and
visualization. The user can navigate back to the first retained observation.

### Breakdown and contributors

When a result has inspectable contributors, the surface shows them and their
relationship. A proprietary score shows only provider-exposed contributors and
never a reverse-engineered formula.

### Source and quality

The user can inspect:

- provider, app/device and ingestion route;
- latest sync;
- coverage and quality/status;
- source/protocol boundaries;
- conflict or exclusion decisions;
- whether a value is manual, provider-derived or Body-derived.

### Meaning and limitations

The surface states:

- what the metric means;
- how Body calculated or transported it;
- applicable reference context;
- known uncertainty;
- what cannot be concluded.

This content is versioned with the metric specification and is not hidden
solely in a tooltip.

### Records and corrections

Eligible users can inspect raw/logged entries, correct manual records, review
source conflicts and request deletion where policy allows. Provider-owned
records direct correction to the appropriate source when Body cannot edit
them.

## Historical comparison rules

1. Default comparisons use compatible source and protocol.
2. Source changes are visible boundaries.
3. Missing intervals remain missing.
4. Smoothing is optional and named; raw observations remain available.
5. Comparison windows and valid-day counts are explicit.
6. Reference bands identify their source and population.
7. Provider scores from different providers are not plotted as one equivalent
   series.
8. Recalculated history exposes the current specification version and whether
   original calculated results were superseded.

## Navigation between related metrics

Related metrics may link to each other when the relationship is meaningful.
Links do not imply causality. Page tailoring can enter the same canonical
detail surface with a different initial lens while retaining one metric truth.

Examples:

- a Hub sleep signal opens sleep detail at the relevant episode;
- an Activity recovery context opens the same recovery signal history with the
  activity date selected;
- a Nutrition body-trend widget opens body measurement history without claiming
  intake caused the change.

## Mobile behavior

- Essential interpretation precedes deep history.
- Charts support touch inspection without blocking page scroll.
- Direct actions have separate, adequate touch targets.
- Dense tables become structured record cards or horizontally deliberate
  views, never clipped mini desktop tables.
- Sticky range/context controls may be used when they reduce repeated travel;
  they do not obscure data.

## Empty and degraded detail states

The detail page remains useful when:

- no data has arrived;
- coverage is partial;
- the latest value is stale;
- permission is lost;
- the source is unsupported;
- records conflict;
- a provider is delayed.

It explains the exact state, preserves known-valid history and offers the
appropriate next action without fake example data.

## Safety boundary

The detail surface does not become a diagnosis engine. Clinical or regulated
outputs preserve issuer, status and intended-use language. Concerning values
may receive carefully reviewed guidance to seek appropriate professional help,
but Body does not improvise personalized medical conclusions.

## Acceptance checks

- Widget and detail show the same canonical current result.
- Range changes never alter the underlying metric definition.
- Every visible point resolves to provenance.
- Manual correction propagates through affected derived results.
- Deleted/revoked-source behavior matches retention policy.
- Source boundaries and missing intervals remain visible.
- Keyboard, touch, reduced-motion and screen-reader paths work.
- Deep link and browser/app back navigation preserve context.

