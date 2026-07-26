# Cronometer competitor deep dive

Status: Tier A nutrition reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

This pass uses Cronometer's current official support material. It establishes
product structure, visible information, calculations Cronometer discloses and
visual patterns. It does not treat screenshots or marketing claims as proof of
database accuracy, clinical validity or API access.

Primary official evidence:

- [Diary Overview](https://support.cronometer.com/hc/en-us/articles/360018171731-Diary-Overview)
- [Chart Library](https://support.cronometer.com/hc/en-us/articles/360029490111-Charts-Chart-Library)
- [Add a Biometric](https://support.cronometer.com/hc/en-us/articles/360018302431-Add-a-Biometric)
- [Mobile Profile](https://support.cronometer.com/hc/en-us/articles/360019870632-Mobile-Profile)

## Product architecture

The Diary is the operational center. It combines dated food, exercise,
biometrics and notes rather than separating nutrition from all context. Its
daily surface exposes an energy summary, macro targets, nutrient targets,
nutrient balances and charts. Trends provide single-metric, multi-variable and
custom charts. Fasting, water and biometrics are adjacent tracked records.

Cronometer supports:

- food, recipe and supplement logging;
- configurable diary groups and timestamps;
- macro- and micronutrient target summaries;
- biometrics, custom biometrics and notes;
- water and fasting records;
- trend charts and correlations;
- imported wearable records;
- nutrition scores and nutrient-balance views.

## Calculations and semantics

Profile age, sex, height, weight and body-fat inputs can affect energy, macro
and nutrient targets. Cronometer documents BMI as `weight kg / height m²`.

Nutrition Scores are derived from progress toward nutrient targets and ratios.
Meeting a daily target maximizes the relevant contribution; exceeding a
maximum can reduce it. This is a product score, not a raw nutrient fact.

The chart library includes:

- one biometric or nutrient over time;
- nutrition-score history;
- blood pressure with heart rate;
- lipid panels;
- weight with body fat;
- glucose/ketone relationships;
- user-defined multi-variable charts.

Unknown values must remain unknown: a nutrient absent from a food record is
not evidence that the consumed amount was zero.

## Visual and interaction grammar

- Dense diary table/list with group subtotals.
- Daily energy and nutrient progress summaries.
- Target bars and nutrient-balance graphics.
- Calendar navigation over historical records.
- Single- and multi-series trend charts.
- User-selected chart library rather than one fixed dashboard.
- Direct add/edit actions beside the record context.

## Product lessons, not widget decisions

Useful evidence for Body:

- completeness and database coverage must travel with nutrition interpretation;
- nutrient detail rewards drill-down rather than one overloaded summary;
- raw biometrics and interpreted nutrition scores require separate semantics;
- custom measurements are valuable without pretending their interpretation is
  universal;
- correlations are exploratory and must not be presented as causal.

Do not copy Cronometer's scores or target defaults without separately
validating their definitions, populations and data-completeness behavior.

## Remaining evidence tasks

- Capture current iOS, Android and web screens for exact responsive behavior.
- Verify food-source confidence and missing-nutrient treatment in production.
- Reconstruct every Nutrition Score category and target-source option.
- Audit free versus Gold visibility and regional food-database differences.

