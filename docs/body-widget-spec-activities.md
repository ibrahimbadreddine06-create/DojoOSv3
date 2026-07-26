# Widget umbrella specification — Activities

Status: functional contract  
Updated: 2026-07-25  
Umbrella ID: `activity.activities`

## Identity

Question: **Which activity do I want to plan, start or continue?**

This widget covers bodily output activities that are not required to be formal
workouts. The catalogue is extensible and supports private user-created
activities.

Essential `1×1`: the relevant planned/current activity or a direct,
context-aware choose/start action.

## Canonical records

- selected activity definition;
- optional planner commitment;
- optional active/completed execution;
- device/manual observations linked to that execution;
- optional typed goal links.

A spontaneous execution never fabricates a prior plan. A detected wearable
session may be reconciled with a commitment after confirmation.

## Interaction

The widget can choose, plan, start, continue, complete or inspect an activity
according to current state. Full catalogue management and detailed editing open
the authoritative activity surface.

## Variants and sizes

Initial variant families:

- next/current activity focus;
- compact activity launcher;
- today's activity queue.

Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Larger sizes may reveal more due activities, duration/context or recent choices.
They do not turn the widget into a generic Daily Planner.

## Required states

Empty, unconfigured catalogue, scheduled, available, in progress, paused where
supported, completed, partial, skipped, rescheduled, conflict, stale provider,
offline and error.

## Detail/history

Each activity execution opens a complete activity detail/history destination
with plan reconciliation, provenance and all compatible observations.

