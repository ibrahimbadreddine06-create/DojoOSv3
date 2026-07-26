# Flo competitor deep dive

Status: Tier A hygiene/cycle reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Cycle predictions](https://help.flo.health/hc/en-us/articles/4406826523284-Checking-your-cycle-predictions)
- [Symptom logging](https://help.flo.health/hc/en-us/articles/4406826542740-Logging-your-symptoms)
- [Using Flo](https://help.flo.health/hc/en-us/articles/360014347632-How-do-I-use-the-app-)
- [Free feature set](https://help.flo.health/hc/en-us/articles/4411293934740-What-s-included-in-the-free-version)

## Product architecture

Flo combines a current-cycle home, calendar, period/ovulation predictions,
symptom/event capture, Graphs & Reports, personalized stories/assistant content,
fertility/pregnancy modes and community.

The capture surface supports large customizable symptom/event sets, flow,
basal temperature, ovulation tests and other cycle context. Historical records
remain editable.

## Calculations and semantics

After at least one period record, Flo can estimate next period, ovulation,
fertile days and delay. Official guidance recommends twelve months or at least
three cycles for improved predictions. Ovulation-test results can add evidence
in pregnancy-planning context.

Tracked symptoms can influence prediction/personalization and appear in
historical graphs. The precise prediction algorithm is not public.

Period and symptom records are observations. Ovulation/fertile days remain
predictions and cannot be treated as contraceptive certainty.

## Visual and interaction grammar

- Swipeable circular countdown for period/ovulation.
- Color-coded period, fertile/ovulation and delay states.
- Week strip plus month/year calendar.
- Daily symptom/event capture.
- Cycle history and symptom graphs/reports.
- Contextual daily story based on phase and records.

## Product lessons, not widget decisions

- A prominent prediction requires equally prominent estimate semantics.
- Users need fast corrections because edits change downstream results.
- Sensitive modes and symptom sets require granular privacy control.
- Educational content should not obscure raw records or uncertainty.
- Pattern views can support appointments without diagnosing a condition.

## Remaining evidence tasks

- Reconstruct the current prediction model's disclosed boundaries.
- Capture free/Premium modes and all irregular/missing states.
- Audit privacy, anonymous mode, deletion and export.
- Independently validate fertility and symptom guidance.

