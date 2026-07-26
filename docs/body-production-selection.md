# Body production selection and non-goals

Status: **INVALIDATED — depends on the rejected umbrella catalogue**  
Depends on: information universe, page-tailoring policy, umbrella catalogue,
scientific validation matrix and metric disposition registry.

> Do not use these selections as defaults, drawer contents or implementation
> priorities. Product selection resumes only after the competitor research is
> complete enough per Body submodule and the replacement umbrellas have been
> reviewed one by one.

## Purpose

This document separates three questions that must never be collapsed:

1. What the Body product is capable of representing.
2. What is available in the widget drawer for a particular user.
3. What is placed by default on a page.

The information universe is intentionally broad. The default product is
intentionally scarce. An umbrella is not promoted because data happens to
exist; it is promoted when it answers a recurring user question better than
the surrounding product already does.

## Selection vocabulary

- **Default**: placed during onboarding when it is relevant and sufficiently
  supported.
- **Recommended**: offered prominently in the drawer, but not placed without
  user intent.
- **Conditional**: available only when its prerequisites are satisfied.
- **Specialist**: useful for a narrower, explicitly selected use case.
- **Action**: starts or continues an activity rather than merely displaying a
  result.
- **Deferred**: deliberately not shipped until its evidence, data or product
  contract is adequate.

These labels control distribution, not design freedom. Within every supported
umbrella and element slot, everything remains possible when it has a clear
purpose, meaning, evidence disposition and privacy behavior.

## Default-set principles

1. Defaults answer different questions; they do not repeat the same signal in
   different visual forms.
2. No default depends on a source the user has not connected or a logging habit
   the user has not established.
3. A provider score may be default only for users of that provider and must
   retain the provider name.
4. Manual fallback is offered where a person can provide meaningful input. It
   never fabricates continuous sensor coverage.
5. Empty states explain the value and next action without pretending data
   exists.
6. Sensitive domains are opt-in, not inferred from profile attributes alone.
7. Page defaults are tailored to the page question. The same canonical fact
   may support different widgets without duplicating the stored record.
8. The system may recommend a different default set after the user changes
   goals, connected sources or tracking behavior; it does not silently
   rearrange a customized grid.

## Initial default sets

### Hub

**Default**

- `hub.body_today` when at least two meaningful Body domains have current data.
- `hub.daily_timeline` when linked plans or scheduled Body events exist.

**Recommended**

- `hub.quick_capture` for users relying partly on manual capture.
- `hub.body_signals` after sufficient personal history exists.

**Conditional**

- `hub.data_coverage` while a connection is incomplete, stale or conflicting.

The Hub does not receive a universal health/readiness score. Its job is to
orient across domains, not collapse the person into an opaque number.

### Activity

**Default**

- `activity.daily_movement` when movement data exists.
- `activity.recent_sessions` when a session history exists.

**Recommended**

- `activity.session_performance`
- `activity.plan_and_execute`
- `activity.strength_progress` for an explicitly selected strength goal

**Conditional**

- `activity.training_load` only after adequate session history and a compatible
  load measure exist.
- `activity.cardio_fitness` only with an eligible provider estimate or supported
  assessment.
- `activity.heart_rate_zones` only with a usable HR source and declared zone
  method.
- `activity.perceived_load` when manual session feedback is enabled.

**Specialist**

- `activity.performance_specialist`
- `activity.mobility`

### Nutrition

**Default**

- `nutrition.today_intake` when the user chooses nutrition logging.
- `nutrition.meal_timeline` after at least one intake event exists.
- `nutrition.hydration_intake` when hydration tracking is enabled.

**Recommended**

- `nutrition.macronutrients` when logged data is sufficiently complete.
- `nutrition.capture`

**Conditional**

- `nutrition.nutrient_adequacy` only when reference inputs and logging coverage
  are adequate; it must show coverage limitations.
- `nutrition.metabolic_observations` only from an eligible connected source.
- `nutrition.body_trend` only when body measurements exist and the user wants
  that relationship on Nutrition.

**Optional/sensitive**

- `nutrition.caffeine_alcohol`

**Deferred**

- Any opaque food-quality or nutrition score that cannot expose its inputs and
  interpretation.

### Rest & Recovery

**Default**

- `rest.last_sleep` when sleep data exists.
- `rest.sleep_pattern` after sufficient nights exist.
- `rest.recovery_signals` with compatible wearable data or explicit manual
  check-ins.

**Conditional**

- `rest.provider_recovery` for an eligible provider score.
- `rest.sleep_architecture` for an eligible provider, always framed as a
  consumer-wearable estimate.
- `rest.overnight_signals` when the necessary overnight signals exist.
- `rest.physiological_stress` for provider-derived stress data with provider
  semantics preserved.

**Recommended**

- `rest.perceived_stress_mood`
- `rest.restoration`
- `rest.sleep_plan`

The page does not ship a new Body-owned readiness or sleep-quality score in the
initial production release.

### Hygiene & Looks

**Default after explicit setup**

- `hygiene.routines_today`
- `hygiene.routine_consistency`

**Recommended templates**

- `hygiene.oral_care`
- `hygiene.skin_and_sun`
- `hygiene.hair_grooming`
- `hygiene.products`
- `hygiene.routine_builder`

**Optional/sensitive**

- `hygiene.appearance_observation`
- `hygiene.custom_observation`
- `hygiene.cycle`

The page remains user-extensible. Templates accelerate setup but do not define
the boundary of what can be tracked.

### Cross-domain measurements

These are recommended on the page where their current question is most useful.

- `measurements.vitals`: Conditional
- `measurements.body`: Recommended when measurements exist
- `measurements.clinical`: Conditional/sensitive
- `measurements.medication`: Conditional/sensitive/Action

Clinical-looking data never becomes a diagnosis merely because it is shown in
Body.

## Onboarding decisions

The initial grid is selected from declared intent and actual source
capabilities, not from demographic stereotypes.

Required product inputs:

- selected Body goals and domains;
- connected providers and granted permissions;
- manual-tracking preferences;
- relevant calculation inputs explicitly supplied by the user;
- sensitive-feature opt-ins;
- data availability and freshness.

Age, sex and other physiological inputs may alter an eligible calculation when
the metric specification requires them. They do not silently expose sensitive
widgets or decide a person's interests.

## Drawer behavior

The drawer may contain more than the defaults while still remaining curated.

1. Show umbrellas relevant to the current page first.
2. Show the actual 1x1 variant preview, rendered by the production component.
3. Explain unmet prerequisites before installation.
4. Keep provider-specific variants discoverable only for compatible sources.
5. Preserve removed widgets in the drawer with their configuration when safe.
6. Do not present unsupported or deferred concepts as selectable.
7. Keep user-created Hygiene & Looks trackers available even when they do not
   match a built-in template.

## Explicit production non-goals

The initial release does not:

- produce one universal Body/health score;
- invent a Body readiness, recovery or sleep score without validation;
- reinterpret a proprietary provider score as a provider-independent fact;
- promise diagnosis, treatment, injury prediction or disease prevention;
- use ACWR as an injury predictor;
- claim exact energy balance from wearable expenditure and logged intake;
- infer hydration status from water logging alone;
- treat consumer sleep staging as polysomnography truth;
- use HRV alone to diagnose stress, recovery or illness;
- use a fertile-window estimate as contraception;
- diagnose skin, hair, oral or other conditions from an image;
- rank attractiveness or moralize appearance;
- imply nutrient adequacy from incomplete intake coverage;
- merge measurements from incompatible sources into a false continuous trend;
- hide uncertainty, source, freshness or missing coverage when these change the
  interpretation;
- auto-place sensitive widgets without explicit intent.

## Promotion gate

An umbrella or variant may move toward production only when all applicable
answers are yes:

1. Does it answer a distinct user question?
2. Is its source path known and traceable?
3. Is its evidence disposition registered?
4. Are units, semantics, time basis and provenance explicit?
5. Are duplicate/conflict rules defined?
6. Is the minimum useful 1x1 state meaningful?
7. Are wearable, manual and missing-data behaviors honest?
8. Is its detail/history destination defined?
9. Are privacy and sensitive-data behaviors defined?
10. Does it add enough value to justify product and cognitive cost?
