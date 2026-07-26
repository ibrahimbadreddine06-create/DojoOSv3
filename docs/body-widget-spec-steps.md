# Widget umbrella specification — Steps

Status: first definitive umbrella specification  
Updated: 2026-07-25  
Umbrella ID: `activity.steps`  
Submodule: Activity

## Stable identity

Name: **Steps**  
Question: **How many steps were recorded in the selected period, and what does
their distribution or progress look like?**

Steps is the widget. Hourly bars, a total-first composition or a goal-focused
composition are variants of Steps, not child umbrellas.

## Essential `1×1` answer

- recorded step total;
- selected period/local day;
- state when the total is partial, stale or otherwise limited;
- source/provenance available through local interaction and detail.

Distance and active energy are not essential Steps content. They have their
own umbrellas. A larger Steps variant may reference another metric only when a
reviewed composition has a real reason; it cannot silently turn Steps back
into “Daily Movement”.

## Data contract

Canonical input: `activity.steps`

Required:

- value/count;
- interval or local day;
- provider and source record identity;
- device/application identity when available;
- timezone/day-boundary context;
- coverage/freshness state;
- deduplication resolution.

Aggregation:

1. retain original provider records;
2. resolve overlaps by source priority and identity evidence;
3. never sum overlapping daily totals from multiple providers;
4. aggregate only eligible non-overlapping intervals;
5. preserve source changes as comparability events.

## Product disposition

Type: production observation.

Allowed:

- “Recorded steps”
- same-source trend
- progress against a user-selected goal
- hourly distribution when actual interval data exists

Not allowed:

- “True steps”
- universal 10,000-step health requirement
- invented hourly distribution from one daily total
- fabricated continuous data for a manual user
- summing Apple/Google/Garmin/etc. totals because the values look different

## Manual and wearable behavior

Wearable/platform source is primary.

Manual fallback may:

- add a dated recorded total with explicit manual provenance;
- correct an import when product policy allows it;
- set or change a personal goal.

Manual fallback may not:

- fabricate hourly buckets;
- claim full-day coverage;
- imitate a connected wearable.

## States

The widget explicitly supports:

- not configured;
- awaiting first data;
- valid;
- partial coverage;
- stale;
- unsupported source;
- permission lost;
- conflicting sources;
- provider delayed;
- error.

When a safe historical value exists during stale/delayed state, it may remain
visible with the limitation. A conflict never produces a silently combined
total.

## Variants

### Recorded Total

Primary visualization: the recorded total itself, supported by concise state or
comparison context.

Purpose: fastest glance for users who prefer the number.

Initial sizes:

- `1×1`
- `1×2`
- `2×1`
- `2×2`

### Hourly Pattern

Primary visualization: real interval/hour distribution.

Purpose: show when movement occurred, not only how much.

Fallback: when interval data is absent, this variant shows a truthful
unavailable/total-only state; it never invents buckets.

Initial sizes:

- `1×1`
- `1×2`
- `2×1`
- `2×2`

### Goal Progress

Primary visualization: progress toward a user-selected personal step goal.

Purpose: goal-oriented glance without presenting the goal as universal health
truth.

Initial sizes:

- `1×1`
- `1×2`
- `2×1`
- `2×2`

All intermediate sizes are supported if a farther size is later added.

## Size progression

Every size retains the total, period and limitation state.

Larger footprints may add:

- finer time resolution;
- previous comparable period;
- goal remaining/completion;
- peak interval;
- source/coverage context.

Added dimensions are used purposefully. A taller footprint does not solve
space by forcing unrelated information left/right.

## Interaction

- Exact interval values appear beside the hovered/focused/tapped mark.
- The total receives a short hint only when its meaning is otherwise
  ambiguous.
- Card activation opens Steps detail/history.
- Keyboard and touch have equivalents for hover behavior.
- Accent customization changes the real renderer.

## Detail/history destination

The Steps detail surface includes:

- day/week/month/custom history;
- source and coverage timeline;
- hourly distribution where available;
- goal history;
- corrections/source conflicts;
- explanation of what is measured and what is not.

## E-design application

- fixed E top: title/meta left, Steps icon right;
- center: the primary total/pattern/progress visualization;
- bottom: a free composition chosen per variant and size;
- no decorative marks without data/state meaning;
- no default “footer” styling;
- all geometry/content responds to the supported footprint.

## Acceptance tests

1. Two overlapping provider totals never add together.
2. A daily-only source never produces fake hourly bars.
3. Partial and stale totals remain visibly qualified.
4. Manual totals remain visibly manual.
5. Current resize target and every supported target stay visible.
6. Drawer preview uses the exact `1×1` renderer.
7. All variants use umbrella ID `activity.steps`.
8. Distance and energy do not become required Steps content.

