# Big Four + Planner harmonization

## Product boundary

The Big Four module homes (Second Brain, Languages, Studies, Disciplines) use
the same placement and resizing engine as Body in **managed collection mode**.
The grid is the shell, not the domain model. Every persisted entity remains a
real navigational widget with module-specific meaning.

Managed collection mode deliberately has no Available Widgets catalogue:

- every live entity is visible automatically;
- newly created entities are appended without resetting the layout;
- an entity cannot be hidden or removed independently from its domain record;
- filtering only changes current visibility and does not create another layout;
- drag, resize, accent and on-widget variant selection remain available.

Learning environments keep their existing shared backbone:

- dual-sidebar chapter navigation;
- `ChapterContentArea`;
- domain-specific overview calculations;
- a scoped planner bridge.

They are visually harmonized, not converted into arbitrary dashboards.

## Planner truth

There is one planner truth and two render modes:

1. the full Daily Planner timeline for dense scheduling and ordering;
2. a compact `PlannerBridge` scoped to module, item, or sub-item.

Both consume the same tree builder, ordering, weighted completion and mutation
invalidation. Compact views may disclose less detail at smaller sizes, but may
not calculate a different result.

`PlannerScope` is:

```ts
{ date, module?, itemId?, subItemId? }
```

Module identifiers are normalized before querying or comparing.

## Presets

Day presets remain the canonical schedule template. A compact bridge shows only
presets containing blocks relevant to its scope. Applying one from a scoped
bridge creates only that scoped branch while preserving its planner links and
nested children. It does not create a second module-specific preset format.

## Grid composition

Each module home contains:

- one widget for each real theme, language, course, or discipline;
- a module-level planner bridge;
- a dominant, multi-column module progress-history widget.

Entity widgets support multiple purposeful E-style variants and sizes. Studies
keeps semester/archive controls at page level because they filter the product
set rather than describe one course.

## Current hierarchy constraint

The persisted API currently enforces two block levels (`block -> sub-block`) and
stores tasks as a flat ordered array on either level. Shared client selectors
are recursive so the UI architecture does not need another rewrite later, but
the product must not imply unlimited persisted nesting until schema, API,
ordering, cascade deletion and transactional preset application are migrated
together.
