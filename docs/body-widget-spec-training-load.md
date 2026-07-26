# Widget umbrella specification — Training Load

Status: conditional information contract; method-specific validation required  
Updated: 2026-07-25  
Umbrella ID: `activity.training_load`

## Identity

Question: **How is one consistent training-load series developing relative to
its own recent history?**

Essential `1×1`: current/recent load, named method/source, comparison window
and eligibility state.

## Calculation rule

- Provider load is displayed as a provider-owned result.
- Body sRPE may use `duration_minutes × CR-10 RPE` under its versioned contract.
- A Body cardiovascular model does not ship until one exact validated method
  and population boundary are chosen.
- Unlike methods are never averaged or plotted as one continuous scale.

## Truth

Allowed: descriptive recent-versus-longer-history context.

Forbidden: injury probability, overtraining diagnosis, universal “safe” ACWR
band, or method-free “training load”.

## Variant directions

- recent and longer load trajectories;
- sessions contributing to the current period;
- current load against a personalized/descriptive reference band.

## Sizes/detail

Initial: `1×1`, `1×2`, `2×1`, `2×2`, `3×1`.

Detail exposes every contributing session, method/version, windows, source
changes, missing sessions and subjective inputs.

