# Body functional widget gate

Status: product audit in progress  
Updated: 2026-07-25  
Depends on: `body-functional-widget-architecture.md`

## Purpose

This gate prevents two opposite mistakes:

1. treating every widget as a passive metric card;
2. inventing a separate widget for every button, entity or workflow.

The 53 research-selected umbrellas remain the starting set. This audit marks
where an existing umbrella can own the required operation and where a durable
functional concept is genuinely missing.

## Existing-set audit

### Hub

| Umbrella | Role | Functional consequence |
|---|---|---|
| Today | hybrid | May expose the most relevant next action, but each item remains owned by its source subject. |
| Body Timeline | informational/navigation | Opens canonical events; editing occurs through the owning flow. |
| Data Coverage | hybrid/system | Repair/reconnect/permission actions belong here. |
| Heart Rate | informational | Detail/history; no invented action. |
| Weight | informational/manual capture | A concise “record measurement” action may belong inside this umbrella. |
| Body Composition | informational/manual capture | Same rule as Weight when manual measurement is supported. |
| Blood Pressure | informational/manual capture | Measurement protocol and sensitive state required. |
| Blood Glucose | informational/manual capture | Source/intended-use boundaries required. |

No new Hub umbrella is approved yet. A generic quick-capture widget remains a
candidate, not an automatic requirement.

### Activity

| Umbrella | Role | Functional consequence |
|---|---|---|
| Steps | informational | Detail/history only. |
| Active Minutes | informational | Detail/history only. |
| Sedentary Time | informational | Optional contextual action may link to a movement commitment. |
| Distance | informational | Detail/history only. |
| Active Energy | informational | Detail/history only. |
| Floors Climbed | informational | Detail/history only. |
| Recent Activities | informational/navigation | Every session opens authoritative activity detail. |
| Training Load | informational | Never doubles as session execution. |
| Heart Rate Zones | informational | Model/settings may be changed through detail. |
| Cardio Fitness | informational | Detail/history only. |
| Strength Progress | informational/navigation | Must navigate into exercise and muscle histories. |
| Next Workout | functional but too narrowly named | Owns planned/current workout action; candidate rename to `Workout`. |

Missing durable operations:

- all non-workout activities need selection, planning, starting and
  reconciliation;
- workout building/execution must not be hidden behind one “next” record;
- exercise and muscle histories need authoritative destinations, but do not
  automatically require separate widgets.

Candidate gate:

| Candidate | Decision | Reason |
|---|---|---|
| Activities | approve in principle | Independently useful launcher/plan for all activity types, including custom and spontaneous activities. |
| Workout | approve by evolving `Next Workout` | Stable identity is the workout lifecycle, not only whichever workout is next. |
| Exercises | defer as umbrella | Required library/detail/history, but the widget-level independent value is not yet proven beyond Strength Progress/Workout. |
| Muscles | defer as umbrella | Required selectable detail/history; widget value needs a dedicated composition gate. |

### Nutrition

| Umbrella | Role | Functional consequence |
|---|---|---|
| Calories | informational | Logging access may be local but Calories is not the capture system. |
| Macronutrients | informational | Same. |
| Fiber | informational | Same. |
| Micronutrients | informational | Same. |
| Water Intake | hybrid | Quick add/edit water is integral to this widget. |
| Recent Meals | informational/navigation | Reuse/edit/detail actions are integral. |
| Caffeine | hybrid | Quick record belongs inside the umbrella. |
| Alcohol | hybrid/opt-in | Quick record belongs inside the opt-in umbrella. |
| Supplements | hybrid | Due/taken state and action share canonical intake-routine records. |
| Fasting | hybrid | Start/end/cancel and current session state are integral. |

Missing durable operations:

| Candidate | Decision | Reason |
|---|---|---|
| Log Intake | approve in principle | Intake capture is a stable, independent operation spanning food/drink/manual/search/barcode/reuse and future assistance. |
| Meal Plan | approve in principle | Planned intake is distinct from consumed intake and must be independently manageable. |
| Food Search | reject as umbrella | It is a capture method/destination within Log Intake. |
| Barcode / Photo | reject as umbrellas | They are capture methods, not stable widget identities. |

### Rest & Recovery

| Umbrella | Role | Functional consequence |
|---|---|---|
| Last Sleep | hybrid | Manual record/edit and observed-session detail may live here. |
| Sleep Duration | informational | No separate execution. |
| Sleep Schedule | hybrid | Planning/adjusting a sleep window can be integral. |
| Sleep Stages | informational | Detail/history only. |
| Sleep Efficiency | informational | Detail/history only. |
| Sleep Debt | informational/research-gated | No action implied by the score. |
| Recovery | informational | Provider/manual meaning remains explicit. |
| HRV | informational | Detail/history only. |
| Resting Heart Rate | informational | Detail/history only. |
| Respiratory Rate | informational | Detail/history only. |
| Skin Temperature | informational | Detail/history only. |
| Blood Oxygen | informational | Detail/history only. |
| Physiological Stress | informational | Detail/history only. |
| Perceived Stress | hybrid/manual | Check-in belongs inside the umbrella. |
| Naps | hybrid | Record/planned nap actions may be integral. |

Candidate `Rest Plan`: hold for a composition test. If Sleep Schedule, Naps and
specific restorative activities can each own their operations cleanly, another
generic plan widget would duplicate them. It is approved only if it provides a
distinct cross-rest operational value.

### Hygiene & Looks

| Umbrella | Role | Functional consequence |
|---|---|---|
| Routines | functional/hybrid | Core create/schedule/execute/check-off/reconcile surface. |
| Routine Consistency | informational | Opens routine history. |
| Cycle | hybrid/opt-in | Logging and history are integral. |
| Skin Progress | hybrid/manual | Private record/capture and history are integral. |
| Appearance Progress | hybrid/manual | Private record/capture and history are integral. |
| Products | hybrid | Product assignment/use/notes may be operated here. |
| Symptoms | hybrid/manual | User-defined observation capture and history are integral. |
| Custom Tracker | rejected and removed | Generic “anything custom” is not a stable purpose; it overlaps Routines and extensible observations. |

Routine templates, routine builder and product selector are workflows, not
automatically widgets.

## Applied catalogue delta

Changes applied to the registry after the functional gate:

1. Evolve `activity.next_workout` into the stable `activity.workout` identity,
   preserving the previous ID as a migration alias.
2. Add `activity.activities`.
3. Add `nutrition.log_intake`.
4. Add `nutrition.meal_plan`.
5. Remove `hygiene.custom_tracker` from the product catalogue while retaining
   extensible user-defined routines and observations in the data model.

`Rest Plan`, `Exercises`, `Muscles` and Hub quick capture remain explicit open
gates. “Not yet an umbrella” does not mean their required capabilities or
destinations are removed.

## Next gate

For every approved delta, write a full umbrella specification covering:

- stable user question;
- canonical entities and links;
- `1×1` essential operation;
- variants and supported sizes;
- planner and goal behavior;
- planned/actual reconciliation;
- detail/history route;
- empty, stale, conflict, offline and permission states;
- manual and wearable paths;
- E design-language composition requirements.
