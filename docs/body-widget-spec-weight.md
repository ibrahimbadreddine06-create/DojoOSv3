# Widget umbrella specification — Weight

Status: definitive observation contract  
Umbrella ID: `hub.weight`

Question: **What weight was measured, and how is the same-source trend changing?**

Essential `1×1`: latest weight, date/source and trend state.

Normalize units while preserving originals. Robust trend is versioned;
provider/device changes create comparability events.

Variants: latest/trend, goal context, measurement history. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`. Weight change is not automatically fat change.

