# Hygiene & Looks widget umbrellas — research selection

Status: research-selected, awaiting stakeholder review  
Updated: 2026-07-25  
Ontology: `body-widget-ontology.md`

> Historical research selection. The later functional gate removed `Custom
> Tracker` as an umbrella while preserving unlimited user-defined routines and
> typed observations. Use `body-widget-catalogue-v2.md` for the current
> catalogue.

This submodule must remain unusually configurable. Templates can accelerate
setup, but the product cannot assume one universal hygiene or appearance
routine.

## 1. Routines

**Decision:** select.

**Widget identity:** today's configured hygiene/looks routine steps and their
completion state.

**Why it is an actual widget:** it is a checklist/execution widget. It does not
create a hierarchy above oral, skin, hair or custom routines; those are
configured routine instances/templates.

**Data:** user-defined routine, steps, schedule, completion and optional linked
planner block.

**Freedom:** every routine and step can be user-defined. The product catalogue
never defines the limit of what may exist.

## 2. Routine Consistency

**Decision:** select.

**Widget identity:** completion history against the user's own configured
schedule.

**Why separate from Routines:** execution today and longitudinal adherence are
different user jobs and visualizations.

**Calculation:** eligible completions divided by eligible scheduled
opportunities under a versioned timezone/missed-day rule.

**Truth boundary:** no universal “habit formed” countdown.

## 3. Cycle

**Decision:** select as explicit opt-in/conditional.

**Widget identity:** menstrual-cycle status, history and prediction under the
selected source/mode.

**Data:** period events, symptoms and optional eligible temperature/test inputs.

**Calculation:** provider prediction stays provider-owned; any Body projection
requires a separately validated method.

**Truth boundary:** prediction uncertainty remains visible; not contraception
unless a specifically regulated product/mode establishes that use.

## 4. Skin Progress

**Decision:** select as optional.

**Widget identity:** comparable skin observations over time.

**Data:** standardized photos, user observations, selected concern/area,
capture conditions and linked routine/product context.

**Why it deserves a widget:** repeated visual comparison is a stable user job
that is not equivalent to completing a skincare routine.

**Truth boundary:** no diagnosis or automated medical/appearance judgment.
Image comparison must expose capture inconsistency.

## 5. Appearance Progress

**Decision:** select as optional.

**Widget identity:** user-chosen appearance observation tracked through
comparable entries.

**Why separate from Skin Progress:** the scope may be hair, grooming, posture
or another personally defined visual outcome and must not be forced into skin
semantics.

**Data:** user-defined observation, comparable media/measurement, timestamp and
context.

**Truth boundary:** the user defines the target; the system does not impose an
ideal appearance.

## 6. Products

**Decision:** select.

**Widget identity:** products currently used in a configured routine, with
schedule, start date and optional reaction/expiry context.

**Why it is one actual widget:** it helps answer what is being used now and
supports correction/history. It is not a grouping layer above routines.

**Data:** product identity, ingredients only when reliably available, usage
events, routine link, open/expiry date and user observations.

**Truth boundary:** tracking use does not prove efficacy or safety.

## 7. Symptoms

**Decision:** select as user-defined and sensitive.

**Widget identity:** history of one user-chosen symptom/condition observation.

**Why one chosen observation matters:** a generic dashboard of every symptom
would become a category. Each installed widget instance focuses on the exact
thing the user chose to track.

**Data:** selected scale or state, time, optional body area and context.

**Truth boundary:** no diagnosis; associations with products/routines are not
causal conclusions.

## 8. Custom Tracker

**Decision:** select.

**Widget identity:** one user-defined hygiene/looks observation that the
provided templates do not cover.

**Why it is essential here:** the research cannot enumerate every routine,
condition, practice, culture, access constraint or appearance goal.

**Configuration:** name, icon, unit/scale/state, optional schedule and privacy.

**Freedom rule:** everything can be tracked when the representation is safe and
the user supplies its meaning. The app does not invent interpretation merely
because a value can be stored.

## Candidates deliberately not selected

### Oral Care, Skin Care, Hair Care and Grooming as fixed umbrellas

Not selected by default. They are valuable setup templates/configurations for
`Routines`, `Routine Consistency`, `Products`, `Symptoms` or `Custom Tracker`.
Promoting every routine domain into a fixed umbrella would reduce flexibility
and multiply equivalent backend behavior.

This is not a permanent prohibition. A domain can later earn a standalone
umbrella when it needs a genuinely distinct product/data contract.

### Hygiene Score / Looks Score

Rejected. No defensible universal score exists, and it would impose one
normative model on highly personal behavior.

### Condition Diagnosis

Rejected from the wellness widget catalogue. Tracking an observation is not
diagnosis.

## Hygiene & Looks pass result

Selected actual widgets:

`Routines`, `Routine Consistency`, `Cycle`, `Skin Progress`,
`Appearance Progress`, `Products`, `Symptoms`, `Custom Tracker`.
