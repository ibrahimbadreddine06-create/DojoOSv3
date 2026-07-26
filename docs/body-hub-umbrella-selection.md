# Hub widget umbrellas — research selection

Status: research-selected, awaiting stakeholder review  
Updated: 2026-07-25  
Ontology: `body-widget-ontology.md`

## Hub placement principle

The Hub is an overview. It may place a Hub-tailored variant of an existing
umbrella such as `Steps`, `Recovery`, `Last Sleep`, `Calories` or `Routines`.
That does not create a duplicate umbrella. The same widget identity, data
contract and detail destination are reused while the page-specific variant may
emphasize different context.

The Hub also needs a small number of genuinely cross-domain widgets.

## 1. Today

**Decision:** select.

**Widget identity:** a scarce, explainable overview of what matters across
Body today.

**Why it is an actual widget rather than a hierarchy:** it is one installed
overview composition with one detail/explanation contract. It does not contain
the other widgets in the drawer or rename them as children.

**Data:** eligible current facts from selected submodules, freshness and reason
for inclusion.

**Truth boundary:** no universal Body score. Every surfaced item retains its
source and opens the underlying evidence.

## 2. Body Timeline

**Decision:** select as optional.

**Widget identity:** chronological Body-relevant events for the selected day.

**Data:** resolved sleep boundaries, activities, intake events, measurements,
routine completions and explicitly linked planner events.

**Why it is not planning:** its primary role is overview/recall. It can open an
event but does not turn the Hub into a generic planner.

## 3. Data Coverage

**Decision:** select as contextual/system widget.

**Widget identity:** whether the current Body view has fresh, sufficient and
non-conflicting source data.

**Data:** connection state, last sync, valid-wear/coverage where known,
permission status, unresolved duplicates and source changes.

**Visibility:** recommended when a problem affects interpretation; optional in
the drawer for users who actively manage multiple devices.

## 4. Heart Rate

**Decision:** select.

**Widget identity:** recorded heart-rate series/current summary for a declared
context and period.

**Page tailoring:** Hub can show all-day/current context; Activity can show
exercise context; Rest can show overnight/resting context. It remains one
umbrella only when the data contract and user meaning remain coherent.

**Truth boundary:** ordinary wearable HR is not an ECG or medical rhythm
interpretation.

## 5. Weight

**Decision:** select.

**Widget identity:** measured body-weight observation and source-consistent
trend.

**Data:** measurements, unit, source/device, time and quality context.

**Calculation:** robust trend may be shared across variants; raw measurements
remain accessible.

**Truth boundary:** a change is not automatically fat change.

## 6. Body Composition

**Decision:** select as conditional.

**Widget identity:** provider-measured/estimated composition values and
same-source trend.

**Why separate from Weight:** body-fat, lean-mass, water and related estimates
have different measurement uncertainty and may change independently.

**Truth boundary:** consumer BIA values are estimates; methods/providers are
not silently interchangeable.

## 7. Blood Pressure

**Decision:** select as conditional/sensitive.

**Widget identity:** paired systolic/diastolic measurement history with source
and measurement context.

**Data:** paired values, unit, posture/device/context when available.

**Truth boundary:** cuffless/provider-estimated values remain explicitly
identified; no diagnosis or treatment instruction.

## 8. Blood Glucose

**Decision:** select as conditional/sensitive.

**Widget identity:** eligible glucose observations over time.

**Data:** value, unit, source/device, timing and meal/activity links where
explicit.

**Truth boundary:** meal relationships are observational; clinical
interpretation requires a separately approved path.

## Candidates deliberately not selected

### Body Signals / Vitals

Rejected as umbrella names. They group Heart Rate, Blood Pressure, HRV,
Respiratory Rate, Blood Oxygen, Temperature and other actual widgets.

### Quick Capture

Not selected as a Hub umbrella. It is a workflow category and contradicts the
Hub's primary overview purpose unless a later concrete widget is independently
justified.

### Cross-domain Measurements

Rejected as the exact extra grouping layer that caused the prior failure.
`Weight`, `Body Composition`, `Blood Pressure`, `Blood Glucose` and other
measurements are widgets directly under the relevant Body submodule placement.

## Hub pass result

Hub-native widgets:

`Today`, `Body Timeline`, `Data Coverage`, `Heart Rate`, `Weight`,
`Body Composition`, `Blood Pressure`, `Blood Glucose`.

The Hub can additionally place tailored variants of any eligible existing
umbrella without creating a second umbrella identity.

