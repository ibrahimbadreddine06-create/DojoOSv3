# Body E design production contract

Status: locked baseline for production widget work  
Source of truth in implementation:
`client/src/components/body/body-widget-design-registry.ts`

This document translates the approved E language into a reviewable production
contract. It does not reduce creative freedom: **ALLES KAN**. No enumeration of
content or visualization types defines what is allowed.

## Card baseline

- Light neutral card surface, never an accent-colored card.
- Foreground `#18202A`; secondary neutral `#747D89`.
- Border `#E4E7EB`.
- Base corner radius `22px`.
- Subtle shadow only.
- Inter typography baseline.
- One user-selectable accent hue per widget; shades of that hue may create
  hierarchy.
- Additional semantic colors appear only when their meaning requires them.
- Tabler is the baseline icon language.

## Base `1×1` geometry

At the `288×288` design reference:

`20 / 33 / 15 / 152 / 15 / 33 / 20`

This means:

- 20 outer top inset
- 33 top zone
- 15 intentional gap
- 152 center zone
- 15 intentional gap
- 33 bottom zone
- 20 outer bottom inset

The sequence is a proportional design reference for the baseline composition,
not permission to freeze content while the card expands. On resize, geometry
and content use the full supported footprint.

Zones and subzones:

- do not introduce automatic internal padding;
- do not clip glyphs or visual details;
- contain their layout geometry;
- may include deliberate whitespace chosen by the composition;
- scale coherently with the card when the physical grid cell scales.

## Top zone under placement E

The top is structural, not an element slot.

- Title and short metadata anchor at the upper left and build downward.
- The fixed umbrella icon anchors at the upper right.
- The top does not accept an extra free element slot while E is selected.

This rule belongs to placement E. A future placement language may make a
different structural decision.

## Center zone

The center exists to form the primary visualization or primary visual
composition.

It consists of freely composed element slots, and anything may exist in them.
Their collective result must answer the widget's main question rather than
becoming storage for leftover supporting information.

Production checks:

1. Every visual mark maps to real data or a real state.
2. The center uses the available space intentionally.
3. Supporting information is not moved into the center while useful bottom
   capacity is left empty without a deliberate compositional reason.
4. Center and bottom may collaborate in any layout when their alignments and
   relationship are intentional.
5. Labels and values begin at a readable base size and remain coherent through
   scaling.
6. Repeated semantic roles are harmonized unless a deliberate difference
   communicates meaning.

## Bottom zone

The bottom is a free composition zone, never a generic footer.

Anything can be placed there. It can be dominant, subtle, empty or broken into
any purposeful composition. Position does not determine importance.

Under E, bottom content normally anchors to the lower edge and builds upward,
mirroring the top's upper anchoring. Horizontal alignment and deliberate
exceptions are decided case by case.

There is:

- no default column count;
- no permanent left/right slot;
- no automatic gray treatment;
- no automatic small typography;
- no mandatory internal margin;
- no fixed semantic role.

Each bottom is reviewed together with that exact widget's center and top.

## Visualization behavior

The center visual is the main idea, not decoration around a number. Familiar
and bespoke forms have equal standing.

- Data logic is functional and responsive; screenshot-like mock visuals do not
  ship.
- Fictitious data is acceptable only in an explicitly marked prototype.
- Related geometry, stroke, typography and internal spacing scale as one
  object.
- If proportional scaling becomes unusable, the component switches to an
  intentionally designed composition.
- Rounded visual geometry is the default character. Sharp geometry is a
  deliberate structural choice, not an accident.

### Line-chart baseline

- Functional chart engine and shared dataset for line, scale and grid.
- Smooth monotone data line without permanent point markers.
- Main stroke `3px`; small multiple `2px`; round caps and joins.
- Grid `0.8px`, `#D9DEE5`, square/butt caps, no vertical grid by default.
- Plot touches its scale rail; no unexplained gap.
- Scale labels align exactly with their generated ticks.
- Text and chart occupy separate layout containers.
- Interactive detail uses real nearest points, keyboard focus and a mobile
  equivalent.

This baseline may change when the metric requires a different semantic axis or
visual treatment; the reason is documented per variant.

### Rings and filled measures

Rings, bars, reservoirs and other fills preserve a coherent relationship
between geometry, stroke/fill and internal typography. Labels and values inside
a visual are aligned within that visual rather than inheriting an unrelated
zone anchor.

## Interaction language

- Card hover is subtle border/shadow feedback; the widget does not jump, scale
  or rearrange.
- Every element is audited individually at every supported size.
- Ambiguous standalone values/states may receive a very short local hint.
- Clear labeled content receives no redundant tooltip.
- Data visuals can reveal exact real values through local interaction.
- Tooltip/hint placement stays beside the trigger.
- Motion baseline is 150ms ease-out-quart and respects reduced motion.
- Hover-only meaning is forbidden; keyboard and touch receive an equivalent.

## Accent customization

Changing an accent updates the production component, not a preview copy.

- The accent hue applies only to meaningful emphasis/encoding.
- Readable foreground contrast is computed for any user-selected hue.
- Soft/dark variants derive from the selected hue.
- Warning, danger, success and other necessary semantics remain distinct.
- Persisted accent belongs to the installed widget instance.

## Drawer and resize behavior

- Drawer preview is the actual `1×1` renderer.
- Every production umbrella has at least two genuinely distinct variants.
- The first/default drawer variant is visual-first; a metric-led alternative
  may coexist without replacing the required primary visualization.
- Umbrella icon and placed-widget icon match.
- Supported sizes come from one variant manifest.
- Every target including the current size is visible during resize.
- Resizing is animated and snaps only to supported targets.
- A footprint uses the dimension it gains.
- Grid placement preserves intentional empty cells; unrelated widgets move only
  for a real collision.

## Completion audit

A production variant is not complete until it passes:

- semantic visualization audit;
- element-slot and zone-purpose audit;
- case-by-case hierarchy/alignment audit;
- full-size and mobile scaling audit;
- clipping/overflow audit;
- accent/contrast audit;
- hover/focus/tap audit;
- every supported footprint;
- all data-state envelope states;
- actual drawer-preview equivalence;
- detail/history route;
- reduced-motion and keyboard review.
