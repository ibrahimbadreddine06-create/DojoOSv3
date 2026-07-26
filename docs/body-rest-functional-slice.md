# Rest & Recovery functional vertical slice

Status: product contract; `Rest Plan` umbrella gate remains open  
Updated: 2026-07-25

## Outcome

Rest & Recovery supports sleep, naps and other restorative actions while
keeping plans, observed sessions, subjective states and provider outputs
semantically separate.

## Existing hybrid umbrellas

- Last Sleep: observed/manual session and correction.
- Sleep Schedule: timing history plus sleep-window planning.
- Perceived Stress: manual check-in.
- Naps: record and optionally plan a nap.

All other selected physiological/recovery umbrellas remain informational unless
their own purpose justifies a local action.

## `Rest Plan` gate

Do not add a generic Rest Plan merely to mirror another submodule.

Approve it only if research/product composition proves a durable cross-rest
operation that Sleep Schedule, Naps and specific restorative actions cannot
own coherently. Otherwise, planning stays inside those stable umbrellas and the
shared Planner lens.

## Canonical separation

- sleep/rest commitment;
- actual rest execution;
- provider-observed sleep/session;
- manual sleep/session;
- subjective check-in;
- physiological observation;
- provider insight;
- Body derivation.

Provider recovery/readiness is not an execution and cannot be “completed.”

## Reconciliation

A planned sleep window and observed sleep may differ. Both survive. The product
can calculate lateness, duration difference or overlap only through a versioned
method with timezone/DST handling.

Overlapping provider sleep sessions are resolved without deleting assertions.
Naps remain distinguishable from main sleep.

## Current-code gaps

- `sleepLogs` combines planned and actual hours.
- no typed Planner commitment or reconciliation exists;
- manual/provider provenance is incomplete;
- quality/readiness fields lack calculation/source versions;
- no general restorative-action entity/execution exists.

## Acceptance tests

1. Sleep plan and observed sleep are independently inspectable.
2. Travel/DST does not corrupt schedule comparison.
3. Manual sleep remains visibly manual.
4. Naps do not merge into main sleep accidentally.
5. Provider recovery remains source-labelled.
6. Missing wearable data never becomes a recovery conclusion.

