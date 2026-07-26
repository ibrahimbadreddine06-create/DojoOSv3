# RISE competitor deep dive

Status: Tier A rest/recovery reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Sleep debt](https://help.risescience.com/hc/en-us/articles/40621334445335-How-is-my-sleep-debt-calculated)
- [Sleep need](https://help.risescience.com/hc/en-us/articles/40621897428631-How-is-my-sleep-need-estimated)
- [Energy Schedule](https://help.risescience.com/hc/en-us/articles/40672503374871-How-does-RISE-predict-my-Energy-Schedule)
- [Melatonin Window](https://help.risescience.com/hc/en-us/articles/40610561421591-Why-does-my-Melatonin-Window-seem-wrong)
- [Widgets](https://help.risescience.com/hc/en-us/articles/40590423725719-How-do-I-set-up-RISE-widgets)
- [Irregular schedules](https://help.risescience.com/hc/en-us/articles/40672537872663-Can-RISE-work-with-a-night-shift-or-irregular-schedule)

## Product architecture

RISE intentionally focuses on sleep quantity and circadian timing rather than
a generic sleep-quality score. Its core products are:

- personal sleep need;
- rolling sleep debt;
- predicted Energy Schedule with peaks/dips;
- Melatonin Window;
- Smart Alarm;
- sleep timing/history and manual correction;
- circadian habit reminders;
- phone-, mattress- or wearable-derived sleep.

## Calculations and semantics

Sleep need analyzes up to 365 nights for rebound sleep after shorter periods,
with research-based upper/lower bounds. Motion and step data are required in
the phone path; wearable sleep, exercise and daylight can add context. The
estimate can be manually overridden.

Sleep debt compares actual sleep with personal sleep need across fourteen
nights. Recent nights receive more weight. Extra sleep and naps can reduce the
debt. Exact weighting coefficients are not public.

Energy Schedule uses a biomathematical circadian model based on recent sleep
timing plus factors such as light exposure and activity. Melatonin Window is
predicted from recent sleep/wake patterns. Neither is a direct melatonin
measurement.

Irregular shifts and travel are explicit limitation states. Daytime sleep may
require manual nap entry.

## Visual and interaction grammar

- Sleep-debt number and fourteen-night history.
- Full-day energy curve with predicted peaks and dips.
- Time window for predicted melatonin onset/bedtime.
- Sleep timing overlay on progress charts.
- Widgets for energy, debt and melatonin window.
- Alarm configuration showing expected debt impact.
- Timed reminders attached to the circadian model.

## Product lessons, not widget decisions

- Sleep quantity, debt and circadian timing are distinct concepts.
- Estimated sleep need needs calibration history and an override.
- Circadian predictions must expose travel/shift limitations.
- Phone and wearable sleep cannot silently become equivalent sources.
- A prediction must not be presented as a measured hormone or energy level.

## Remaining evidence tasks

- Obtain exact sleep-debt weighting and biomathematical-model documentation.
- Capture every widget size and Progress/Energy state.
- Independently validate the 14-day debt and sleep-need methodology.
- Audit source switching, edited nights and recalculation.

