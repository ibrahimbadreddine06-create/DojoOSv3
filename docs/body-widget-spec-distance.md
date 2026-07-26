# Widget umbrella specification — Distance

Status: definitive information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.distance`

## Identity

Question: **How much distance was recorded for the selected period or
modality?**

Essential `1×1`: distance, period/modality, source resolution and state.

## Data and calculation

- Normalize eligible values to a canonical length while preserving originals.
- Resolve session/daily overlap before aggregation.
- Keep walking, running, cycling, swimming, wheelchair and other modalities
  distinguishable.
- Do not convert steps into distance unless the source or named Body method
  explicitly produced that estimate.

## Truth

Recorded and estimated distance must remain distinguishable. GPS gaps,
indoor estimates and source changes affect confidence/comparability.

## Variant directions

- total and comparable trend;
- modality composition;
- session distribution.

Route geometry belongs in activity detail or a separately justified widget; it
is not required Distance content.

## Sizes and detail

Initial: `1×1`, `1×2`, `2×1`, `2×2`.

Detail provides history, modality/source filters, contributing sessions,
coverage and corrections.

