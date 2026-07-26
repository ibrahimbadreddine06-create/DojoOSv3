# Body widget variants and supported sizes

Status: **PARTIALLY VALID — sizing/E rules remain valid; umbrella matrix is invalid**  
Depends on: umbrella catalogue, production selection and E design language.

> The general variant, sizing, scaling and interaction rules remain active.
> The “Initial umbrella matrix” below was derived from the invalidated
> catalogue and must not drive product or implementation work.

## Coordinate convention

Sizes are written `columns × rows`.

- `1×1`: one column, one row
- `1×2`: one column, two rows (taller)
- `2×1`: two columns, one row (wider)

This convention is stored in code and product copy. It may never reverse by
component.

## Variant and size are different

A **widget umbrella** owns a user question.  
A **variant** is a coherent way to answer it.  
A **size** is a supported layout state of that same variant.

A line, ring, number, composition or unique visual can be a variant choice; it
does not create a new umbrella by itself. A larger size does not become a new
variant merely because its composition changes.

## Size-support rules

1. Every production variant has a useful `1×1`.
2. Every initial production variant supports `1×2` and `2×1`, unless a reviewed
   exception documents why the orientation is meaningless or unsafe.
3. If a variant supports a farther size along one axis, all intermediate grid
   sizes along that resize path are supported.
4. The resize affordance always shows every supported size, including the
   current size.
5. Drag-resize snaps to a visible supported target; the user never guesses
   blindly.
6. Each supported size is intentionally composed. Stretching is allowed when
   it remains the best composition, but it is never the unexamined default.
7. Information essential at `1×1` remains present at larger sizes.
8. Larger sizes may add context, resolution, history or actions that do not fit
   the smaller size.
9. Additional content is cumulative where that preserves meaning, but a
   different orientation may reorganize the same information instead of
   mechanically stacking it.
10. Unsupported sizes are not reachable by keyboard, pointer or restored
    persistence.

Everything remains possible inside a supported composition. These rules define
truthful resizing, not a finite list of allowed visual ideas.

## Scale behavior

### Same footprint on a smaller device

When the grid cell itself becomes physically smaller, the whole widget system
scales coherently:

- outer card geometry;
- card border;
- card inset;
- inter-zone spacing;
- typography;
- icons;
- visualization geometry and strokes;
- controls, remove affordance and resize handle.

The visual scale may use readability safeguards, but it cannot leave only the
top title microscopically small while the center remains dominant.

### Different grid size

Changing from `1×1` to `1×2` or `2×1` is layout adaptation, not uniform zoom.
Zones and composition use the newly available dimension. The component chooses
the matching explicit layout state.

### Interaction geometry

Visual scaling never reduces a required touch target below its interaction
minimum. The visible glyph may scale while its invisible hit target remains
usable and does not overlap neighboring actions.

## Information tiers

Size planning uses three semantic tiers:

- **Essential**: the minimum truthful answer to the umbrella question.
- **Context**: source, comparison, contributor or coverage needed to interpret
  it better.
- **Exploration**: richer time resolution, breakdown or action that rewards a
  larger footprint.

These tiers do not prescribe what an element slot may contain. Everything can
be used when purposeful.

## Initial umbrella matrix

The matrix establishes the first implementation targets. Additional variants
and sizes can be added through the same product gate.

### Hub

| Umbrella | Initial variant families | Initial supported sizes | Larger-size purpose |
|---|---|---|---|
| `hub.body_today` | Editorial signal composition; domain pulse composition | `1×1`, `1×2`, `2×1`, `2×2` | More domain context and why an item deserves attention; never a universal score |
| `hub.daily_timeline` | Next-event focus; compact day rail | `1×1`, `1×2`, `2×1`, `2×2` | More upcoming/completed events and action affordances |
| `hub.body_signals` | Signal cards; compact trend composition | `1×1`, `1×2`, `2×1` | Additional compatible signals and coverage context |
| `hub.data_coverage` | Connection health; source coverage | `1×1`, `1×2`, `2×1` | Per-source/resource state and repair actions |
| `hub.quick_capture` | Contextual action; capture palette | `1×1`, `1×2`, `2×1` | More relevant capture actions without becoming a permanent menu dump |

### Activity

| Umbrella | Initial variant families | Initial supported sizes | Larger-size purpose |
|---|---|---|---|
| `activity.daily_movement` | Progress composition; day-pattern composition | `1×1`, `1×2`, `2×1`, `2×2` | Breakdown by compatible movement signals and hourly pattern |
| `activity.movement_pattern` | Time rail; activity-density composition | `1×1`, `1×2`, `2×1`, `3×1` | Finer temporal resolution |
| `activity.recent_sessions` | Latest-session focus; session stack | `1×1`, `1×2`, `2×1`, `2×2` | More sessions and compact comparisons |
| `activity.session_performance` | Metric-led; route/shape-led; split-led | `1×1`, `1×2`, `2×1`, `2×2`, `3×1` | Route, split, zone and compatible sensor context |
| `activity.training_load` | Load history; contributor composition | `1×1`, `1×2`, `2×1`, `2×2` | More history and transparent contributors, never injury prediction |
| `activity.perceived_load` | sRPE focus; RPE/history composition | `1×1`, `1×2`, `2×1` | Session history and completion coverage |
| `activity.cardio_fitness` | Provider estimate; estimate trend | `1×1`, `1×2`, `2×1` | Compatible history and provider method context |
| `activity.heart_rate_zones` | Zone distribution; zone timeline | `1×1`, `1×2`, `2×1`, `2×2` | More zones/time resolution under the declared model |
| `activity.strength_progress` | Exercise focus; volume/history composition | `1×1`, `1×2`, `2×1`, `2×2` | Additional sets/reps/load history and exercise comparison |
| `activity.mobility` | Routine progress; range/history where eligible | `1×1`, `1×2`, `2×1` | More movements and history |
| `activity.plan_and_execute` | Next-session action; plan stack | `1×1`, `1×2`, `2×1`, `2×2` | Exercise list and session controls |
| `activity.performance_specialist` | Sport-specific composition | At least `1×1`, `1×2`, `2×1`; reviewed per sport | Sport-specific depth justified by its data |

### Nutrition

| Umbrella | Initial variant families | Initial supported sizes | Larger-size purpose |
|---|---|---|---|
| `nutrition.today_intake` | Intake coverage; energy/macronutrient composition | `1×1`, `1×2`, `2×1`, `2×2` | Meal/coverage detail; no exact energy-balance claim |
| `nutrition.meal_timeline` | Recent-meal focus; meal rail | `1×1`, `1×2`, `2×1`, `3×1` | More meals and temporal context |
| `nutrition.macronutrients` | Proportion composition; target comparison | `1×1`, `1×2`, `2×1` | More context and logging coverage |
| `nutrition.nutrient_adequacy` | Nutrient focus; adequacy matrix | `1×1`, `1×2`, `2×1`, `2×2` | Additional nutrients, reference context and coverage |
| `nutrition.food_pattern` | Food-group composition; frequency pattern | `1×1`, `1×2`, `2×1`, `2×2` | Longer pattern and category context |
| `nutrition.hydration_intake` | Fluid vessel/unique visual; intake timeline | `1×1`, `1×2`, `2×1` | Event history and source/coverage, not hydration-state inference |
| `nutrition.caffeine_alcohol` | Latest/total focus; timing rail | `1×1`, `1×2`, `2×1` | Timing and user-defined context |
| `nutrition.metabolic_observations` | Provider observation; compatible trend | `1×1`, `1×2`, `2×1`, `2×2` | More history and source context |
| `nutrition.body_trend` | Measurement trend; relationship view | `1×1`, `1×2`, `2×1`, `2×2` | Compatible intake/body history without causal claims |
| `nutrition.capture` | Contextual capture; recent/repeat capture | `1×1`, `1×2`, `2×1` | More capture methods and recent items |

### Rest & Recovery

| Umbrella | Initial variant families | Initial supported sizes | Larger-size purpose |
|---|---|---|---|
| `rest.last_sleep` | Duration/efficiency composition; episode timeline | `1×1`, `1×2`, `2×1`, `2×2` | Episode timing, awakenings and honest provider context |
| `rest.sleep_pattern` | Timing trend; regularity composition | `1×1`, `1×2`, `2×1`, `2×2`, `3×1` | Longer history and schedule context |
| `rest.sleep_architecture` | Stage composition; episode stage rail | `1×1`, `1×2`, `2×1` | More stage detail with wearable-estimate qualification |
| `rest.overnight_signals` | Signal focus; multi-signal trend | `1×1`, `1×2`, `2×1`, `2×2` | Compatible HR/HRV/respiration/SpO2 context |
| `rest.provider_recovery` | Provider score; contributor composition | `1×1`, `1×2`, `2×1` | Provider-exposed contributors and trend |
| `rest.recovery_signals` | Baseline-deviation composition; manual/wearable check-in | `1×1`, `1×2`, `2×1`, `2×2` | Multiple compatible signals without inventing a score |
| `rest.physiological_stress` | Provider stress timeline; stress/rest distribution | `1×1`, `1×2`, `2×1`, `2×2` | More temporal detail and provider semantics |
| `rest.perceived_stress_mood` | Current check-in; subjective trend | `1×1`, `1×2`, `2×1` | More history and annotation |
| `rest.restoration` | Next-rest action; restoration history | `1×1`, `1×2`, `2×1` | More restorative activities and completion |
| `rest.sleep_plan` | Next sleep window; schedule pattern | `1×1`, `1×2`, `2×1`, `2×2` | More schedule days and actions |

### Hygiene & Looks

| Umbrella | Initial variant families | Initial supported sizes | Larger-size purpose |
|---|---|---|---|
| `hygiene.routines_today` | Next routine; routine checklist composition | `1×1`, `1×2`, `2×1`, `2×2` | More tasks and direct completion actions |
| `hygiene.routine_consistency` | Adherence focus; routine history | `1×1`, `1×2`, `2×1`, `2×2` | More routine/period context |
| `hygiene.oral_care` | Routine composition; user-selected observation | `1×1`, `1×2`, `2×1` | More relevant routine steps/history |
| `hygiene.skin_and_sun` | Routine composition; exposure/product context | `1×1`, `1×2`, `2×1` | More steps and user observations without diagnosis |
| `hygiene.hair_grooming` | Routine composition; schedule/history | `1×1`, `1×2`, `2×1` | More steps/history |
| `hygiene.appearance_observation` | User observation; private history | `1×1`, `1×2`, `2×1` | More user-authored history; no automated attractiveness score |
| `hygiene.products` | Current product; product routine | `1×1`, `1×2`, `2×1` | More products, reminders and user notes |
| `hygiene.cycle` | Current phase/record; cycle timeline | `1×1`, `1×2`, `2×1`, `2×2` | Logged period/symptom history with uncertainty |
| `hygiene.custom_observation` | User-defined focus; custom history | `1×1`, `1×2`, `2×1` | More of the user's chosen fields |
| `hygiene.routine_builder` | Next action; routine editor entry | `1×1`, `1×2`, `2×1` | More actions/templates without limiting custom creation |

### Cross-domain measurements

| Umbrella | Initial variant families | Initial supported sizes | Larger-size purpose |
|---|---|---|---|
| `measurements.vitals` | Latest reading; compatible trend | `1×1`, `1×2`, `2×1`, `2×2` | More readings and protocol/source context |
| `measurements.body` | Latest measurement; compatible trend/composition | `1×1`, `1×2`, `2×1`, `2×2` | More measurements and history |
| `measurements.clinical` | Latest result; result timeline | `1×1`, `1×2`, `2×1` | Issuer/status/reference context and detail route |
| `measurements.medication` | Next intake; schedule/adherence | `1×1`, `1×2`, `2×1`, `2×2` | More schedule, history and actions |

## Per-variant implementation manifest

Every implemented variant receives a machine-readable manifest containing:

- umbrella and variant IDs;
- human-readable variant name;
- supported sizes in ordered resize paths;
- default size;
- essential/context/exploration fields per size;
- eligible metric/source requirements;
- state-envelope support;
- actual `1×1` preview renderer reference;
- detail destination;
- interaction and privacy flags;
- design-spec version.

The manifest is the single source for drawer availability, resize targets,
persistence validation and preview rendering. These behaviors may not maintain
separate size lists.

## Review gate per variant

Before a variant enters production:

1. The visualization has a real semantic mapping to data.
2. Every visible mark can be explained.
3. The layout uses its available orientation intentionally.
4. Bottom composition is not treated as a generic gray footer.
5. The center remains the main visualization/composition space.
6. Essential content survives every supported size.
7. Additional large-size content is genuinely useful.
8. Empty, stale, partial, conflict and permission states fit.
9. Hover/focus/tap explanations are short, local and not redundant.
10. Preview and placed `1×1` are the same component instance/configuration.
