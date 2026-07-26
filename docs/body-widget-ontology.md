# Body widget ontology

Status: locked vocabulary  
Updated: 2026-07-25

## The hierarchy

`Body submodule → widget umbrella → widget variant → supported size`

There is no product grouping layer between submodule and umbrella.

## Widget umbrella

A widget umbrella **is the widget** as a stable product identity.

Examples of the naming logic:

- `Steps`
- `Training Load`
- `Last Sleep`
- `Water Intake`

Those examples illustrate the grammar only; they do not by themselves approve
the final catalogue.

An umbrella owns:

- its stable name and icon;
- the information/topic it represents;
- the data and calculation contract it may use;
- its detail/history destination;
- eligibility and empty-state behavior;
- all variants belonging to that same widget.

The drawer lists umbrellas. Removing the installed widget returns that
umbrella to the available-widget system.

An umbrella may be informational, functional, or deliberately combine both.
“Widget” never means “metric card” by default.

## Functional widget

A functional widget is still an ordinary widget umbrella. It is not a separate
hierarchy level and not a generic container for other umbrellas.

Its primary answer is an operation the user can perform: plan, choose, start,
continue, complete, change, record or inspect something. It may also show
information when that information makes the operation understandable.

Functional widgets use the same canonical records as the Daily Planner, Goals,
detail/history pages and sensor/manual data flows. They do not maintain a
private duplicate schedule or a second version of an execution.

The presence of an action does not automatically create another umbrella. An
action belongs inside an existing umbrella when it serves that widget's stable
identity. A separate functional umbrella is justified only when the operation
itself is a durable product concept that a user may independently add, remove,
resize and revisit.

## Product records are not widgets

Activities, workouts, exercises, muscles, meals, routines, planner blocks,
goals, observations and execution sessions are product entities. They can be
shown or operated on by widgets, but they do not automatically become widget
umbrellas. Conversely, a functional widget can operate on many records without
becoming a grouping layer.

## Widget variant

A variant is a different production visualization/composition of the **same
widget**. It does not change what umbrella the widget belongs to.

Variants may differ in:

- visualization;
- placement and composition;
- which supporting information is emphasized;
- interaction;
- purposeful secondary information.

Everything can change when it remains the same widget identity. A visualization
type is not an extra hierarchy level.

## Supported size

A supported size is an intentional layout of one variant at a declared grid
footprint. It may reorganize or add supporting context, but it remains the same
variant and umbrella.

## What is not an umbrella

The following never becomes an umbrella merely because it exists:

- a research category;
- a provider;
- a raw API field;
- a database table;
- a calculation shared by widgets;
- a visualization type;
- a drawer section;
- a broad grouping invented to contain other widgets.

Any of those can contribute to a widget. None may create the rejected
“group of umbrellas” layer.

## Backend/calculation rule

When widgets need the same meaning, they reuse one canonical record or
versioned calculation. Homogeneity is preferred when it is truthful.

This is not absolute forced sameness. A similar but genuinely different metric
may use a separate calculation when its purpose, inputs or interpretation
justify that difference. The divergence is explicit rather than accidental.

## Freedom rule

**ALLES KAN.**

This ontology constrains only identity and hierarchy. It does not constrain
what can exist in an element slot, what a widget may visualize, or how daring a
variant may be.
