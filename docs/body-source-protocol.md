# Body Research Source Protocol

## Evidence levels

### Level 1 — authoritative product and platform evidence

- Official developer documentation and API schemas
- Official support documentation and metric explanations
- Official product interfaces, release notes, manuals, and regulatory filings
- Primary scientific standards, consensus statements, and peer-reviewed
  validation studies

Use Level 1 to establish availability, definitions, permissions, formulas,
units, platform behavior, and scientific claims.

### Level 2 — direct product observation

- Current app or web interface inspected directly
- Official demonstrations and complete product walkthroughs
- Device exports and sample payloads obtained through documented access

Use Level 2 to reconstruct exact visualizations, information hierarchy, states,
history behavior, and interactions. Record product version, platform, region,
subscription tier, and observation date.

### Level 3 — credible independent reconstruction

- Detailed professional reviews
- Technical teardowns
- High-quality release coverage
- Complete third-party demonstrations or transcripts
- Academic comparisons of consumer products

Use Level 3 to fill product-observation gaps and identify questions requiring
stronger confirmation.

### Level 4 — user evidence

- Support forums
- Reddit
- App-store reviews
- Community discussions
- Social posts

Use Level 4 to discover real-world edge cases, confusing behavior, regional
differences, failure modes, and undocumented user-visible changes. Never use it
alone to establish a formula, API capability, or scientific fact.

## Required evidence record

Every extracted claim stores:

- Product and feature
- Exact claim
- Source URL or captured artifact
- Publisher and evidence level
- Publication date and observation date
- App, device, API, and subscription version where known
- Region and platform where relevant
- Direct fact, vendor claim, independent finding, or inference
- Confidence
- Contradictions and unresolved questions

## Rules

- Search the official product and developer sources first, but do not stop
  there when they omit the actual interface or behavior.
- Separate what a device senses, what its platform derives, what an API exposes,
  and what a third-party app can legally and technically retrieve.
- “The app shows it” does not prove that the public API exposes it.
- “The device measures it” does not prove that the value is accurate.
- “The vendor calls it scientific” does not establish scientific validity.
- Proprietary formulas remain proprietary unless documented. Reconstruct their
  visible inputs and outputs without pretending to know hidden weights.
- Conflicting sources remain visible in the evidence record; do not silently
  choose the convenient answer.
- Missing evidence is written as unknown and becomes a follow-up task.
- Any screenshot supplied by the stakeholder is useful direct observation but
  remains tied to its visible version, platform, region, and account tier.
- Findings that affect health interpretation require primary scientific
  verification before becoming a Dojo calculation or claim.
- Research artifacts preserve citations close to every claim so later design
  and engineering decisions remain traceable.
