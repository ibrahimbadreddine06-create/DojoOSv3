# Audit of the original Body competitor deep dives

Status: first audit complete; statement-level verification remains open  
Updated: 2026-07-25

## Purpose

This audit asks whether the original research can safely feed later synthesis.
It does not judge a document by length and does not turn competitor concepts
into Body widget umbrellas.

## Corpus

| Product file | Lines | First-party links | Explicit caution markers |
|---|---:|---:|---:|
| Apple Health + Fitness | 368 | 13 | 5 |
| Google Health + Fitbit | 400 | 11 | 5 |
| Samsung Health | 153 | 5 | 4 |
| Garmin Connect | 365 | 11 | 7 |
| Oura | 261 | 10 | 6 |
| WHOOP | 287 | 8 | 7 |
| Withings | 134 | 5 | 2 |
| Polar Flow | 140 | 4 | 3 |
| Strava | 141 | 4 | 3 |

Counts are structural indicators only. More links do not imply better evidence.

## Findings

### What is usable

Every file has an evidence boundary, a reconstruction of the relevant product
surface, visual-pattern observations and named open questions. The larger
platform files separate major surfaces such as summary, sleep, training,
recovery and history. The corpus is therefore useful as an evidence index and
as a map for direct verification.

### What is not yet safe

The prose frequently groups several factual claims under one source cluster.
That makes it hard to prove which source supports which exact statement.
Public documentation also does not fully reconstruct current regional,
subscription, device and platform differences. Visual observations without a
dated capture can become stale. Proprietary score descriptions cannot be
treated as reproducible formulas.

### Risk classification

| Risk | Files most exposed | Required repair |
|---|---|---|
| Large product surface can hide regional/tier differences | Apple, Google/Fitbit, Samsung, Garmin | capability matrix by device, region and subscription |
| Composite-score semantics can be mistaken for formulas | Garmin, Oura, WHOOP, Fitbit | input/window/weight ledger; unknown where undisclosed |
| Visual grammar can become stale | all | dated direct capture or official current screenshot |
| Sparse official source set | Samsung, Withings, Polar, Strava | add first-party support/API sources before synthesis |
| Medical/performance interpretation | all | independent scientific validation after product reconstruction |

## Gate decision

The original nine are **not rejected**, but they are also **not certified as
complete**. They can support discovery and targeted follow-up. They cannot by
themselves justify a final Body umbrella, a medical interpretation or a copied
calculation.

## Required next audit artifact

For each material candidate later carried into synthesis, record:

1. the exact claim;
2. source URL and access date;
3. whether it is observed, vendor-disclosed or independently established;
4. device/platform/region/subscription dependencies;
5. calculation inputs, window, cadence and unknown weights;
6. visual capture reference;
7. Body relevance without assigning it to an umbrella prematurely.
