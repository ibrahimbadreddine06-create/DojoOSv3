# Lifesum competitor deep dive

Status: Tier A nutrition reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

This pass uses Lifesum's current official help center. Product scores remain
proprietary unless the exact calculation is disclosed.

Primary official evidence:

- [Life Score](https://help.lifesum.com/en/article/life-score-ios-dautml/)
- [iOS widgets](https://help.lifesum.com/en/article/lifesum-widgets-your-daily-progress-at-a-glance-ios-1jtju8c/)
- [Apple Watch app](https://help.lifesum.com/en/article/the-lifesum-watch-app-for-ios-how-does-it-work-ios-1kax89c/)
- [Profile and Health Goal](https://help.lifesum.com/en/article/how-can-i-edit-my-profile-health-goal-ios-1kkonui/)
- [Water tracking](https://help.lifesum.com/nl/article/hoe-je-waterinname-trackt-met-lifesum-android-lconq7/)

## Product architecture

The Diary combines calorie and macro progress, meals, water and exercise.
Progress contains historical statistics. Programs/meal plans and habit
trackers tailor the experience. Small, medium and large home-screen widgets
increase visible information and link directly to Diary or Water.

Water tracking supports:

- glass or bottle units;
- configurable serving size and daily goal;
- direct add/remove interaction;
- historical intake graph;
- separate beverage-food logging when calories are relevant.

## Scores and calculations

Life Score is a weekly 0–150 product score over sixteen nutrition/exercise
dimensions. It can begin from a 41-question test and later use logged food,
exercise, water and habits. It updates weekly and provides category feedback.
The exact weighting is not public.

Daily/meal ratings incorporate stated goals, preferences, settings, macro- and
micronutrient proportions and calorie-goal proximity. They are holistic rather
than a simple average. Exact thresholds and weights remain proprietary.

This means Body may study the explanation pattern but cannot reproduce the
score or claim equivalent validity.

## Visual and interaction grammar

- Central Life Circle/calorie progress.
- Macro progress and remaining-energy summary.
- Glass/bottle fill interaction for water.
- Weekly score with qualitative bands and change.
- Emoji-like daily/meal feedback.
- Home-screen sizes that reveal progressively more information.

## Product lessons, not widget decisions

Useful evidence for Body:

- compact direct-manipulation intake visuals can reduce logging friction;
- the user must see whether a result came from a questionnaire or records;
- a universal lifestyle score combines unlike domains and hides weighting;
- goal/preference adaptation needs explicit explanation;
- a larger widget size should add useful information, not merely zoom.

## Remaining evidence tasks

- Capture current Diary, Progress and every widget size.
- Reconstruct all sixteen Life Score categories and availability gates.
- Verify calorie/macro target equations and program-specific overrides.
- Audit score behavior under incomplete days and incompatible imported data.

