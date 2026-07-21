# DojoOS Body Module — Ultimate Redesign Plan

## Philosophy
- Unrivaled Wearable Integration. Every KPI maximizes high-fidelity continuous biometric data (HRV, HR, Temp, EEG stage proxies) from premier wearables (Apple Health, Oura, Whoop, Garmin). Manual logging is only bridging the gap for qualitative feedback.
- Top-down visual identity per widget: objects lying flat on a surface, depth via shadows/grooves/layering. NO tilts, NO rotation, NO 3D angles.
- One MD file per widget, evolves through all phases.
- Unified KPIs: if A feeds B, same calculation, not two disconnected formulas.
- Widget existence is questioned for every single one.

## Process Per Widget
1. **Existence rethink** — does it need to exist? Merge with another? Kill?
2. **KPI definition** — what exactly is this measuring?
3. **Calculation** — wearable-free formula, unified with dependents
4. **Display** — what shows at each size (primary number, secondary info, label, trend)
5. **Size variants** — Square, Horizontal 2:1, Vertical 1:2, Elongated (3×1 or 1×3), widget-specific if needed
6. **Visual identity** — unique 3D-esque top-down object concept, materials, colors, depth cues

## Report Phases
- **Report 1**: Sections 1–5 complete, visual identity TBD → user feedback
- **Report 2 / Final**: Section 6 added, full coherent document → user approval → build

## What Gets Skipped
- AI Briefing — no full process
- Today's Sessions — no full process
- Fully-working fixed widgets with no rethink needed — minimal process

## Size Variant Definitions
| Variant | Grid ratio | Notes |
|---|---|---|
| Square | 1×1, 2×2, etc. | Any square ratio |
| Horizontal | 2:1 (wide) | e.g., 2×1 cells |
| Vertical | 1:2 (tall) | e.g., 1×2 cells |
| Elongated H | 3:1+ | Banner-style |
| Elongated V | 1:3+ | Tower-style |
| Widget-specific | Custom | Defined per widget if needed |

---

## Widget Registry

### HUB PAGE (body-hub.tsx)
| # | Widget | File | Status |
|---|---|---|---|
| 1 | Recovery Score | hub/recovery-score.md | 🔲 |
| 2 | Overall Readiness | hub/overall-readiness.md | 🔲 |
| 3 | Energy Bank | hub/energy-bank.md | 🔲 |
| 4 | Today's Focus | hub/todays-focus.md | 🔲 |
| 5 | Body Composition | hub/body-composition.md | 🔲 |
| 6 | Nervous Stress | hub/nervous-stress.md | 🔲 |
| 7 | Hormone Signals | hub/hormone-signals.md | 🔲 |
| 8 | Hydration Status | hub/hydration-status.md | 🔲 |
| 9 | Body Map | hub/body-map.md | 🔲 |
| 10 | Weekly Snapshot | hub/weekly-snapshot.md | 🔲 |
| 11 | Quick Log | hub/quick-log.md | 🔲 |
| 12 | AI Briefing | hub/ai-briefing.md | ⏭ skip |
| 13 | Today's Sessions | hub/todays-sessions.md | ⏭ skip |

### SLEEP PAGE (rest-page.tsx)
| # | Widget | File | Status |
|---|---|---|---|
| 14 | Rest Score | sleep/rest-score.md | 🔲 |
| 15 | Sleep Duration | sleep/sleep-duration.md | 🔲 |
| 16 | Sleep Quality | sleep/sleep-quality.md | 🔲 |
| 17 | Sleep Consistency | sleep/sleep-consistency.md | 🔲 |
| 18 | Sleep Timing | sleep/sleep-timing.md | 🔲 |
| 19 | Sleep Debt | sleep/sleep-debt.md | 🔲 |
| 20 | REM / Deep | sleep/rem-deep.md | 🔲 |
| 21 | Focus Capacity | sleep/focus-capacity.md | 🔲 |
| 22 | Workout Readiness | sleep/workout-readiness.md | 🔲 |
| 23 | Energy Dip | sleep/energy-dip.md | 🔲 |
| 24 | Nap Recommendation | sleep/nap-recommendation.md | 🔲 |
| 25 | Tonight's Rhythm | sleep/tonights-rhythm.md | 🔲 |
| 26 | Rest Chronology | sleep/rest-chronology.md | 🔲 |

### ACTIVITY PAGE (activity-page.tsx)
| # | Widget | File | Status |
|---|---|---|---|
| 27 | Effort Score | activity/effort-score.md | 🔲 |
| 28 | Energy Ring | activity/energy-ring.md | 🔲 |
| 29 | Recovery Ring (activity) | activity/recovery-ring-activity.md | 🔲 |
| 30 | Active Time | activity/active-time.md | 🔲 |
| 31 | Steps | activity/steps.md | 🔲 |
| 32 | Distance | activity/distance.md | 🔲 |
| 33 | Weekly Effort Gauge | activity/weekly-effort-gauge.md | 🔲 |
| 34 | Exercises & Muscles | activity/exercises-muscles.md | 🔲 |
| 35 | HR Zones | activity/hr-zones.md | 🔲 |
| 36 | Activity Log Calendar | activity/activity-log-calendar.md | 🔲 |
| 37 | ACWR | activity/acwr.md | 🔲 |
| 38 | Volume Landmarks | activity/volume-landmarks.md | 🔲 |
| 39 | e1RM Tracker | activity/e1rm-tracker.md | 🔲 |

### NUTRITION PAGE (nutrition-page.tsx)
| # | Widget | File | Status |
|---|---|---|---|
| 40 | Calorie Ring | nutrition/calorie-ring.md | 🔲 |
| 41 | Protein Ring | nutrition/protein-ring.md | 🔲 |
| 42 | Water Ring | nutrition/water-ring.md | 🔲 |
| 43 | Carbs Card | nutrition/carbs-card.md | 🔲 |
| 44 | Fat Card | nutrition/fat-card.md | 🔲 |
| 45 | Fiber Card | nutrition/fiber-card.md | 🔲 |
| 46 | Fuel Quality Score | nutrition/fuel-quality-score.md | 🔲 |
| 47 | Whole Food Ratio | nutrition/whole-food-ratio.md | 🔲 |
| 48 | Meal Timing | nutrition/meal-timing.md | 🔲 |
| 49 | Eating Window | nutrition/eating-window.md | 🔲 |
| 50 | Micronutrients | nutrition/micronutrients.md | 🔲 |
| 51 | Energy Availability | nutrition/energy-availability.md | 🔲 |
| 52 | Fasting | nutrition/fasting.md | 🔲 |
| 53 | Intake Routines | nutrition/intake-routines.md | 🔲 |

### HYGIENE PAGE (hygiene-page.tsx)
| # | Widget | File | Status |
|---|---|---|---|
| 54 | Upkeep Score | hygiene/upkeep-score.md | 🔲 |
| 55 | Discipline Rate | hygiene/discipline-rate.md | 🔲 |
| 56 | Glow-up Direction | hygiene/glowup-direction.md | 🔲 |
| 57 | Routine Cards | hygiene/routine-cards.md | 🔲 |
| 58 | Cross-Body Signals | hygiene/cross-body-signals.md | 🔲 |

---

## Calculation Unification Map
```
Sleep Score (once)
  → feeds: Recovery Score (35%), Overall Readiness (25%), Rest Score (primary), Workout Readiness

Recovery Score (once)
  → feeds: Overall Readiness (30%), Energy Bank, body-hub display

Training Load / ACWR (once)
  → feeds: Recovery Score (20% load freshness), Effort Score, Weekly Effort Gauge, Energy Bank

Nutrition Score (once)
  → feeds: Recovery Score (10%), Overall Readiness (10%), Energy Availability

Stress Score (once)
  → feeds: Overall Readiness (20% inverse), Nervous Stress widget

Habit/Consistency Score (once)
  → feeds: Overall Readiness (10%), Discipline Rate, Upkeep Score
```

## Key Calculation Methods
- **Session Load**: RPE × Duration (minutes) — Foster RPE Method
- **ACWR**: 7-day sum / (28-day sum ÷ 4), sweet spot 0.8–1.3
- **Sleep Score (no wearable)**: Duration 40%, Quality 35%, Consistency 15%, Timing 10%
- **Recovery Score (no wearable)**: Sleep 35%, Soreness inverse 25%, Energy 20%, Load Freshness 20%
- **Overall Readiness**: Recovery 30%, Sleep 25%, Stress inverse 20%, Nutrition 10%, Consistency 10%, Hydration 5%
- **e1RM**: Epley — Weight × (1 + Reps/30)
- **Volume Landmarks (RP Strength)**: MV ~6, MEV 8–10, MAV 12–20, MRV 18–25+ sets/muscle/week
- **Habit EMA**: momentum = yesterday × 0.9 + (done ? 10 : 0)
- **BMR**: Mifflin-St Jeor
- **Energy Availability**: (EI − EEE) / FFM, optimal ≥45 kcal/kg/day, RED-S risk <30

## Visual Identity Rules
- Top-down camera: object lies flat on the card surface
- Depth via: drop shadows, inset grooves, layered materials, z-offset via CSS
- NO 3D tilts, NO rotating animations, NO angled perspectives
- Each widget has a UNIQUE object metaphor (not just "a ring on all of them")
- Materials: matte, brushed metal, ceramic, rubber — communicated via CSS/SVG, not Three.js
- Colors: widget-specific accent over dark card background
