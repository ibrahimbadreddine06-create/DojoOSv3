# Apple Health, Fitness and Watch — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: current iOS 26/watchOS 26 product behavior, not merely HealthKit fields

## Evidence boundary

This reconstruction uses current official Apple support, user guides, newsroom
descriptions and Apple validation papers. It distinguishes:

- what Apple surfaces in Health/Fitness/Watch;
- what HealthKit technically stores;
- what Apple says a feature means;
- what remains proprietary or region/device gated.

Primary product sources:

- Health summary, categories, highlights and trends:
  https://support.apple.com/guide/iphone/view-your-data-in-health-iphe3d379c32/ios
- Health data sources and manual input:
  https://support.apple.com/guide/iphone/intro-to-health-data-iphbb8259c61/ios
- Fitness summary and card customization:
  https://support.apple.com/guide/iphone/see-your-activity-summary-iph4c34a8a95/ios
- Training load:
  https://support.apple.com/guide/watch/track-your-training-load-apde4c07a6cf/26/watchos/26
- Vitals:
  https://support.apple.com/en-ca/120142
- Sleep history:
  https://support.apple.com/guide/iphone/view-your-sleep-history-iph72b370881/ios
- Sleep Score:
  https://support.apple.com/en-ie/108906
- State of Mind:
  https://support.apple.com/en-ie/guide/iphone/iph6a6decb13/ios
- Source priority and manual records:
  https://support.apple.com/en-ie/108779
- Health privacy:
  https://www.apple.com/legal/privacy/data/en/health-app/
- watchOS 11 feature definitions:
  https://www.apple.com/newsroom/2024/09/watchos-11-is-available-today/
- watchOS 26 product changes:
  https://www.apple.com/newsroom/2025/06/watchos-26-delivers-more-personalized-ways-to-stay-active-and-connected/
- Apple health-feature validation papers:
  https://www.apple.com/healthcare/apple-watch/

The exact HealthKit identifier inventory is separately captured in
[`apple-healthkit.md`](../body-provider-inventory/apple-healthkit.md).

## Product architecture

Apple does not force all health behavior into one dashboard:

| Surface | Primary job |
|---|---|
| Health Summary | personally important health categories, highlights, trends and feature entry points |
| Health category detail | metric history, education, sources/access, raw records, unit and manual entry |
| Fitness Summary | daily activity, sessions, trends, awards and customizable fitness cards |
| Apple Watch Activity | immediate rings, training load and workout progress |
| Apple Watch Vitals | compact overnight status and deviation from personal typical ranges |
| Apple Watch Sleep | last-night sleep duration, stages and score |
| Workout | live execution, configurable views, targets, intervals and post-workout details |

This separation is a strong product decision: overview, deep history and active
execution have different information density and interaction needs.

## Health Summary

### Pinned

Users can pin, unpin and reorder categories such as medications, heart rate and
steps. The pinned list reports the current-day state of each selected category.
It is category-oriented rather than a fully free spatial canvas.

### Highlights

Highlights surface recent, contextual changes and link through their graph to
more detail. Apple does not document one universal highlight formula; Body must
not copy a nonexistent generic algorithm.

### Trends

Health detects significant changes for supported data types such as resting
heart rate, steps and sleep, displays magnitude and duration, and can notify the
user. Exact detection logic is not publicly defined and therefore remains an
Apple provider insight.

### Category detail

Depending on the type, the detail surface provides:

- weekly, monthly and yearly views;
- graph interaction and individual records;
- manual data entry;
- pinning;
- unit selection;
- data-source and access inspection;
- all-data list and deletion;
- explanatory articles and recommended compatible apps.

This is the clearest reference for Body detail pages: overview card → history →
source provenance → exact records → education/actions.

## Fitness Summary

Apple's current Fitness Summary is card-based and user-customizable. Users can:

- add a metric and swipe through available card variants;
- swap the current card variant;
- move cards by long press;
- remove cards;
- open the card for detailed history.

The default product includes Activity rings, step count, step distance, trends,
sessions and awards. Apple explicitly supports multiple visual options for a
metric, which validates Body's umbrella → variant → size model, while Body's
free grid and accent customization go further.

### Activity rings

- Move: active calories;
- Exercise: brisk-activity minutes;
- Stand: hours containing at least one minute standing/moving;
- overlapping rings show goal exceedance.

The rings are goals, progress and recognition in one visualization. Their value
comes from stable semantics, not the circular form itself.

### Fitness trends

Fitness compares the most recent 90 days with the last 365 days. It needs 180
days before showing trends. Up/down state is accompanied by coaching intended
to reverse a decline. This is a disclosed product window, unlike Health's
less-specific significant-change detection.

### Sessions and awards

Completed workouts and meditations open into details. Awards add long-term
motivation but are not health metrics and should remain a distinct product
family.

## Vitals

Vitals combines overnight:

- heart rate;
- respiratory rate;
- wrist temperature;
- blood oxygen where supported;
- sleep duration.

After seven nights, Apple establishes a personal typical range per metric.
Users see:

- the current overnight summary;
- each metric with context;
- a seven-day watch view;
- on iPhone/iPad, daily, weekly, monthly and six-month history;
- counts of High, Typical and Low states;
- a notification when at least two overnight metrics are outside their typical
  ranges.

Apple also presents possible contextual factors such as medication, elevation
change or illness without claiming that the watch diagnosed the cause.

Product lesson: a multi-metric status is useful when every component remains
inspectable and the UI distinguishes observation from explanation.

## Training load

Apple compares the latest 7-day training load with a 28-day training load and
classifies it:

- well below;
- below;
- steady;
- above;
- well above.

The 28-day load is a weighted average of workout duration and effort. Effort is
1–10. Popular cardio workouts can receive an automatic estimate based on a
proprietary algorithm using profile and workout inputs including age, height,
weight, GPS, heart rate and elevation; the user can adjust it. Workouts such as
strength training can receive manual effort.

The UI supports:

- seven-day graph;
- current classification;
- drill-down to contributing workouts;
- workout-type filtering;
- adjacency with Vitals for training-context interpretation.

Body may reproduce the disclosed product pattern, but not claim Apple's hidden
effort model. A Body training-load calculation needs its own scientific
specification, version and validation.

## Sleep

### History visualization

Health shows Awake, REM, Core and Deep across a time band. Users can:

- switch week/month views;
- pan the graph;
- select a day's column;
- show more cumulative sleep data;
- manually add sleep.

### Sleep Score

Current watchOS 26 Sleep Score is 0–100:

- sleep duration: 50 points;
- bedtime consistency: 30 points;
- interruptions: 20 points.

Bedtime consistency considers sleep onset across the previous 13 nights.
Interruptions consider both wake frequency and awake duration. Apple classifies
the total:

- 0–40 very low;
- 41–60 low;
- 61–80 OK/fair depending on locale;
- 81–95 high;
- 96+ very high.

Unlike many proprietary scores, the top-level weighting and classification are
public. The exact subcomponent functions remain undocumented, so only the
disclosed parts are reproducible.

## State of Mind

Apple separates momentary emotion from overall daily mood. Logging includes:

- a pleasantness slider;
- optional descriptive words;
- optional impact factors;
- additional free context.

History offers:

- ranges over time;
- daily mood versus momentary emotion;
- user-entered associations;
- lifestyle factors such as exercise, sleep, daylight and mindful minutes
  alongside mood.

Apple calls these associations, not causal explanations. Body should preserve
that restraint.

## Manual and active workflows

Apple permits manual input for many categories and explicit workflows for:

- past workouts, including duration, time, calories and effort;
- body measurements and general Health categories;
- menstrual-cycle events and symptoms;
- medications, vitamins and supplements;
- state of mind;
- sleep;
- Medical ID and supported health records.

Manual and sensed data share history but retain source identity. Deleting a
workout can separately delete only the workout or workout plus associated
Health data, demonstrating careful ownership semantics.

## Source priority and privacy

For overlapping types, Health's documented default priority is:

1. manually entered Health data;
2. iPhone, iPad and Apple Watch;
3. apps and Bluetooth devices.

A newly added source appears above other contributing apps/devices and the user
can reorder or disable sources per data type. The source at the top takes
priority.

This is understandable and user-controllable, but too coarse for Body as a
complete deduplication strategy: a global source order cannot account for one
device having better heart rate while another owns the workout session. Body
should keep per-type and per-record-shape resolution with an inspectable source
graph.

Apple states that Health data is protected by the device passcode when locked,
can be encrypted in transit and at rest through iCloud, can be exported, and
that users control app permissions and retention. Some data types are not
available to third-party apps. This reinforces that visible Apple features and
HealthKit-accessible fields must remain separate inventories.

## Visualization grammar

Observed patterns:

- rings for bounded goal progress;
- compact cards for summary metrics;
- line/bar histories with range tabs;
- horizontal sleep-stage bands;
- personal-range bands and High/Typical/Low states;
- classification scales for training load and sleep score;
- calendars for day selection;
- detail lists for exact records and sources.

Apple uses a visualization because it matches the record shape. It does not
force every metric into the same ring or sparkline.

## Strengths

- Strong provenance and user control through Data Sources & Access.
- Clear separation between summary, category history and raw records.
- Good personalization without requiring a blank-canvas dashboard.
- Manual fallback is first-class.
- Useful longitudinal windows and disclosed prerequisites.
- Medical/wellness features retain explicit device and regional limits.
- Multi-metric Vitals stays interpretable through component drill-down.

## Weaknesses and opportunities for Body

- Health and Fitness are split; users must learn where a concept lives.
- Pinned Health categories offer ordering but limited visual/size choice.
- Highlights and many trends are algorithmically opaque.
- Cross-domain relationships are mostly contextual, not a unified life-OS
  model.
- Provider cards are not a full umbrella/variant/size system.
- Source conflicts are visible but not always explained at summary level.
- Default source ordering is simple and editable but does not express
  field-level fusion or match confidence.

## Body product implications

Adopt:

- overview → detail → exact records → sources/access;
- personal baseline states with explicit component inspection;
- disclosed data windows and readiness requirements;
- separate manual, sensed and provider-derived provenance;
- card variants chosen for record shape;
- reversible deletion and source-aware history.

Improve:

- one coherent Body navigation model across activity, intake, rest/recovery and
  hygiene/looks;
- stronger source-resolution explanations;
- richer widget umbrellas, variants and supported sizes;
- user-selected accent and spatial customization;
- wearable-first ingestion with credible manual fallback;
- exact missing-data states rather than a blank chart.

Do not copy:

- Apple's undisclosed trend, effort or medical algorithms;
- Activity rings as a universal visual language;
- a feature merely because Apple exposes it;
- medical classifications without exact eligibility, provenance and legal
  review.

## Open evidence tasks

- Directly capture current iPhone/iPad/watch screenshots for exact spacing,
  card variants and empty/error states.
- Verify every Fitness Summary card currently available by region/device.
- Extract current Health trend eligibility per data type.
- Record exact workout detail fields and visualization differences by sport.
- Scientific validation of Sleep Score components, training-load windows,
  personal ranges and notification thresholds occurs in the later science
  phase.
