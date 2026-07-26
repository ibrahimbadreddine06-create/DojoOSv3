# Nutrition functional vertical slice

Status: product contract  
Updated: 2026-07-25

## Outcome

Nutrition separates what the user intended to consume from what actually
entered the body. Manual capture is first-class; assistance may improve capture
but never invent certainty.

## Required functional umbrellas

### Log Intake

Answers: **What entered my body, and how can I record it accurately now?**

It owns capture methods, drafts, review and save/correction. It does not own
nutrient interpretation widgets.

### Meal Plan

Answers: **What intake have I planned, and what should happen with it now?**

It acts on the same commitments the Planner can show. It never marks planned
food as consumed.

### Existing hybrid umbrellas

- Water Intake: quick add/correct explicit fluid events.
- Recent Meals: inspect/edit/reuse; reuse selects planned, draft or consumed.
- Caffeine/Alcohol: opt-in quick record with time/amount/provenance.
- Supplements: due occurrence and taken/skipped execution.
- Fasting: commitment plus actual interval execution.

## Canonical separation

- meal/food/preset definition;
- planned-intake commitment;
- consumed-intake event;
- ingredient/nutrient assertions with source and coverage;
- intake-routine definition;
- recurrence and dated occurrence;
- check-in/execution;
- attachment and assisted-analysis result.

Unknown nutrient content remains unknown. A photo/description result remains an
editable estimate with model/source version.

## Planner behavior

Timed and day-bound intake commitments can appear in Planner and Nutrition.
Both operate on one record. Meal Plan provides the nutrition-specific controls
for reuse, replacement and plan-versus-actual reconciliation.

Not every target is time-bound. Daily water/fibre targets may be goals or
references without becoming fake time blocks.

## Main flows

1. Plan a meal from preset, search result or open description.
2. At consumption, confirm as planned or record actual differences.
3. Start a spontaneous intake through Log Intake.
4. Save incomplete intake honestly and complete it later.
5. Mark a due supplement occurrence taken/skipped without duplicating intake.
6. Start/end/correct fasting while retaining the planned window.

## Current-code gaps

- `intakeLogs` is a flat meal-plus-nutrient row and cannot represent ingredient
  provenance or partial composition robustly.
- `linkedBlockId` cannot express day-bound commitments or reconciliation.
- `intakeRoutines` definitions and check-ins are useful prototypes but require
  generated occurrences and Planner links.
- `/api/intake-routines` fabricates three supplements on empty storage.
- AI analysis endpoints need typed estimate/error states and model provenance.
- “No intake logged” is an empty state, not an AI brief.

## Acceptance tests

1. Planned and consumed intake never collapse.
2. A planned meal can be changed at consumption without rewriting the plan.
3. Manual, barcode, search and assisted inputs preserve provenance.
4. Unknown nutrients remain unknown.
5. One supplement occurrence produces at most one canonical execution.
6. Planner and Meal Plan show the same commitment.
7. Offline drafts reconcile safely.
8. Empty storage returns no fabricated foods/supplements.

