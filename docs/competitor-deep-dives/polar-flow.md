# Polar Flow — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Polar Flow, Nightly Recharge, Sleep Plus Stages, Training Load Pro
and compatible-device recovery/performance features

## Evidence boundary

Polar documents many algorithms and time windows, but device support varies.
Product-visible data is not assumed to be available through AccessLink. Exact
connector fields are recorded in
[`polar-accesslink-v3.md`](../body-provider-inventory/polar-accesslink-v3.md).

Primary sources:

- Nightly Recharge:
  https://support.polar.com/us-en/nightly-recharge-recovery-measurement
- Sleep Plus Stages:
  https://support.polar.com/us-en/troubleshooting-polar-sleep-plus-stages
- Training Load Pro:
  https://support.polar.com/e_manuals/pacer/polar-pacer-user-manual-english/training-load-pro.htm
- Training-readiness feature comparison:
  https://support.polar.com/us-en/training-readiness

## Product architecture

Polar Flow is training-plan and session centered. Its core system joins:

- daily activity and workouts;
- Nightly Recharge and sleep;
- Cardio Load Status;
- training history/reports;
- device-dependent fitness/recovery tests;
- programs, goals and season planning.

The web product is stronger for reports and planning; mobile is stronger for
daily status and session review.

## Nightly Recharge

Nightly Recharge combines two independently interpretable components:

- ANS charge: heart rate, RMSSD HRV and breathing rate during the early hours
  of sleep;
- Sleep charge: last-night sleep versus the person's 28-day usual level.

It requires more than four hours of sleep and three successful consecutive
nights for initial output. Both components compare last night with a personal
28-day baseline. The result ranges verbally from very poor to very good and
drives exercise, sleep and energy-regulation guidance.

This is a strong compositional pattern: the user can see whether a weak result
came from autonomic settling, sleep, or both.

## Sleep

Sleep Plus Stages uses wrist movement and beat-to-beat intervals with
continuous HR enabled. It exposes:

- sleep/wake timing and duration;
- continuity/fragmentation and interruptions;
- Light, Deep and REM;
- Sleep Score and Sleep charge;
- overnight HR, HRV and breathing context;
- nightly breakdowns and weekly summaries;
- optional subjective sleep rating.

Polar explicitly acknowledges automatic-detection error and allows the user to
review sleep behavior rather than treating stage estimates as ground truth.

## Training Load Pro

Training Load Pro separates load by system:

- Cardio Load: TRIMP from HR and duration;
- Perceived Load: subjective exertion combined with duration;
- Muscle Load: power-derived musculoskeletal demand where compatible data is
  available.

Cardio Load Status compares:

- Strain: average daily Cardio Load over seven days;
- Tolerance: average daily Cardio Load over 28 days.

Their ratio produces states such as Detraining/Recovering, Maintaining,
Productive and Overreaching. Session bars are contextualized against the
athlete's prior 90-day distribution.

This separation is more defensible than one universal “load” number. Body
should preserve source modality and never silently substitute cardio load for
muscular load.

## Other recovery/performance tools

Depending on device, Polar also offers Recovery Pro, Orthostatic Test, leg
recovery, Running Index, Fitness Test, FuelWise, FitSpark, race programs and
sport-specific performance metrics. These are specialist umbrellas, not
justification to overload a general hub.

## Visual grammar

- two-component overnight recovery;
- score plus personal 28-day comparison;
- sleep-stage timeline and weekly summaries;
- session-load bars;
- 7-day versus 28-day load lines/ratio;
- 90-day-relative session intensity colors;
- verbal state plus actionable guidance;
- tests and planned sessions distinct from passive metrics.

## Strengths

- Transparent time windows and calculation families.
- Cardio, muscular and perceived load remain distinct.
- Strong planning-to-session-to-recovery loop.
- Personal baselines are used consistently.
- Subjective input complements sensors.

## Weaknesses and Body opportunities

- Feature fragmentation by device is substantial.
- Flow's information density can feel athlete-first and technical.
- Several advanced recovery tests require specific workflows/devices.
- AccessLink does not necessarily expose every Flow result.
- General health, nutrition and hygiene coverage is limited.

Body should adopt the component separation and temporal transparency, while
providing provider-neutral inputs, simpler progressive disclosure and broader
life domains. It must not copy proprietary scoring or infer API access from
Flow screens.

## Open evidence tasks

- Verify exact feature/device compatibility at connector launch.
- Capture missing-sleep, insufficient-baseline and test-failure states.
- Validate TRIMP, acute/chronic windows, sleep stages and autonomic recovery in
  the scientific phase.

