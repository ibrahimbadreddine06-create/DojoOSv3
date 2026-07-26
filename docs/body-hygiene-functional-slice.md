# Hygiene & Looks functional vertical slice

Status: product contract  
Updated: 2026-07-25

## Outcome

Hygiene & Looks is a flexible operational space for private routines and
observations. Templates accelerate setup but never define what users are
allowed to do.

## Core functional umbrella: Routines

Answers: **Which configured hygiene/looks routine or steps are due, and what
can I do now?**

It supports:

- private routine creation/editing;
- reusable templates/presets;
- stable routine steps;
- timed, day-bound and recurring schedules;
- start/check-off/complete/skip/reschedule;
- Planner reconciliation;
- optional typed Goal links;
- full routine and step history.

At `1×1`, show the relevant routine, state/progress and one primary action.
Larger sizes may reveal steps or more due routines.

## Existing hybrid umbrellas

- Cycle: opt-in logging/history under reproductive-data privacy.
- Skin Progress and Appearance Progress: private capture/history.
- Products: assignment, planned/actual use and notes.
- Symptoms: user-defined typed observation capture/history.

## Rejected umbrella

`Custom Tracker` is removed. “Anything custom” is not a stable product purpose.
Custom routines belong to Routines; custom observations use extensible typed
records and can be surfaced by the relevant observation widget.

This removal does not reduce freedom. **ALLES KAN.**

## Canonical separation

- routine definition;
- stable routine step definition;
- recurrence;
- dated occurrence;
- routine/step execution;
- product definition and assignment;
- actual product use;
- user-defined typed observation;
- attachment;
- optional goal link.

## Planner behavior

A generated occurrence may be timed or day-bound. Planner and Hygiene operate
on the same commitment/execution. Completing a routine updates the canonical
occurrence, not a second hygiene-only boolean.

## Current-code gaps

- `hygieneRoutines` combines definition, date, completion and streak;
- no step model exists;
- recurring definitions do not generate durable occurrences;
- current streak fields are mutable summaries without a canonical event basis;
- products and observations need first-class schema contracts;
- current setup/edit flow is not yet the authoritative E-language experience.

## Acceptance tests

1. A user can create any private routine and steps.
2. Editing a routine never rewrites completed history.
3. Timed/day-bound recurrence creates one occurrence.
4. Planner and Hygiene completion operate on the same execution.
5. Custom typed observations require no generic Custom Tracker widget.
6. Sensitive and reproductive records use appropriate consent/privacy.
7. Empty state offers creation without fabricated routines.
