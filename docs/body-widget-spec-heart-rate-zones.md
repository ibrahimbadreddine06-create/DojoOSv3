# Widget umbrella specification — Heart Rate Zones

Status: conditional information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.heart_rate_zones`

## Identity

Question: **How was covered exercise time distributed under my selected
heart-rate zone model?**

Essential `1×1`: zone distribution, model identity and HR coverage.

## Calculation

Deterministically assign valid HR samples to named/versioned thresholds.
Required profile inputs and override history are retained. Provider-supplied
zones remain provider-owned if thresholds cannot be reproduced.

## Truth

No universal five-zone truth. Age-predicted HRmax cannot look measured.
Missing HR samples are not low-intensity time.

## Variant directions

- duration composition;
- intensity timeline;
- session comparison under the same model.

Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Detail includes thresholds, model explanation, source/coverage, sessions and
zone history.

