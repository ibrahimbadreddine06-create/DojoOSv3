# Widget umbrella specification — Cardio Fitness

Status: conditional provider/measurement contract  
Updated: 2026-07-25  
Umbrella ID: `activity.cardio_fitness`

## Identity

Question: **What aerobic-capacity value was measured or estimated, and how is
the same method changing over time?**

Essential `1×1`: value, unit, measured/estimated label, provider/method and
state.

## Data

Laboratory VO₂ max is an observation. Wearable cardio-fitness/VO₂ max is a
provider-owned estimate. Body does not synthesize its own estimate initially.

## Truth

Same-source trend is valid context. Different modalities/providers do not form
one continuous trend without an explicit comparability break. “Estimated”
never disappears.

## Variant directions

- value and same-source trend;
- category/range only when the reference population is explicit;
- modality-specific history.

Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Detail exposes method, modality, source, reference applicability, history and
limitations.

