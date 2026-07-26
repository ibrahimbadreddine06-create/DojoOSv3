# Widget umbrella specification — Data Coverage

Status: definitive system contract  
Umbrella ID: `hub.data_coverage`

## Operational contract

Repair, reconnect and permission actions are integral states. A successful
action updates the canonical source connection; the widget never simulates
restored coverage before a verified sync.

Question: **Is the current Body picture fresh, sufficient and conflict-free?**

Essential `1×1`: overall actionable state plus the most important affected
source/domain.

Inputs: connection, permission, last sync, valid-wear/coverage, duplicates,
provider delay and source changes. It never claims “complete” without defined
coverage criteria.

Variants: issue/action, source status, coverage field. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`.
