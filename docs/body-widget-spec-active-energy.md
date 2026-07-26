# Widget umbrella specification — Active Energy

Status: definitive information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.active_energy`

## Identity

Question: **How much active energy did the selected provider estimate?**

Essential `1×1`: estimated active energy, period, provider and state.

## Data and calculation

- Use active-energy records only.
- Basal/resting and total energy remain separate fields.
- Normalize units and resolve overlap without re-estimating physiology.
- Same-source aggregation is allowed when record semantics match.

## Truth

Always estimated. Never exact expenditure, exact calorie balance, or evidence
that eating/exercise should be adjusted by the displayed amount.

Provider/device changes create comparability breaks.

## Variant directions

- estimate-first total;
- time distribution when real intervals exist;
- same-source trend.

## Sizes and detail

Initial: `1×1`, `1×2`, `2×1`, `2×2`.

Detail exposes active versus total distinction, provider/device, coverage,
contributing sessions and uncertainty.

