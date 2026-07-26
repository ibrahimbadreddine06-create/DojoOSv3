# Activity widget umbrellas — research selection

Status: research-selected, awaiting stakeholder review  
Updated: 2026-07-25  
Ontology: `body-widget-ontology.md`

> Historical research selection. The later functional gate evolved `Next
> Workout` into `Workout` and added `Activities`. Use
> `body-widget-catalogue-v2.md` for the current catalogue.

## Selection method

Every entry below was evaluated separately as an actual widget. The file does
not introduce categories above them. A rejected/merged candidate is recorded
so it cannot silently return as a false hierarchy layer.

## 1. Steps

**Decision:** select.

**Widget identity:** recorded ambulatory step count over a chosen period.

**Why it deserves its own umbrella:** it is independently understood, widely
available, glanceable at `1×1`, historically useful and valuable without any
other movement metric.

**Data:** canonical non-overlapping step totals with source, device, coverage
and timezone.

**Calculation:** reuse `activity.steps`; never sum overlapping providers.

**Truth boundary:** “recorded steps”, not true movement and not a universal
10,000-step health prescription.

**Manual path:** optional manual correction/import only; no fabricated
continuous steps.

## 2. Active Minutes

**Decision:** select.

**Widget identity:** duration classified as activity at a declared intensity
or under a declared provider method.

**Why separate from Steps:** time at intensity answers a different question
than ambulatory count. Wheelchair, cycling, swimming and strength activity can
matter without steps.

**Data:** non-overlapping classified intervals, method and valid-wear
coverage.

**Calculation:** one shared method when semantics match; provider-specific
classifications stay namespaced when they do not.

**Truth boundary:** never silently claim that every provider's “active minute”
meets the same guideline definition.

## 3. Sedentary Time

**Decision:** select as conditional.

**Widget identity:** covered waking time classified as sedentary.

**Why separate:** it answers an absence/distribution question that cannot be
derived honestly from low steps alone.

**Data:** classified sedentary intervals, awake window and non-wear.

**Truth boundary:** non-wear is not sedentary time; device classification and
coverage remain visible.

## 4. Distance

**Decision:** select.

**Widget identity:** source-resolved travelled distance for the chosen period.

**Why separate from Steps:** distance matters independently for running,
walking, wheelchair use, cycling, swimming and other activities; converting
steps into one universal distance would lose modality and source meaning.

**Data:** canonical distance records and session distance, deduplicated by
source/session.

**Calculation:** aggregation may be shared across variants, while
modality-specific distance remains distinguishable.

## 5. Active Energy

**Decision:** select as provider-observation widget.

**Widget identity:** active energy estimated by the selected provider.

**Why it deserves a widget:** it is broadly available and users explicitly
seek it, but its uncertainty requires a dedicated contract rather than being a
decorative number inside another widget.

**Data:** active energy only, separated from basal and total energy.

**Truth boundary:** always “estimated”; no exact calorie-balance claim and no
cross-provider comparability without a source break.

## 6. Floors Climbed

**Decision:** select as conditional.

**Widget identity:** recorded flights/floors climbed over time.

**Why separate from generic elevation:** floors is a common daily-life record
with a discrete user meaning, while route elevation gain is a session/sport
measurement. They may share low-level normalization but are not silently
merged.

**Data:** provider floor/flight records with source semantics.

## 7. Recent Activities

**Decision:** select.

**Widget identity:** the person's latest resolved activity sessions.

**Why it is an umbrella:** this is an actual list/timeline widget with a stable
job—recall and reopen completed sessions—not a grouping of sport widgets.

**Data:** deduplicated activity sessions with type, timing, duration, source
and the smallest useful summary.

**Interaction:** opens the authoritative activity detail; supports correction
when an imported/manual classification is wrong.

## 8. Training Load

**Decision:** select as conditional/advanced.

**Widget identity:** development of one internally consistent training-load
series against relevant recent history.

**Why separate:** it answers whether accumulated training demand is changing,
not what happened in one session.

**Data/calculation:** provider load remains provider-owned. Body may use a
separately versioned, evidence-approved method such as sRPE where appropriate.
Unlike load methods are never merged into one scale.

**Truth boundary:** descriptive context, not injury probability, overtraining
diagnosis or a universal ACWR safe zone.

## 9. Heart Rate Zones

**Decision:** select as conditional.

**Widget identity:** time distribution under one explicit heart-rate zone
model.

**Why separate from Heart Rate:** the result is a modelled distribution with
thresholds, while a heart-rate widget is an observed physiological series.

**Data:** HR samples, coverage, chosen model and versioned thresholds.

**Truth boundary:** no universal five-zone truth; predicted and measured
profile inputs remain distinguishable.

## 10. Cardio Fitness

**Decision:** select as conditional.

**Widget identity:** measured or provider-estimated aerobic-capacity value and
same-source trend.

**Why separate:** it is a longer-term capacity estimate rather than a workout
result or generic training-load summary.

**Data:** laboratory observation or provider-owned VO₂ max/cardio-fitness
estimate with modality and source.

**Truth boundary:** “estimated” never disappears; Body does not synthesize its
own VO₂ max in the initial phase.

## 11. Strength Progress

**Decision:** select.

**Widget identity:** exercise-specific progression in performed strength work.

**Why separate:** sets, repetitions, load, RIR/RPE and exercise history have a
different model and meaning from cardiovascular activity.

**Data:** resolved exercise identity, sets, reps, external load, completion,
RIR/RPE and personal-best events when valid.

**Calculation:** exercise-specific volume/e1RM/progression methods may coexist
when named and justified. No fake universal muscular-load score.

**Manual path:** first-class, because strength execution is often manually
logged even for wearable users.

## 12. Next Workout

**Decision:** select as action widget.

**Widget identity:** the next eligible planned workout and its start/continue
action.

**Why it is not a data-entry category:** it is one actual widget whose stable
content is the next session. It links Body with the planner without becoming a
grouping layer or duplicating the full planner.

**Data:** linked scheduled workout/program session, current completion state
and relevant execution entry point.

## Candidates deliberately not selected in this pass

### Daily Movement

Rejected as an umbrella. It is a grouping label that would contain Steps,
Active Minutes, Distance and other real widgets. It recreates the exact invalid
extra hierarchy layer.

### Session Performance

Rejected as one umbrella name. It is too broad: route, pace, power, splits,
heart rate and sport-specific outputs do not automatically become one stable
widget identity. These belong in activity detail and may later justify
specific widgets independently.

### Performance Specialist

Rejected. “Specialist” is a drawer/research grouping, not a widget.

### Movement Pattern

Deferred rather than selected. The evidence supports time-of-day movement and
inactivity views, but the exact stable widget identity must be defined without
using a vague category name.

## Activity pass result

Selected actual widgets:

`Steps`, `Active Minutes`, `Sedentary Time`, `Distance`, `Active Energy`,
`Floors Climbed`, `Recent Activities`, `Training Load`, `Heart Rate Zones`,
`Cardio Fitness`, `Strength Progress`, `Next Workout`.

This is a reviewable selection, not permission to implement every widget before
its variants, sizes, states and detail contract are designed.
