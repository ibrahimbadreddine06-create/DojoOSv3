# TrainingPeaks competitor deep dive

Status: Tier A activity reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Athlete Home Performance Insights](https://help.trainingpeaks.com/hc/en-us/articles/41077784209165-Athlete-Home-Performance-Insights)
- [Fatigue / ATL](https://help.trainingpeaks.com/hc/en-us/articles/204071894-Fatigue-ATL-)
- [Form / TSB](https://help.trainingpeaks.com/hc/en-us/articles/204071764-Form-TSB)
- [Glossary](https://help.trainingpeaks.com/hc/en-us/articles/115001271712-Glossary)
- [Starting CTL caveat](https://help.trainingpeaks.com/hc/en-us/articles/230903988-Estimate-Starting-Fitness-CTL)
- [Annual Training Plan methods](https://help.trainingpeaks.com/hc/en-us/articles/224662768-Annual-Training-Plan-Methodologies)

TrainingPeaks exposes formulas and defaults, but sport-specific TSS variants,
threshold configuration and WKO-only models require separate reconstruction.

## Product architecture

Training is calendar-led: planned and completed sessions share the same
temporal surface. Workout detail feeds weekly summaries, Athlete Home,
Performance Insights and the Performance Management Chart. Plans can target
duration, weekly TSS or event CTL and can project future load.

## Core calculations

- ATL/Fatigue is an exponentially weighted average of daily TSS with a default
  7-day time constant:
  `ATLtoday = ATLyesterday + (TSStoday - ATLyesterday) × (1 / constant)`.
- CTL/Fitness is a weighted average of daily TSS with a default 42-day window.
- TSB/Form uses the prior day's values:
  `TSBtoday = CTLyesterday - ATLyesterday`.
- Ramp Rate is change in CTL, commonly over seven days.

Seeded CTL is explicitly provisional. TrainingPeaks advises cautious
interpretation until roughly four to six weeks of complete TSS history exist.
The product's current qualitative bands are product guidance, not universal
medical or injury thresholds.

## Visual and interaction grammar

- Calendar of prescribed and completed workouts.
- Workout cards with planned-versus-actual state.
- Performance Management Chart with CTL, ATL and TSB lines.
- Seven-, thirty- and ninety-day performance views.
- Tap/hover inspection for exact daily values.
- Weekly summaries, load targets and projected future curves.
- Stable color identities for Fitness, Fatigue and Form.

## Product lessons, not widget decisions

- Named formulas and configurable thresholds must travel with load outputs.
- Planned, completed and projected values require distinct visual states.
- A training-load number without full session coverage is misleading.
- TSB must not be relabelled as injury prediction or universal readiness.
- Sport-specific load methods cannot be merged as interchangeable TSS.

## Remaining evidence tasks

- Reconstruct every TSS variant and threshold requirement.
- Capture mobile/web workout cards, calendar states and PMC configuration.
- Audit manual edits, recalculation and multi-sport comparability.
- Validate load interpretations independently before Body adopts a model.

