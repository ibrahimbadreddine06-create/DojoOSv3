# Widget umbrella specification — Workout

Status: functional contract; evolves `activity.next_workout`  
Updated: 2026-07-25  
Umbrella ID: `activity.workout`

## Identity

Question: **What workout is relevant now, and can I build, plan, start or
continue it?**

Workout is a special activity composed of exercises. The stable identity is the
workout lifecycle, not only whichever workout happens to be next.

Essential `1×1`: planned/current workout identity, state and primary action. If
none exists, a purposeful choose/build action replaces fake content.

## Canonical records

- workout definition/preset where used;
- ordered exercises and intended sets;
- optional planner commitment;
- actual workout execution;
- exercise/set execution records;
- device streams and manual observations;
- primary and secondary muscle relationships;
- optional typed goal links.

Planned values and actual values remain separate and reconcilable.

## Interaction

Build, plan, start, continue, complete, skip, reschedule or inspect according to
state. Active execution opens the authoritative workout session surface with
exercise/set controls.

## Variants and sizes

Initial variant families:

- next/current workout focus;
- workout outline;
- workout execution progress.

Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Larger sizes may show the next exercises, completed sets, timer/rest state or
session outline. Essential identity/state/action remain present.

## Required states

No workout, draft, scheduled, available, in progress, resting, paused,
completed, partial, skipped, rescheduled, plan/execution conflict, offline and
error.

## Detail/history

Workout detail exposes the full plan and execution history. Every exercise and
muscle reference routes to its own authoritative history.

