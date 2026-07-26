# Body page tailoring and overlap policy

Status: production product policy  
Updated: 2026-07-25  
Inputs: [`body-information-universe.md`](body-information-universe.md) and
[`body-source-resolution-policy.md`](body-source-resolution-policy.md)

## Core distinction

Source resolution answers: **which record represents the observation?**

Page tailoring answers: **which user question does this presentation answer?**

One resolved record may legitimately appear in more than one page context.
That does not authorize copying the same widget everywhere.

## Ownership model

Each information concept has:

- a canonical data owner: the neutral record family;
- a primary page: deepest product context and full umbrella;
- optional secondary pages: tailored summary or contributor;
- hub eligibility: whether it can become a cross-domain priority;
- detail route: one authoritative history/explanation destination.

The detail route may preserve the originating page context without duplicating
the underlying history.

## Page-role matrix

| Concept | Primary page | Secondary use | Hub use |
|---|---|---|---|
| daily movement | Activity | Rest contributor when recovery model explicitly uses it | concise current progress/attention |
| exercise session | Activity | Nutrition timing; Rest load context | only current/recent priority |
| training load | Activity | Rest recovery context | tension/attention, not full chart |
| VO2 max | Activity | Hub long-term highlight | material trend only |
| sleep session | Rest & Recovery | Activity readiness context | last-sleep summary |
| sleep regularity | Rest & Recovery | Hygiene routine context if user links bedtime routine | repeated issue/highlight |
| HRV/RHR/RR/temp | Rest & Recovery | Activity session/recovery explanation | only significant qualified change |
| provider readiness | Rest & Recovery | Activity decision context | current provider result |
| food/nutrients | Nutrition | Activity fueling context; Rest caffeine/alcohol context | coverage/attention only |
| hydration intake | Nutrition | Activity session fluid context; Rest overnight context | current logging/goal only |
| glucose/ketones | Nutrition | Activity response context; clinical context | exceptional user-selected priority |
| weight/composition | Nutrition by default | Activity physique/performance context; Hygiene/Looks user goal | material trend only |
| perceived stress/mood | Rest & Recovery | Hygiene routine context | current check-in/qualified pattern |
| menstrual/cycle data | Hygiene & Looks by default | Activity and Rest physiological context; Nutrition symptom/intake context | time-sensitive opt-in summary |
| self-care routine | Hygiene & Looks | Rest bedtime routine; Nutrition intake routine | due/overdue priority |
| clinical record | no generic dashboard owner | contextual only where relevant | explicit alert/reminder only |

“Primary” is a product default, not a prohibition. Users can add any eligible
umbrella to another page where customization supports it.

## Same data, different question

### Sleep

- Hub: “What was last night’s outcome, and does it need attention?”
- Rest: “What happened, why might the provider score look this way, and how has
  the pattern evolved?”
- Activity: “What recovery context should accompany today's training choice?”
- Hygiene: “Was the bedtime routine completed, and how does it align with
  sleep timing?” No causal promise.

### Activity load

- Hub: “Is recent output unusually high/low enough to matter now?”
- Activity: “Which sessions and modalities created the load?”
- Rest: “What load context belongs beside current recovery signals?”

### Nutrition

- Hub: “Is today's logged intake sufficiently complete, or is one chosen
  concern worth surfacing?”
- Nutrition: “What entered the body, from where, and against which applicable
  references?”
- Activity: “What intake was around the session?” not general diet judgement.
- Rest: “Was caffeine/alcohol/meal timing logged near sleep?” as context, not
  proven cause.

### Weight and body composition

- Nutrition: intake/body trend context;
- Activity: performance or training-goal trend;
- Hygiene & Looks: private appearance/body-care goal;
- Hub: only a user-selected or materially qualified trend.

The underlying observation and authoritative detail remain one.

## Cross-page duplication rules

1. A secondary-page widget must change the question, information hierarchy or
   action; a title change alone is not tailoring.
2. The same umbrella may have page-specific variants.
3. A provider score is never renamed into a Body score on another page.
4. A detail/history experience has one canonical metric identity.
5. User customization may place eligible content elsewhere, but provenance and
   interpretation do not change.
6. A secondary use cannot introduce a stronger claim than the primary one.
7. Contextual contributors remain subordinate; e.g. caffeine near sleep does
   not become “caffeine caused poor sleep.”
8. Hub cards are lossy summaries by design and always drill into the
   authoritative detail.
9. Sensitive cycle, clinical, mental-health and photo data require separate
   display consent before hub surfacing.
10. An item may be absent everywhere by default yet remain available in the
    widget drawer.

## Source precedence in cross-page use

The resolved canonical observation is shared across pages. Pages may not choose
different “best” providers for the same canonical query merely to produce a
preferred visual.

Exceptions require a different semantic query, for example:

- Activity may use high-frequency workout HR from a chest strap;
- Rest may use the wearable provider's nightly RHR algorithm;
- both are heart-rate related but are not the same canonical observation.

Provider scores coexist without precedence because they are different
constructs. If users have Oura Readiness and WHOOP Recovery, Body may show both
only as separately named provider results; it may ask for a preferred dashboard
source without deleting either.

## Hub admission gate

An item can enter the hub default set only when it:

- answers a cross-domain current-state question;
- is understandable without specialist chart literacy;
- has sufficient fresh/valid data;
- has a meaningful drill-down;
- does not duplicate a more important hub item;
- has safe uncertainty and claim language;
- is not merely available because a provider exposes it.

User-added hub content may be broader, but still follows safety and provenance.

## Detail-route rule

Every umbrella declares:

- primary detail page;
- alternate entry contexts;
- default time range;
- raw/source data access;
- calculation/explanation;
- contributor records;
- history;
- annotations and edits;
- missing/coverage view.

Opening a sleep summary from Hub and from Rest may use different initial
scroll/focus, but not different facts.

## Conflict examples

### Two step totals

Apply source resolution once. Every page uses the same resolved daily total and
can reveal alternatives in detail.

### Two readiness scores

Do not resolve as duplicates. Show the selected preferred provider on Hub;
retain both in Rest/provider comparison if the user asks.

### Food logged in two apps

Resolve meals/foods through identity and timestamps where reliable. Never sum
two daily nutrient totals. Mark conflict when entry-level reconciliation is
unsafe.

### Same workout through Garmin, Strava and HealthKit

Create one resolved session with a source graph. Select best compatible fields
per field policy; do not create three Activity cards or triple the load.

## Product invariant

No page owns the human body. Pages own questions. Canonical records own meaning.
The user owns placement.

