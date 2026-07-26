# MacroFactor competitor deep dive

Status: Tier A nutrition reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

This pass uses MacroFactor's official knowledge base. It distinguishes
disclosed principles from proprietary implementation details.

Primary official evidence:

- [Dashboard](https://help.macrofactorapp.com/dashboard/consistency/)
- [Expenditure](https://help.macrofactorapp.com/en/articles/20-expenditure)
- [Weight Trend](https://help.macrofactorapp.com/dashboard/weight_trend)
- [Interpreting expenditure](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure)
- [Expenditure versions](https://help.macrofactorapp.com/en/articles/74-expenditure-version)
- [Wearable expenditure policy](https://help.macrofactorapp.com/en/articles/33-does-macrofactor-use-energy-expenditure-data-from-my-wearable-activity-tracker)

## Product architecture

The dashboard separates today's records from interpreted analytics.

Daily/accounting surfaces include:

- scale weight;
- logged calories and macronutrients;
- weekly calorie/macro bars;
- body measurements and progress photos;
- nearly sixty trackable nutrients with pinning and custom targets.

Interpreted surfaces include:

- Expenditure;
- Weight Trend;
- Goal Progress;
- weekly coached check-ins and adjustments.

This separation is important: raw scale weight is not silently replaced by
trend weight, and estimated expenditure is visibly a calculated product.

## Weight Trend

Missing scale-weight days may be linearly interpolated. The resulting series is
processed by a recency-weighted trend algorithm. Raw scale weight is displayed
as a pale series and trend weight as the emphasized series. MacroFactor does
not disclose every coefficient, so Body cannot reproduce it from the support
description alone.

## Expenditure calculation

The disclosed basis is:

`energy expenditure = logged energy intake - change in stored energy`

Change in stored energy is inferred from trend-weight change while accounting
for different assumed energy densities of fat and lean tissue. The output is
continuously updated and feeds calorie/macro recommendations.

Important constraints:

- partial nutrition logging can bias expenditure downward;
- continuous updates require sufficient nutrition and weight logging;
- initial estimation uses Cunningham BMR plus proprietary activity multipliers;
- V3 is the current recommended algorithm;
- exact V3 smoothing and correction logic remains proprietary;
- wearable calorie-burn estimates are deliberately excluded from the core
  expenditure calculation;
- optional step-informed modifiers can accelerate response to activity change.

The product exposes `holding` and `updating` states instead of manufacturing an
estimate when coverage is inadequate.

## Visual and interaction grammar

- Raw-versus-smoothed dual weight lines.
- Expenditure time series with inspectable historical values.
- Goal trajectory and rate-of-change framing.
- Stacked daily calorie/macro bars across a week.
- Small dashboard summaries opening dedicated analytical detail.
- Explicit algorithm state and coaching check-in cadence.

## Product lessons, not widget decisions

Useful evidence for Body:

- observed, smoothed and calculated values need distinct names and provenance;
- a calculation should expose minimum input coverage and a paused state;
- incomplete days are not equivalent to low intake;
- wearable energy expenditure must not be treated as exact;
- recommendations should explain which changed input caused an adjustment.

Body must not copy MacroFactor's proprietary trend/expenditure implementation
or advertise equivalent accuracy without independent validation.

## Remaining evidence tasks

- Capture every current dashboard configuration and size/state.
- Verify exact V3 eligibility, revision history and modifier behavior.
- Audit coached/collaborative/manual program differences.
- Independently validate any Body expenditure model before production use.

