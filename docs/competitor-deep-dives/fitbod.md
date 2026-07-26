# Fitbod competitor deep dive

Status: Tier A activity reconstruction, official evidence pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [How Fitbod Works](https://fitbod.zendesk.com/hc/en-us/sections/360001078993-Understanding-Fitbod-How-It-Works)
- [Feature Overview and Recovery](https://fitbod.zendesk.com/hc/en-us/sections/360012732693-Feature-Overview)
- [Fitness Experience](https://fitbod.zendesk.com/hc/en-us/articles/29976088485143)

Fitbod's mStrength and recommendation algorithms are proprietary. Official
descriptions reveal inputs and behavior, not reproducible equations.

## Product architecture

Fitbod generates sessions from:

- training history;
- goal and experience;
- available equipment;
- session duration;
- split and exercise variability;
- exercise preferences/exclusions;
- modelled muscle recovery;
- user changes to previous recommendations.

Recommendations include exercise order, sets, repetitions and weight. The user
can replace, reorder, add, delete or influence future frequency.

## Muscle recovery model

Each muscle group receives a 0–100% modelled recovery state from logged sets,
repetitions, load and exercise-muscle mapping. Official material describes full
recovery after approximately six days, modified by profile/experience and
workout context. Imported cardio can affect relevant muscle groups. Users can
manually override recovery.

This percentage is not a physiological sensor measurement and must not be
transplanted as a universal fact.

## Visual and interaction grammar

- Rotatable body avatar with muscle heat map.
- Tap a muscle for recovery and workout history.
- Generated workout presented as an editable exercise sequence.
- Sets/reps/load recommendations inside execution.
- Explicit “recommend more/less/exclude” controls.
- Equipment, duration and split as visible generation constraints.

## Product lessons, not widget decisions

- Generated plans must expose editable constraints and user agency.
- Recovery estimates require clear modelled provenance.
- Imported workouts need exercise-to-muscle mapping and uncertainty.
- Session duration can change exercise count without changing user goals.
- Feedback on replacements/deletions is useful only when its future impact is
  understandable.

## Remaining evidence tasks

- Reconstruct mStrength inputs and every recommendation state that is public.
- Capture generation, replacement, execution and completion flows.
- Validate recovery assumptions against sports-science evidence.
- Audit imported-workout mappings and manual override consequences.

