# Widget umbrella specification — Today

Status: cross-domain research-gated contract  
Umbrella ID: `hub.today`

## Operational contract

An item may contain a next action when that action is currently more useful
than another summary. The action mutates its source commitment/execution and
routes to the owning submodule; Today never keeps private completion state.

Question: **What scarce, explainable Body information deserves attention now?**

Essential `1×1`: one to three eligible items with reason, source/freshness and
drill-through. There is no universal Body score.

Selection policy must be versioned, suppress duplicate conclusions, respect
user priorities and fail safely under missing/conflicting data.

Variants: ranked concise summary, domain balance, change-focused composition.
Initial sizes remain pending ranking-policy validation.
