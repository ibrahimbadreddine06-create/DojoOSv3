# Nutrition Tier C — targeted gap scan

Status: first-party evidence pass, 2026-07-25  
Scope: product patterns relevant to Body research. This document does **not** define widget umbrellas.

## FatSecret

**Distinctive pattern.** A conventional but broad nutrition operating loop: set a weight goal → receive recommended intake targets → log verified foods by meal → inspect daily/weekly reports → reinforce consistency with streaks and achievements.

**Relevant evidence**

- Inputs include food search, barcode scanning, custom meals/recipes, weight, water, exercise, and connected steps/calories/weight.
- Outputs include calories, macro breakdowns, nutrient totals, meal contribution, weekly averages, weight history, streaks and achievements.
- The reporting layer explicitly separates diary calculations from reference-only custom report objectives. Weekly averages divide logged totals by days containing entries; missing days therefore require careful interpretation.
- Visual evidence on official pages shows diary totals, nutrient breakdowns, weight charts and progress/report views, but the exact current component grammar still needs direct app capture.

**Sources:** [product](https://www.fatsecret.com/app), [help index](https://www.fatsecret.com/fatsecret-app-help), [reports logic](https://www.fatsecret.com/fatsecret-app-help/reports-page/understanding-your-data-on-the-reports-page)

**Confidence / gaps:** High for tracked fields and report semantics; medium for current visual execution. Direct iOS/Android capture and verification of premium-only surfaces remain.

## Cal AI

**Distinctive pattern.** Capture-first calorie tracking. The primary value is reducing logging friction through a meal photo, barcode, text description or manual/search fallback—not inventing a novel nutrition model.

**Relevant evidence**

- Core outputs: calories, protein, carbohydrates and fat; the public API additionally exposes servings, ingredient-level estimates, a health rating/tips and a signal that label scanning should replace image inference.
- The product says phone depth data is used to estimate food volume. Its terms correctly describe calorie and food-recognition outputs as automated approximations.
- HealthKit/Health Connect can contribute activity context; the product also stores goals, body measurements, dietary restrictions and progress data.
- The useful pattern is confidence-aware capture: fast inference, editable decomposition, and an explicit fallback when an image is the wrong input mode.

**Sources:** [product](https://calai.app/), [scan API](https://docs.calai.app/api-reference/endpoint/scanImage), [terms and accuracy caveat](https://www.calai.app/tos), [accessibility and alternate logging](https://www.calai.app/accessibility)

**Confidence / gaps:** High for capture modes and API response shape; medium for estimation implementation; low for exact in-app trend visualizations without direct capture.

## Fitia

**Distinctive pattern.** A closed loop joining detailed tracking, adaptive targets and executable meal planning. It converts the same calorie/macro model into both retrospective progress and prospective portions/shopping.

**Relevant evidence**

- Logging by photo, voice, text, barcode, custom foods and recipes; tracked fields include calories, macros and micronutrients.
- Targets can be customized and dynamically adjusted from weight progress. Imported activity/NEAT can influence calorie adjustments.
- Progress includes goal completion, weight, body fat, measurements and photos.
- Planning includes automatically generated meals, adjustable servings, recipes, shopping lists and diet preferences.
- Additional surfaces include water, fasting windows, reminders, streaks and home-screen widgets for calories/macros/meals/fasting/water.

**Source:** [official feature inventory](https://fitia.app/features/)

**Confidence / gaps:** High for feature inventory; medium for target-adjustment semantics; low for exact formulas and current visualization details. Scientific validation and direct app capture remain necessary.

## Ate Food Journal

**Distinctive pattern.** A non-calorie, photo-first reflection system: log the meal quickly, then capture the surrounding context and reason for eating. Its information architecture treats awareness and pattern recognition as the output.

**Relevant evidence**

- Meal photographs form a visual timeline; notes can record why the user ate and how the meal made them feel.
- The product emphasizes hunger cues, mood, accountability, mindful questions and AI insights rather than macro compliance.
- It supports customizable tracking; first-party material references workouts, moods and liquids in addition to food.
- For Body, this is evidence that nutrition value can be represented through chronology, context and qualitative patterns—not only numeric targets.

**Sources:** [product](https://youate.com/), [service definition](https://youate.com/terms-privacy.html), [first-party explanation](https://youate.com/blog/best-food-journaling-app/)

**Confidence / gaps:** High for the qualitative journaling model; medium for current premium field set; low for the precise AI-insight method and visualization grammar without direct capture.

## Zero

**Distinctive pattern.** A fasting-centered daily control surface that now combines timer state, meal capture, protein adequacy and hydration. It deliberately compresses nutrition guidance into a small number of immediate decisions.

**Relevant evidence**

- Real-time fasting timer, selectable/custom fasting schedules, history, average fasting length and streak.
- Meal photo/text logging with calories and macros, but protein is promoted as the primary nutritional signal.
- A proprietary Protein Score balances protein intake against calorie needs and updates as meals are logged.
- Personalized water goal and daily/weekly hydration progress.
- Post-fast notes and feelings add qualitative context to fasting history.

**Sources:** [current product](https://zerolongevity.com/), [fast history and notes](https://zerolongevity.com/blog/home/)

**Confidence / gaps:** High for product surfaces; medium for visual patterns visible in first-party screenshots; low for Protein Score formula and validation. Do not reproduce that score without independent science work.

## Fastic

**Distinctive pattern.** A broad habit layer built around a fasting timer and “body status” narrative, supported by multiple lightweight trackers rather than deep nutrient analysis.

**Relevant evidence**

- Fasting timer and body-status progression are the central visualization/state model.
- Food scanner, meal plans and recipes cover intake; water, food, steps, sleep, workouts and weight extend the context.
- The product promises progress/status overviews and pairs tracking with short educational courses and habit formation.
- The relevant design pattern is phase/state communication during a live fast plus a compact multi-habit overview.

**Sources:** [product](https://fastic.com/?lang=en), [official creator feature list](https://fastic.com/en/creator), [official tracking description](https://fastic.com/en/blog/how-long-to-see-intermittent-fasting-results)

**Confidence / gaps:** Medium-high for the feature set; low for body-status calculation, exact data provenance and current chart details. Claims about physiological fasting phases require separate scientific validation.

## Cara Care

**Distinctive pattern.** Clinical symptom–factor correlation rather than general calorie tracking. Food is one event stream inside a wider gut-health diary used to detect personal triggers and monitor treatment progress.

**Relevant evidence**

- Tracks meals/drinks, water, stool, digestion, mental state, symptoms and contextual factors such as sleep, stress and medication; Apple Health activity and heart-rate data may be linked with reported symptoms.
- Users record symptom onset and resolution, severity/context tags, and symptom-free periods; absence of symptoms is itself meaningful for severity assessment.
- Weekly/monthly diary views expose patterns and potential triggers.
- A 12-week personalized program uses onboarding and follow-up questionnaires; progress is shown graphically and can be exported.
- This is strong evidence for temporally aligned event streams and cautious association language, not causal claims.

**Sources:** [product](https://cara.care/en), [program and progress model](https://cara.care/en/reizdarm), [official manual](https://eu-prod.cara.care/uploads/Cara_Care_fuer_Reizdarm_Bedienungsanleitung_Version_14.pdf), [privacy/data linkage](https://cara.care/en/privacy-app)

**Confidence / gaps:** High for tracked categories and workflow; medium-high for clinical positioning; medium for exact visual execution. The publicly documented therapy is currently German-market specific, so regulatory transfer cannot be assumed.

## Cross-product gaps surfaced

- **Input confidence is product-critical.** Photo inference, verified databases and symptom self-report have different uncertainty; a production model must preserve source, edit history and confidence rather than flattening them.
- **Missingness is meaningful.** “Not logged,” “zero,” “not measured” and “symptom absent” cannot share one state.
- **Nutrition has multiple valid interaction models.** Quantitative targets, mindful reflection, fasting state and symptom correlation solve different jobs; they should not be forced into one generic dashboard grammar.
- **Proprietary scores are evidence gaps.** Protein Score, body-status phases, dynamic targets and AI health ratings need independent formula/science review before adoption.
- **Visual research remains incomplete.** Official sites establish product semantics, but exact current charts, hover/tap behavior, responsive states and accessibility require direct app capture.

