# Clue competitor deep dive

Status: Tier A hygiene/cycle reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Prediction and average calculation](https://support.helloclue.com/hc/en-us/articles/214434406-How-are-my-predictions-and-averages-calculated)
- [Available predictions](https://support.helloclue.com/hc/en-us/articles/29048842612765-What-predictions-are-available-in-Clue)
- [Analysis and tracking support](https://support.helloclue.com/hc/en-us)
- [Doctor report](https://support.helloclue.com/hc/en-us/articles/37230262486685-What-kind-of-data-is-shown-in-the-report-for-my-doctor)

## Product architecture

Clue combines daily cycle/event logging, calendar, predictions, Analysis,
educational context and shareable reports. Tracked experiences can include
bleeding, pain, emotions, sleep, energy, skin, digestion, exercise, sex,
medication and custom notes.

## Calculations and semantics

Predictions continuously update from tracked history. Current official
documentation states:

- predictions use up to the last twelve cycles;
- averages use the last six cycles;
- this applies to cycle length, period length, PMS length and PMS timing;
- more historical period records improve initial prediction behavior.

Logged events are facts; predicted period, PMS, fertile-window and ovulation
timing are estimates. A doctor report emphasizes recurring patterns across the
cycle rather than isolated entries.

Cycle/fertility predictions must not be reframed as contraception or diagnosis.

## Visual and interaction grammar

- Cycle calendar with logged and predicted states.
- Current cycle-day/timing focus.
- Analysis of length, variation and recurring symptoms.
- Symptom occurrence positioned across cycle phase.
- Fast historical period entry.
- Pattern-oriented clinician report.

## Product lessons, not widget decisions

- Logged and predicted events need visibly different states.
- Prediction windows require input-history counts and uncertainty.
- Sensitive tracking must be explicit opt-in.
- Cycle patterns may contextualize other records without claiming causation.
- Reports should preserve the user's exact entries and prediction provenance.

## Remaining evidence tasks

- Capture all current Analysis, prediction and irregular-cycle states.
- Verify prediction changes after edits/deletions and wearable imports.
- Audit pregnancy, contraception and adolescent safety boundaries.
- Reconstruct subscription and region differences.

