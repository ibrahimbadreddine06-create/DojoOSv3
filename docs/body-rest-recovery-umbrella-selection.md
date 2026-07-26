# Rest & Recovery widget umbrellas — research selection

Status: research-selected, awaiting stakeholder review  
Updated: 2026-07-25  
Ontology: `body-widget-ontology.md`

## 1. Last Sleep

**Decision:** select.

**Widget identity:** compact summary of the latest resolved main sleep session.

**Why it is an actual widget:** it answers one stable question—what happened
last sleep—and opens that session's detail. It does not contain other umbrellas
in the product hierarchy, even when it summarizes their underlying facts.

**Data:** start/end, total sleep, source, freshness and the smallest useful
supporting context.

## 2. Sleep Duration

**Decision:** select.

**Widget identity:** sleep duration across the selected night or period.

**Why separate from Last Sleep:** users may want a focused duration goal/trend
without a full session summary.

**Data/calculation:** resolved sleep intervals and naps under an explicit
inclusion rule.

**Truth boundary:** time in bed and time asleep remain distinct.

## 3. Sleep Schedule

**Decision:** select.

**Widget identity:** timing and consistency of sleep onset and wake time.

**Why separate:** schedule regularity is not captured by duration alone.

**Data:** local-time sleep boundaries, timezone/travel context and valid-night
coverage.

## 4. Sleep Stages

**Decision:** select as conditional/provider-owned.

**Widget identity:** provider-estimated stage composition/timeline.

**Data:** original provider stages plus only defensible canonical mapping.

**Truth boundary:** consumer estimates are not polysomnography; providers may
use different stage models.

## 5. Sleep Efficiency

**Decision:** select as optional.

**Widget identity:** proportion of the in-bed interval scored as sleep under a
declared method.

**Calculation:** versioned from valid session boundaries or displayed as a
provider result when only that is available.

**Truth boundary:** efficiency does not by itself equal sleep quality.

## 6. Sleep Debt

**Decision:** select only as conditional/research-gated.

**Widget identity:** accumulated difference between an explicit sleep-need
model and eligible sleep obtained.

**Why retained:** RISE and related products demonstrate a strong independent
user job, but the need model and historical window materially determine the
result.

**Truth boundary:** provider debt remains provider-owned; Body does not ship a
universal debt model without validation.

## 7. Recovery

**Decision:** select as a conditional widget.

**Widget identity:** the selected source's recovery/readiness result and its
available contributors.

**Homogeneity rule:** when inputs and meaning truly match, shared canonical
observations are reused. Oura Readiness, WHOOP Recovery, Garmin recovery,
Polar Nightly Recharge and other proprietary results remain distinct
source-owned calculations inside the widget contract and are never averaged.

**Manual alternative:** a subjective recovery check-in can support a separate
variant only when clearly labelled; it never pretends to be wearable coverage.

## 8. HRV

**Decision:** select.

**Widget identity:** a consistent HRV metric compared with its own source and
personal baseline.

**Data:** metric type, aggregation, measurement period, source and quality.

**Truth boundary:** RMSSD and SDNN are not silently converted; low HRV is not a
diagnosis or universal stress conclusion.

## 9. Resting Heart Rate

**Decision:** select.

**Widget identity:** resting heart-rate observation and same-source personal
trend/baseline.

**Why separate from HRV:** it is a different physiological measurement with a
different unit, acquisition behavior and interpretation.

**Truth boundary:** deviations do not establish their cause.

## 10. Overnight Signals

**Decision:** reject as one umbrella; split into independently eligible
widgets.

The research label groups unlike measurements. The following are evaluated
separately:

### Respiratory Rate

**Decision:** select as conditional observation.

Same-source overnight respiratory-rate trend with coverage and source.

### Skin Temperature

**Decision:** select as conditional observation.

Provider temperature/deviation with its original baseline semantics. It is not
silently converted into fever or illness detection.

### Blood Oxygen

**Decision:** select as conditional observation.

Provider-recorded SpO₂ with device/coverage context. It is not a diagnosis and
consumer readings are not treated as clinical equivalence.

## 11. Physiological Stress

**Decision:** select as conditional/provider-owned.

**Widget identity:** provider-estimated physiological activation/stress across
time.

**Why separate from perceived stress:** one is inferred from physiological
signals; the other is self-report. They may be compared in detail but cannot
be collapsed as equivalent.

## 12. Perceived Stress

**Decision:** select as optional/manual-compatible.

**Widget identity:** stable self-reported stress rating and trend.

**Data:** instrument/scale, time and context.

**Truth boundary:** a personal association with sleep/activity is not causal.

## 13. Naps

**Decision:** select as optional.

**Widget identity:** recent nap duration, timing and history.

**Why separate:** naps can be important without being folded invisibly into
the main-night sleep summary.

**Data:** resolved nap sessions with source/manual provenance.

## Candidates deliberately not selected

### Sleep Pattern

Rejected as a vague grouping layer. `Sleep Duration` and `Sleep Schedule` are
actual widgets.

### Recovery Signals

Rejected as an umbrella name. HRV, Resting Heart Rate, Respiratory Rate, Skin
Temperature and Blood Oxygen are independently meaningful widgets.

### Restoration

Deferred. Mindfulness, breathing and restorative-session execution may justify
specific action widgets, but “Restoration” is currently a category rather than
one stable widget.

## Rest & Recovery pass result

Selected actual widgets:

`Last Sleep`, `Sleep Duration`, `Sleep Schedule`, `Sleep Stages`,
`Sleep Efficiency`, `Sleep Debt`, `Recovery`, `HRV`, `Resting Heart Rate`,
`Respiratory Rate`, `Skin Temperature`, `Blood Oxygen`,
`Physiological Stress`, `Perceived Stress`, `Naps`.

