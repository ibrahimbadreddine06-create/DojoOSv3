# Body widget catalogue v2

Status: research-selected plus functional gate v1  
Updated: 2026-07-25  
Canonical machine source: `body-widget-umbrella-registry.json`

## Reading rule

Every row is an actual independently installable widget umbrella. There is no
grouping layer between Body submodule and these rows.

“Informational,” “functional” and “hybrid” describe primary behavior only.
They do not constrain what a widget may contain. **ALLES KAN.**

## Hub — 8

| Umbrella | Primary role |
|---|---|
| Today | hybrid cross-domain attention/action |
| Body Timeline | information/navigation |
| Data Coverage | system/repair action |
| Heart Rate | information |
| Weight | information/manual measurement |
| Body Composition | information/manual measurement |
| Blood Pressure | conditional sensitive information/manual measurement |
| Blood Glucose | conditional sensitive information/manual measurement |

## Activity — 13

| Umbrella | Primary role |
|---|---|
| Steps | information |
| Active Minutes | information |
| Sedentary Time | conditional information |
| Distance | information |
| Active Energy | provider result |
| Floors Climbed | conditional information |
| Activities | functional |
| Recent Activities | information/navigation |
| Training Load | method-dependent information |
| Heart Rate Zones | model-dependent information |
| Cardio Fitness | measured/provider information |
| Strength Progress | information/navigation |
| Workout | functional |

`Workout` evolves the former `Next Workout`; the old ID is a migration alias.
Exercise and muscle detail/history are mandatory destinations but are not yet
approved as independent umbrellas.

## Nutrition — 12

| Umbrella | Primary role |
|---|---|
| Log Intake | functional |
| Meal Plan | functional |
| Calories | information |
| Macronutrients | information |
| Fiber | information |
| Micronutrients | information |
| Water Intake | hybrid |
| Recent Meals | information/navigation |
| Caffeine | optional hybrid |
| Alcohol | opt-in sensitive hybrid |
| Supplements | hybrid |
| Fasting | optional hybrid |

Capture methods such as search, barcode, description, recent/repeat and future
photo assistance belong to `Log Intake`; they are not separate umbrellas.

## Rest & Recovery — 15

| Umbrella | Primary role |
|---|---|
| Last Sleep | hybrid |
| Sleep Duration | information |
| Sleep Schedule | hybrid |
| Sleep Stages | provider result |
| Sleep Efficiency | calculated/provider information |
| Sleep Debt | research-gated information |
| Recovery | provider/manual information |
| HRV | information |
| Resting Heart Rate | information |
| Respiratory Rate | conditional information |
| Skin Temperature | conditional information |
| Blood Oxygen | conditional information |
| Physiological Stress | provider result |
| Perceived Stress | manual hybrid |
| Naps | optional hybrid |

`Rest Plan` remains an open gate because it may duplicate Sleep Schedule, Naps
and specific restorative actions. No umbrella is added merely for symmetry.

## Hygiene & Looks — 7

| Umbrella | Primary role |
|---|---|
| Routines | functional/hybrid |
| Routine Consistency | information |
| Cycle | opt-in hybrid |
| Skin Progress | private hybrid |
| Appearance Progress | private hybrid |
| Products | hybrid |
| Symptoms | user-defined sensitive hybrid |

`Custom Tracker` is removed. The system remains fully extensible through
user-defined routines and typed observations; a generic escape-hatch label is
not a product identity.

## Total

55 widget umbrellas:

- 8 Hub;
- 13 Activity;
- 12 Nutrition;
- 15 Rest & Recovery;
- 7 Hygiene & Looks.

Each umbrella has exactly one current specification. Variants and supported
sizes remain below the umbrella layer and are validated separately before
implementation.
