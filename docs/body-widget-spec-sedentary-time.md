# Widget umbrella specification — Sedentary Time

Status: definitive information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.sedentary_time`

## Identity

Question: **How much covered waking time was classified as sedentary?**

Essential `1×1`: classified duration, period and valid-coverage qualification.

## Data and calculation

- Input: provider sedentary/inactivity intervals, awake window and non-wear.
- Sum only eligible classified intervals inside covered waking time.
- Non-wear, permission gaps and unsynced periods remain missing.
- A provider-specific classification stays namespaced when its semantics differ.

## Truth

Allowed: “Device-classified sedentary time”.

Forbidden: calling non-wear sedentary, inferring sitting solely from low steps,
or presenting one universal safe maximum.

## Variant directions

- duration-first;
- waking-day distribution;
- interruption/break pattern when the source actually supplies it.

## Sizes and detail

Initial: `1×1`, `1×2`, `2×1`, `2×2`.

Detail shows coverage, classified intervals, breaks, source/method and history.
Manual fallback may record a subjective sitting estimate but never impersonates
continuous sensor classification.

