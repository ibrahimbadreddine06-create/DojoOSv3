# Nike Run Club competitor deep dive

Status: Tier A activity reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Getting Started](https://www.nike.com/help/a/nrc-start-run)
- [Training Plans](https://www.nike.com/help/a/nrc-plan)
- [Speed Runs](https://www.nike.com/help/a/nrc-speed-run/nrc-runs)
- [Running goals and tracked data](https://www.nike.com/a/running-goals)

## Product architecture

NRC combines:

- free, distance-, time- and speed-goal runs;
- phone and Apple Watch recording;
- GPS route, pace, distance, elevation, heart rate and splits;
- audio-guided runs;
- multi-week 5K, 10K, half-marathon and marathon plans;
- speed, long, easy and recovery run types;
- community challenges and cumulative progress;
- shoe mileage.

Training plans sequence runs and explain the purpose of each week/session.
Guided runs add coaching during execution rather than only after-the-fact
analytics.

## Session semantics

Speed repetitions and recoveries can be manually marked with laps. A user may
pause to exclude recovery from tracking. That distinction materially changes
pace and duration interpretation and must remain visible in historical data.

Height and weight can support estimates, but the user may choose defaults.
Location permission and motion/fitness permission directly determine data
availability.

## Visual and interaction grammar

- Large live run metrics with selectable readout.
- Map/route and split-focused post-run detail.
- Pace/distance/elevation/HR histories.
- Plan-week timeline with completed and upcoming runs.
- Audio guidance attached to a run type.
- Challenge progress and cumulative distance.
- Shoe-mileage progress.

## Product lessons, not widget decisions

- Execution and history must share the same canonical session.
- Lap/recovery inclusion rules affect every downstream metric.
- Run-plan context gives a completed session meaning beyond distance.
- Live, post-session and longitudinal views answer different questions.
- Route data requires location-specific privacy control.

## Remaining evidence tasks

- Capture every current run-detail and plan state on phone/watch.
- Verify auto-pause, indoor calibration and manual-edit semantics.
- Audit HR/split/elevation source priority and route correction.
- Map all failure, permission and interrupted-session states.

