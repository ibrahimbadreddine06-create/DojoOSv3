# YAZIO competitor deep dive

Status: Tier A nutrition reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

This pass uses YAZIO's official help center. It records visible product
behavior and disclosed inputs without assuming proprietary calculation detail.

Primary official evidence:

- [YAZIO app tutorial](https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app)
- [YAZIO Help Center](https://help.yazio.com/hc/en-us)

## Product architecture

The main areas are Diary, Recipes, Fasting, Analysis, Profile and Settings.

Diary is the daily operating surface:

- consumed, remaining and burned calories;
- calorie and macronutrient progress;
- meal records;
- activities;
- water;
- body weight.

Analysis extends tracked information across days, weeks and months, including
nutrition, steps, activities and measurements. Weekly/monthly evaluation is
subscription gated. Profile holds goals and current progress. Settings allow
calorie/macro goals and feature configuration.

Fasting provides multiple timer programs; the common 16:8 program is available
without the complete paid program set.

## Calculations and semantics

The official tutorial confirms the visible consumed/remaining/burned
accounting model but does not disclose enough detail to reproduce YAZIO's
current calorie target or adjustment formulas. Body must therefore treat:

- calorie target;
- exercise credit;
- macro targets;
- fasting-program advice

as products requiring independent specification rather than formulas to copy.

Daily records and historical analysis depend on manual logging completeness.
An unlogged meal cannot be interpreted as zero intake.

## Visual and interaction grammar

- Daily calorie balance as primary Diary summary.
- Macro progress beside meal records.
- Timeline/grouped meal logging.
- Water and weight as adjacent daily records.
- Fasting countdown/timer.
- Day/week/month analysis views.
- Recipe discovery and reusable capture.

## Product lessons, not widget decisions

Useful evidence for Body:

- one daily surface can combine capture and feedback without making every item
  a score;
- fasting is an interval/event with start, end and state, not merely a KPI;
- long-range analysis must preserve logging coverage;
- paid availability and connected-source state must remain explicit.

## Remaining evidence tasks

- Capture current Diary and Analysis visuals across free/Pro.
- Verify target equations, exercise adjustment and minimum safeguards.
- Audit fasting plans, contraindication messaging and regional availability.
- Reconstruct nutrient depth, database provenance and correction workflows.

