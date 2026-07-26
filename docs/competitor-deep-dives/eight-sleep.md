# Eight Sleep competitor deep dive

Status: Tier A rest/recovery reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Autopilot](https://www.eightsleep.com/autopilot/)
- [Sleep performance](https://www.eightsleep.com/sleep-performance/)
- [SleepOS](https://www.eightsleep.com/blog/introducing-sleepos/)

These are first-party product/marketing descriptions. Claims about improved
sleep, preventive monitoring or clinical testing require independent study and
regulatory verification before reuse.

## Product architecture

Eight Sleep couples a sensing mattress cover with an intervention system:

- presence, chest-vibration, heartbeat and respiration sensing;
- room temperature and humidity sensing;
- sleep timing and stage estimates;
- HRV, resting HR and respiratory-rate estimates;
- snoring detection;
- bilateral temperature control;
- automatic temperature changes across the night;
- elevation/snoring intervention on eligible hardware;
- thermal/vibration alarm;
- morning Sleep Fitness and health report;
- weekly reports and pattern insights.

## Calculations and semantics

Sleep Fitness is a proprietary 0–100 result relative to personal baselines.
The formula is not sufficiently disclosed for reproduction.

Autopilot considers age, biological sex, sleep stages, temperature preference,
environment and personal history. It learns from prior adjustments and user
feedback. Exact model weights and causal evidence are not public.

Bed sensors estimate physiological signals without a wearable. These outputs
remain device-derived estimates with hardware, occupancy and partner-isolation
constraints.

## Visual and interaction grammar

- Morning score with component report.
- Overnight temperature curve and adjustment history.
- Sleep-stage/timing composition.
- HRV/RHR/respiration trend cards.
- Time-of-day adaptive home cards.
- Large temperature dial before bed.
- Weekly sleep/health report.
- Snoring event and intervention state.

## Product lessons, not widget decisions

- A rest product can combine observation and environmental intervention.
- Two sleepers require explicit identity/side attribution.
- Automatic actions need an inspectable history and manual override.
- Provider scores stay provider-named.
- Pattern insights must distinguish association from intervention effect.
- Hardware/plan eligibility is part of every state.

## Remaining evidence tasks

- Verify exact Sleep Fitness components and versioning.
- Capture current app reports, temperature history and failure states.
- Audit two-person separation, absence detection and sensor confidence.
- Independently review validation studies and regulated Health Check claims.

