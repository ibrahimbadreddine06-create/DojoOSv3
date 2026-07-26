# Rest & Recovery Tier B — targeted evidence pass

Status: partial Tier B pass; Sleep Cycle and Pillow need stronger current evidence  
Updated: 2026-07-25

## Evidence boundary

This pass records current first-party product behavior. Vendor accuracy and
efficacy claims remain unverified until the cited validation studies and
methods are independently audited.

## AutoSleep

- Sleep is visualized through clock/ring progress against a personal duration
  goal.
- Sleep Bank distinguishes credit and debt and informs a latest suggested
  bedtime.
- Daily Readiness combines waking pulse and HRV into a descriptive state.
- Today uses independently tappable tiles; dense widgets can combine Sleep,
  Sleep Bank, Sleep Rings, Sleep Fuel and Readiness.
- Apple sleep stages may be imported as a separate mode rather than silently
  treated as AutoSleep's own inference.

Distinctive lesson: source/method identity needs to remain visible when the
same conceptual sleep fact can be calculated by different systems.

## SleepScore

- Phone sonar uses speaker/microphone reflections to infer breathing and body
  movement without a wearable.
- The 0–100 score is paired with stage duration, latency, awakenings and age/
  gender comparison.
- The product separates tracking, score, personalized improvement guidance,
  history and a shareable report.
- Imported wearable sleep can be shown, but first-party documentation states
  that imported data and SleepScore's own captured data do not necessarily
  receive identical coaching or average treatment.

Distinctive lesson: manual/non-wearable fallback is not semantically
interchangeable with wearable/provider data; provenance and capability state
must be explicit.

## Cross-product evidence produced

- Duration goal progress, debt/credit, stage architecture, readiness and smart
  wake are distinct product questions.
- A sleep score must never hide the observation method.
- “Same metric name” does not guarantee comparable source, algorithm or use in
  downstream calculations.
- Compact widgets can aggregate states, while the detail page must retain
  source and calculation traceability.

These are research dimensions, not proposed Body umbrellas.

## Remaining Tier B work

- Current Sleep Cycle product reconstruction.
- Current Pillow product reconstruction.
- Direct capture of AutoSleep and SleepScore surfaces.
- Independent audit of sonar/staging validation and applicable population.
- Exact calculation windows, weights and missing-data behavior.

## First-party sources

- https://autosleepapp.tantsissa.com/home/overview
- https://autosleepapp.tantsissa.com/user-guide
- https://autosleepapp.tantsissa.com/faq/whats-new
- https://www.sleepscore.com/sleepscore-app
- https://support.sleepscore.com/hc/en-us/sections/7714925991316-About-the-SleepScore-App
- https://www.sleepscore.com/bring-your-own-data-faqs/
