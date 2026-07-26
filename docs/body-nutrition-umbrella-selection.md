# Nutrition widget umbrellas — research selection

Status: research-selected, awaiting stakeholder review  
Updated: 2026-07-25  
Ontology: `body-widget-ontology.md`

Every decision below is one actual widget. Nutrition is treated as intake:
what enters the body, when, how much, and what the logged intake contains.

## 1. Calories

**Decision:** select.

**Widget identity:** logged dietary energy for the selected period against an
explicit target or reference when one exists.

**Data:** resolved food/beverage entries and energy values with database,
serving and logging provenance.

**Calculation:** sum logged non-duplicate energy. Target calculation is
separate, versioned and may differ when purpose/population requires it.

**Truth boundary:** incomplete logging is not a complete energy intake; it
cannot create an exact energy-balance claim.

## 2. Macronutrients

**Decision:** select.

**Widget identity:** composition of logged intake across protein,
carbohydrate and fat, with other directly related nutrients available when the
variant purpose requires them.

**Why separate from Calories:** total energy and nutrient composition answer
different questions and support different visualizations.

**Data:** nutrient quantities from resolved entries, with unknown values kept
unknown rather than converted to zero.

**Variants:** may emphasize the whole composition or one macro without creating
a new hierarchy layer.

## 3. Fiber

**Decision:** select.

**Widget identity:** logged fibre intake and trend against an applicable,
explicit reference.

**Why separate from Macronutrients:** fibre has a distinct user goal,
reference-value meaning and food-quality relevance that can justify a focused
widget without requiring the full macro composition.

**Truth boundary:** dependent on sufficient logging and database completeness.

## 4. Micronutrients

**Decision:** select as optional/advanced.

**Widget identity:** logged vitamin and mineral coverage for selected nutrients
against applicable reference values.

**Why it is one widget rather than an umbrella group:** it is a single
configurable adequacy/completeness widget. Individual nutrient focus is a
configuration/variant unless later evidence proves a standalone widget is
needed.

**Data:** nutrient values, applicable reference population, log coverage and
unknown fields.

**Truth boundary:** not a deficiency diagnosis; unknown is never zero.

## 5. Water Intake

**Decision:** select.

**Widget identity:** logged water or deliberately selected total-fluid intake.

**Why separate:** it has a strong independent daily job and unique logging/
visual possibilities.

**Data:** intake events in canonical volume, with plain-water versus total-fluid
scope explicit.

**Truth boundary:** intake tracking is not hydration-status measurement.

## 6. Recent Meals

**Decision:** select.

**Widget identity:** recent resolved meal/snack records in temporal order.

**Why it is a widget:** it provides recall, correction, reuse and entry detail.
It is not a category containing the nutrition widgets.

**Data:** meal time, components, image when available, compact nutrition
summary, source and completeness.

**Interaction:** opens meal detail and supports correction/reuse.

## 7. Caffeine

**Decision:** select as optional.

**Widget identity:** logged caffeine amount and timing.

**Why separate from generic intake:** timing is central to interpretation, and
the user may want caffeine without general calorie tracking.

**Data:** explicit caffeine entries and food/beverage-derived caffeine with
source confidence.

**Truth boundary:** personal association with sleep is observational unless a
separate validated model exists.

## 8. Alcohol

**Decision:** select as opt-in sensitive.

**Widget identity:** logged alcohol amount, timing and frequency.

**Why separate from Caffeine:** its units, risk communication, privacy and
interpretation are materially different.

**Data:** standardized amount plus original beverage/serving.

**Truth boundary:** no moral score and no causal attribution from a single
observation.

## 9. Supplements

**Decision:** select.

**Widget identity:** scheduled and consumed supplement intake.

**Why it deserves a widget:** it is intake, often absent from food logs, and
has a stable adherence/history job.

**Data:** product/ingredient, dose, unit, schedule, taken state and source.

**Truth boundary:** tracking does not recommend efficacy, safety or dosage.
Medication remains a separate clinical/safety domain.

## 10. Fasting

**Decision:** select as optional.

**Widget identity:** current or completed user-declared fasting interval.

**Why it is an actual widget:** a timer/state/history composition can stand
alone and has a stable user purpose.

**Data:** user-declared or app-recorded start/end, duration and plan.

**Truth boundary:** no automatic metabolic-state claims from elapsed time
alone.

## Candidates deliberately not selected

### Today Intake

Rejected as an umbrella. It groups Calories, Macronutrients, Water, Meals and
other actual widgets and would recreate the invalid extra hierarchy layer.

### Nutrient Adequacy

Not used as a second umbrella above nutrients. The defensible concept is
represented directly by `Micronutrients`, with reference comparison inside the
widget.

### Food Pattern

Deferred. Timing, diversity and food-group patterns may later justify specific
widgets, but “Food Pattern” is currently too vague to be a stable widget.

### Metabolic Observations

Rejected as an umbrella name because it groups unlike measurements. Glucose,
ketones and future observations require individual consideration and may be
tailored across submodules.

### Nutrition Capture

Not selected in this metrics-first pass. Logging workflows remain necessary,
but “capture” is a workflow category rather than automatically one stable
widget.

## Nutrition pass result

Selected actual widgets:

`Calories`, `Macronutrients`, `Fiber`, `Micronutrients`, `Water Intake`,
`Recent Meals`, `Caffeine`, `Alcohol`, `Supplements`, `Fasting`.

