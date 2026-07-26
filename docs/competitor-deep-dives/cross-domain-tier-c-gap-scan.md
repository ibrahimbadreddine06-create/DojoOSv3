# Cross-domain Tier C gap scan

Status: first official-source gap scan  
Updated: 2026-07-25

## Boundary

This pass identifies distinctive product patterns that could matter later. It
does **not** define Body widget umbrellas, approve calculations, prove API
availability, or replace direct product capture and scientific validation.

## COROS

Distinctive pattern:

- EvoLab connects session load, seven-day load, a recommended load band,
  six-week base fitness, short-term load impact, intensity trend and recovery.
- It distinguishes the raw/current training signal from the longer-term model
  and from the recommendation generated from both.
- Progress views use a current value against a personalized band, rather than a
  score without context.

Body research value:

- Strong reference for exposing input, time window, baseline and actionable
  interpretation as separate visible layers.
- Useful evidence for activity and recovery, but not permission to reproduce
  proprietary thresholds or labels.

Evidence:

- [EvoLab help](https://support.coros.com/hc/en-us/articles/26485283220884-EvoLab)
- [Recovery metrics](https://us.coros.com/stories/coros-metrics/c/your-coros-recovery-metrics-explained)

Confidence: high for visible concepts and disclosed windows; direct captures,
algorithm-version history and independent validation remain.

## Suunto

Distinctive pattern:

- Suunto presents training load, longer-term fitness/load context, HRV recovery
  and the relationship between recovery and current training load.
- Device manuals expose concepts such as Training Stress Score and Chronic
  Training Load while the app/device split varies by model.

Body research value:

- Confirms that load, fitness and recovery need source/device context and
  should not be collapsed into one unexplained score.

Evidence:

- [Suunto Vertical recovery and training](https://www.suunto.com/en-ca/Support/Product-support/suunto_vertical/suunto_vertical/widgets/recovery-training/)
- [Suunto Race user guide](https://ns.suunto.com/Manuals/Suunto_Race/Userguides//Suunto_Race_UserGuide_EN.pdf)

Confidence: medium. A model-by-model capability matrix, current app capture and
formula provenance are still required.

## Welltory

Distinctive pattern:

- Welltory derives stress and energy interpretations from HRV and explains the
  measurement through both conventional metrics and a branded “liquid”
  visualization.
- The liquid encodes the combined state rather than acting as decoration.

Body research value:

- Evidence that a unique visualization can remain functional when its mapping
  is explicit.
- Also a warning: wellness interpretations must expose measurement quality,
  baseline, timing and limitations instead of presenting physiology as
  certainty.

Evidence:

- [HRV analysis](https://help.welltory.com/en/articles/3357751-how-is-heart-rate-variability-analyzed-in-welltory)
- [Liquid visualization](https://help.welltory.com/en/articles/3878881-what-the-liquid-means-and-how-it-reflects-your-body-s-current-state)

Confidence: medium-high for product behavior; scientific and claims review
remains mandatory.

## Bearable

Distinctive pattern:

- User-defined symptoms, factors, mood, pain and medication are combined in one
  diary and explored through personal correlations.
- Its value is not one universal score, but flexible personal tracking and
  pattern discovery.

Body research value:

- Important evidence for manual-input fallback and user-defined tracking.
- Correlations must be framed as associations, with sample size, timing and
  confounding limitations visible.

Evidence:

- [Bearable health tracker](https://bearable.app/health-tracker/)

Confidence: high for product proposition; exact correlation method, lag model,
minimum sample rules and current visualization need deeper validation.

## Exist

Distinctive pattern:

- Exist aggregates heterogeneous attributes from connected services and manual
  tags, then surfaces personal correlations after enough history exists.
- It explicitly separates collection/integrations from the later statistical
  relationship layer.

Body research value:

- Strong reference for cross-domain discovery without inventing a new umbrella
  above the actual widgets.
- Supports an evidence model where every insight retains the contributing
  attributes, time window and data sufficiency.

Evidence:

- [Exist product](https://exist.io/)
- [Exist FAQ](https://exist.io/page/faqs/)
- [Correlation API](https://developer.exist.io/reference/correlations/)

Confidence: high for architecture; statistical details and current UI capture
remain.

## Heads Up Health

Distinctive pattern:

- Centralizes labs, biomarkers, CGM, wearable and manually entered data in a
  configurable dashboard.
- Recent product documentation highlights source prioritization, duplicate
  handling, persistent widget configuration and broad marker libraries.

Body research value:

- Strong evidence for provenance, duplicate resolution and source priority as
  first-class platform requirements.
- Its clinician-oriented monitoring model is useful evidence, but Body remains
  a personal product and cannot inherit clinical claims or workflows by
  default.

Evidence:

- [Product overview](https://headsuphealth.com/product)
- [Integrations](https://headsuphealth.com/integrations/)
- [Product release notes](https://explore.headsup.health/docs/release-notes/release-notes)

Confidence: high for platform architecture; consumer relevance, regional
availability and individual connector permissions remain.

## Cross-domain deductions (not umbrellas)

1. A displayed value needs provenance: source, time, freshness and confidence.
2. A derived interpretation needs its inputs, comparison baseline and window.
3. Manual and wearable data can coexist, but must never be visually
   indistinguishable when their quality differs.
4. Personalized bands and correlations require sufficient-history states.
5. Duplicate resolution and source priority belong below the widget layer.
6. Unique visuals are valid only when they communicate real state.
7. These are evidence dimensions. **They are not widget umbrellas.**

