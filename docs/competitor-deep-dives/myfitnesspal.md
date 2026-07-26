# MyFitnessPal competitor deep dive

Status: Tier A nutrition reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

MyFitnessPal introduced a substantially revised Today and Progress experience
in 2026. This pass prioritizes current official support pages and records
country, language and subscription gates where disclosed.

Primary official evidence:

- [New Today tab](https://support.myfitnesspal.com/hc/en-us/articles/39985611667341-Introducing-the-brand-new-Today-tab)
- [Progress Overview](https://support.myfitnesspal.com/hc/en-us/articles/45246617814669-Introducing-Progress-Overview-Your-Progress-Personalized)
- [Initial goals](https://support.myfitnesspal.com/hc/en-us/articles/360032625391-How-does-MyFitnessPal-calculate-my-initial-goals)
- [Nutrition 101: Calories](https://support.myfitnesspal.com/hc/en-us/articles/360032625931-Nutrition-101-Calories)
- [Calorie Adjustment](https://support.myfitnesspal.com/hc/en-us/articles/360032623871-Understanding-your-Calorie-Adjustment)
- [Diary Food Insights](https://support.myfitnesspal.com/hc/en-us/articles/360032270352-What-are-Diary-Food-Insights)

## Product architecture

Today makes the Diary the home surface. It combines:

- meal and food records;
- calorie and macro summaries;
- nutrient dashboard configurations;
- logging streaks;
- water, exercise and steps under Healthy Habits;
- quick add, barcode, meal scan and voice logging;
- recipes and meal-planning entry points.

Progress provides weekly calories, weight trend, macro goal comparison,
nutrition tips and broader reports. Day views use calorie-by-meal and macro pie
charts; week views switch to graphs.

## Calculations and semantics

Current official nutrition material states that MyFitnessPal uses Mifflin–St
Jeor for initial energy estimation from age, height, weight, sex and activity.
A chosen weight-change rate adds or subtracts an energy amount.

Net Calories are defined as:

`food calories - exercise calories = net calories`

Connected partner adjustment compares projected partner total daily burn with
MyFitnessPal's expected total while accounting for manually logged cardio to
avoid obvious double counting. It changes as the partner sync progresses.

Critical limitations:

- calorie needs and logged intake are estimates;
- wearable total burn is a provider estimate;
- progress quality depends on logging completeness;
- current Progress availability is region/language/version gated;
- some insights and macro guidance are subscription gated.

Diary Food Insights are context messages created from dietitian-reviewed
research/scoring models. Their exact algorithm is not public.

## Visual and interaction grammar

- Calorie and macro cards on Today.
- Meal-grouped chronological diary.
- Pie charts for daily meal-calorie and macro composition.
- Weekly calorie bars/graphs and weight line.
- Goal progress, streak and contextual guidance.
- Drill-down from compact summary to day/week nutrient detail.

## Product lessons, not widget decisions

Useful evidence for Body:

- intake completeness must be visible beside weekly interpretation;
- daily composition and longitudinal adherence answer different questions;
- exercise-calorie adjustment needs traceable inputs and anti-duplication;
- data capture speed materially affects whether analytics are trustworthy;
- regional and premium gates belong in capability state.

Body must not inherit sex-based calorie floors, five-week projections or
provider calorie adjustments without separate scientific and safety review.

## Remaining evidence tasks

- Capture the 2026 Today and Progress surfaces in every supported region/tier.
- Reconstruct all selectable nutrient-dashboard configurations.
- Verify current food-database provenance and user-edited-entry indicators.
- Audit eating-disorder safeguards and low-intake messaging end to end.

