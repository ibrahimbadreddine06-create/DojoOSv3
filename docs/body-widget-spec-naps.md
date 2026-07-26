# Widget umbrella specification — Naps

Status: optional observation contract  
Umbrella ID: `rest.naps`

## Operational contract

Record/edit and, where configured, plan actions are integral. A planned nap and
an observed/manual nap remain separate until reconciled.

Question: **What naps were recorded and when?**

Essential `1×1`: latest/recent nap duration, time, source and state.

Resolve nap sessions separately from main sleep; manual entries stay manual.
Variants: latest nap, daily/weekly pattern, duration trend. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.

Detail exposes sessions, overlap resolution, edits and history.
