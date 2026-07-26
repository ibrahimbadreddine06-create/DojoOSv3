# Widget umbrella specification — Sleep Stages

Status: conditional provider-result contract  
Umbrella ID: `rest.sleep_stages`

Question: **What stage pattern did the selected provider estimate?**

Essential `1×1`: stage composition/timeline, provider and coverage. Preserve
original provider stages; canonical mapping never erases original semantics.

Variants: timeline, composition ring/field, same-provider trend. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Consumer stages are estimates, not PSG truth. Detail exposes interruptions,
unknown intervals, provider/device and history.

