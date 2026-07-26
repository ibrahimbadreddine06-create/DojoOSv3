# Body Research Charter

## Product standard

Body is being designed as a paid, production-grade product. Research, calculations, integrations, and widgets must be credible enough to ship. A convincing interface is not evidence that a metric is valid.

## Non-negotiable research mandate

- Research the complete relevant market across every Body domain; the first competitor pool is a starting map, never a boundary.
- Establish which wearable ecosystems and connection paths Body should support.
- For every selected connection, inventory **all available and relevant data outputs** that can actually be accessed by Body. Record provenance, units, sampling behavior, permissions, platform limitations, and uncertainty.
- Never infer undocumented device outputs, API access, formulas, or product behavior. Mark unavailable or unverifiable information explicitly as unknown.
- For every competitor studied, investigate what it shows, what inputs it uses, how it calculates or interprets the result, and exactly how it visualizes and explains it.
- Use primary sources for technical and scientific claims wherever possible. Supplement gaps with credible product documentation, independent analysis, release coverage, demonstrations, transcripts, and real-user discussions while preserving source quality labels.
- Distinguish a device's native metric, a platform-normalized value, an industry-standard calculation, and a proprietary derived metric.
- Preserve accepted scientific or industry-standard formulas when reinvention would reduce validity. Where the market contains competing approaches, compare them and develop a defensible Dojo approach instead of copying one product by default.
- Every derived metric requires a traceable specification: purpose, inputs, formula or model, assumptions, missing-data behavior, confidence, interpretation, limitations, and validation plan.
- A wearable-first experience is the primary product. Manual use is an intentional alternative, not evidence that unavailable sensor data may be fabricated or estimated without justification.
- Design follows verified product meaning. Each widget umbrella, variant, size, visualization, interaction, and detail view must be rooted in a real user need and real data behavior.
- **ALLES KAN** creatively, but nothing may pretend to measure, calculate, or conclude something that the evidence cannot support.

## Decision discipline

Product decisions that can be resolved through research are the responsibility of the research and product process, not questions pushed back to the stakeholder. Stakeholder questions are reserved for genuine product intent, values, risk tolerance, and scope boundaries that evidence alone cannot decide.

## Delivery gate

A Body metric is not delivery-ready until its data path, calculation, limitations, states, visualization, interaction behavior, supported sizes, history behavior, and no-data/manual fallback are all specified and testable.

A Body functional widget is not delivery-ready until its subject, commitment,
execution, observation, Planner reconciliation, optional Goal relationship,
conflict behavior, detail/history destination and empty/offline states are all
specified and testable.

Research may establish what competitors expose, but Body's operational
workflows remain a product-design responsibility. They must fit the shared
DojoOS Planner/Goals architecture rather than copying a competitor flow or
inventing a disconnected logger.
