# Widget umbrella specification — Meal Plan

Status: functional contract  
Updated: 2026-07-25  
Umbrella ID: `nutrition.meal_plan`

## Identity

Question: **What intake have I planned, and what should happen with it now?**

Essential `1×1`: next/relevant planned intake, schedule state and primary
action.

## Canonical records

A planned intake is a commitment, never a consumed intake log. It may be
time-bound, day-bound, recurring or unscheduled. Consumption creates or links
an execution/intake record and reconciles it with the plan.

## Interaction

Create, choose, reschedule, replace, mark skipped or record what was actually
consumed. Presets can accelerate planning but never become false completed
records.

## Variants and sizes

Initial variant families:

- next planned intake;
- compact day plan;
- plan-versus-actual composition.

Initial sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Larger sizes may expose more planned items or reconciliation state while using
the same canonical Planner commitments.

## Required states

Empty, draft, scheduled, due, consumed as planned, changed, partial, skipped,
overdue, conflict, offline and error.

## Detail/history

The detail destination exposes the intake plan, reusable presets and
plan-versus-actual history without duplicating the Daily Planner.
