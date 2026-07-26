# Tier C gap scan — Rest and hygiene

Status: first-party gap scan complete  
Updated: 2026-07-25

## Evidence boundary

This is a product-pattern scan, not a validation of vendor accuracy or health
claims. It records useful inputs for later Body research. It does **not** define
widget umbrellas, variants, calculations or product scope.

## SleepWatch

**Distinctive pattern**

- Combines automatic Apple Watch sleep estimation with short subjective logs
  for restedness, energy and fatigue.
- Separates a responsive *Daily* score from a slower *Overall* rolling score.
  Trends can switch between daily, weekly and monthly periods.
- Its trend catalogue includes total sleep, rhythm, disruption, restful sleep,
  sleeping heart rate/HRV, heart-rate dip, oxygen and snoring.
- Visual patterns include a three-lane sleep timeline (Active, Light, Restful),
  anomaly states relative to the user's own norm, percentile comparisons, and
  habit tags linked to nights.

**Body-relevant lesson**

One nightly observation can support distinct views: immediate state, rolling
baseline, anomaly, longitudinal trend and peer context. Those meanings must not
be collapsed into one interchangeable score.

**Confidence / gaps**

- Confidence: **high** for public feature structure and named metrics.
- Gaps: proprietary formulas, current paywall/platform differences, direct UI
  capture, independent validation of inferred stages and derived scores.

Sources:

- https://www.sleepwatchapp.com/features/
- https://www.sleepwatchapp.com/blog/trends-tab-guide/
- https://www.sleepwatchapp.com/blog/Premium-Update-Improvement-to-SleepWatch-Score-Trends/
- https://www.sleepwatchapp.com/blog/sleep-pattern-graph/
- https://www.sleepwatchapp.com/blog/updates-to-sleep-anomaly-insight/

## ShutEye

**Distinctive pattern**

- A phone-first, non-wearable path: microphone recordings are analysed for
  sleep status and retained sound events such as snoring.
- Its report groups a sleep-quality score, estimated sleep stages, a snoring
  decibel timeline and an asserted sleep-apnea risk assessment.
- The tracking loop is paired with sleep sounds, guided relaxation, a smart
  alarm and recordings users can replay.

**Body-relevant lesson**

A non-wearable alternative is not merely manual entry. Phone sensors can create
a separate observation route, but source, uncertainty and limitations must stay
visible—especially where the product approaches screening language.

**Confidence / gaps**

- Confidence: **medium** for the documented workflow and report contents.
- Gaps: exact score/risk formulas, device/environment sensitivity, regulatory
  status, independent clinical validation and direct current app capture.

Sources:

- https://shuteye.ai/how-shuteye-sleep-tracker-works
- https://shuteye.ai/blog/track-sleep-without-watch
- https://shuteye.ai/blog/what-is-a-good-sleep-score

## Bearable — rest angle

**Distinctive pattern**

- Supports both synced sleep and manual inputs: time asleep, time in bed, naps,
  a 1–5 sleep-quality rating, notes and custom sleep factors.
- Treats sleep as both an outcome and a possible influence on other outcomes.
  Factor-effect reports compare sleep quality/quantity with days containing or
  not containing a factor, including same-day and one-to-seven-day windows.
- Its comparison graph overlays a selected factor as a background gradient
  behind a health line/bar; reports expose insufficient-data requirements and
  warn that correlations require interpretation.

**Body-relevant lesson**

Subjective, manual and imported data can coexist if their meaning remains
separate. Correlation surfaces need sample sufficiency, time-lag semantics and
non-causal language—not just a positive/negative badge.

**Confidence / gaps**

- Confidence: **high** for input structure and correlation workflow.
- Gaps: statistical method beyond the public explanation, confounder handling,
  uncertainty calculation, current UI capture and validation of synced-source
  normalization.

Sources:

- https://bearable.app/support/howto/configure-and-enter-data-into-bearable/
- https://bearable.app/support/howto/how-to-find-correlations/
- https://bearable.app/support/howto/the-factor-effect-report/
- https://bearable.app/why-subscribe-to-bearable-premium/

## Streaks

**Distinctive pattern**

- A deliberately constrained habit list: custom scheduled tasks, streak
  continuity, completion and simple statistics.
- Schedules can be daily, selected weekdays or a target number of days per
  week.
- Apple Health can automatically complete eligible goals; watch complications
  and widgets show remaining/in-progress work and support direct completion.

**Body-relevant lesson**

Routine completion can be event-driven rather than manually duplicated.
Schedule semantics must distinguish “specific days” from “N times per week,”
while automatic health completion needs explicit source permission.

**Confidence / gaps**

- Confidence: **high** for core task and Apple Health behaviour.
- Gaps: exact statistics, partial-progress rules, failure/skip semantics,
  current visual capture and behavior outside Apple platforms.

Sources:

- https://streaksapp.com/
- https://streaksapp.com/privacy.html

## Habitify

**Distinctive pattern**

- Separates build-habit goals from quit/limit goals. Limit goals add quantity,
  failed days and zero days rather than forcing binary completion.
- Progress surfaces span streak, completion rate, trend, calendar/heatmap,
  daily average and total; the 2026 redesign adds daily score, weekly rhythm,
  missed habits, focus zones and area balance.
- Reminders can be time-, location- or habit-event-driven. A habit can trigger
  another after completion, skip or failure.

**Body-relevant lesson**

Hygiene routines need more than a checkbox: frequency, quantity, abstention,
skip/failure and context can each change the valid progress model. The visual
summary should follow the goal semantics.

**Confidence / gaps**

- Confidence: **high** for published goal types, reminders and progress
  dimensions.
- Gaps: exact daily-score formulas, treatment of skipped/late logs in each
  chart, wearable automation coverage and direct current UI capture.

Sources:

- https://habitify.me/blog/habitify-11
- https://habitify.me/blog/how-to-track-habits-like-an-expert-with-habitify
- https://habitify.me/blog/let-data-tell-your-story
- https://feedback.habitify.me/changelog/all-new-progress-view-2

## Daylio

**Distinctive pattern**

- Uses a very low-friction entry: select mood and activities, with optional
  notes, photos or voice memos.
- Visualizations include mood lines, activity frequency, mood distribution,
  weekday occurrence, monthly/yearly summaries and a “Year in Pixels”.
- Its activity-to-mood analysis explicitly shows low/medium/high confidence and
  separates with-vs-without, previous-day, same-day and next-day comparisons.
- Goals can be daily or weekly and expose current/longest streak, success rate,
  trend and completion counts.

**Body-relevant lesson**

A correlation result becomes more trustworthy when its evidence strength and
temporal direction are visible. Fast, customizable logging can still feed rich
longitudinal views without pretending to be objective sensor data.

**Confidence / gaps**

- Confidence: **high** for logging, statistics and goal semantics.
- Gaps: exact statistical/confidence calculations, confounder handling,
  multi-entry-day aggregation and direct current app capture.

Sources:

- https://daylio.net/
- https://daylio.net/faq/docs/daylio-faq/about/activity-and-mood-statistics/
- https://daylio.net/faq/docs/daylio-faq/tutorials/setting-up-goals/

## Cross-product gaps exposed

- Observation source and confidence must travel with every derived value.
- Automatic, phone-sensed and manual rest data are different evidence classes.
- Habit/routine progress needs semantics before visualization; one completion
  rate cannot validly represent every goal type.
- Correlation views need data sufficiency, lag windows and explicit non-causal
  framing.
- A later direct-capture pass is still required before any visual pattern is
  treated as production reference.
