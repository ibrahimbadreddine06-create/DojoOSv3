# Widget umbrella specification — Recent Activities

Status: definitive information contract, variants pending  
Updated: 2026-07-25  
Umbrella ID: `activity.recent_activities`

## Identity

Question: **Which activities did I perform recently, and which one do I want
to inspect?**

Essential `1×1`: latest resolved session with type, time/duration, source state
and detail action.

## Data

Canonical activity sessions after deduplication. Garmin/Strava/HealthKit or
other representations of the same workout must resolve to one session with
retained provenance, not duplicate cards.

Sport-specific data may enrich an item, but this widget does not become the
session-detail surface.

## Variant directions

- latest-session focus;
- compact chronological list;
- visual activity strip.

Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`, with list depth increasing only
when the footprint supports it.

## Interaction/detail

Open session detail, correct classification/source resolution, and expose sync
or duplicate conflicts. Empty state points to connection/manual recording
without fabricating history.

