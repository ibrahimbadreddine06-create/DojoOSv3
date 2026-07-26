# Widget umbrella specification — Active Minutes

Status: definitive information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.active_minutes`

## Identity

Question: **How much recorded activity met the declared intensity method?**

Essential `1×1`: duration, period, classification method and coverage state.

## Data and calculation

- Input: non-overlapping activity/intensity intervals.
- Preserve provider classification and original labels.
- Aggregate only intervals produced under a compatible named method.
- A Body HR-zone-derived duration uses its own versioned method.
- Provider “active”, “moderate” and “zone” minutes are not automatically equal.

## States

No source, awaiting data, valid, partial wear, stale, permission lost,
unsupported method, method conflict, delayed and error.

## Truth

Allowed: “Device-classified active minutes” or “Minutes in [named model]”.

Forbidden: claiming every provider minute is guideline-equivalent, treating
missing wear as inactivity, or converting steps into intensity minutes.

## Variant directions

- total/progress;
- intensity distribution;
- time-of-day pattern.

They remain variants of Active Minutes. Every variant must make the method
available locally and in detail.

## Sizes

Initial: `1×1`, `1×2`, `2×1`, `2×2`.

Larger sizes may add intensity split, coverage and comparable history while
retaining duration, method and state.

## Detail

History, classified intervals, method/threshold explanation, valid-wear
coverage, source changes and corrections.

