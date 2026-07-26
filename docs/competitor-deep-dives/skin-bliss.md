# Skin Bliss competitor deep dive

Status: Tier A hygiene/looks reconstruction, official product pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [Official product site](https://getskinbliss.com/)
- [Official App Store listing](https://apps.apple.com/us/app/skin-bliss-skincare-routines/id1385561364)
- [Business model disclosure](https://getskinbliss.com/blog/skin-bliss-how-we-make-money/)

Face-scan, compatibility, effectiveness and improvement claims are not accepted
as clinical validation. This pass records product behavior only.

## Product architecture

Skin Bliss combines:

- face scan and skin-profile output;
- routine templates and custom builder;
- product scheduling/rotation and layering;
- step-by-step Routine Player with timers;
- skin diary, symptoms, notes and mood;
- repeat photographs and AI comparison;
- ingredient/product compatibility;
- product/shelf scan, wishlist and expiration;
- weather/UV/humidity context;
- product search and comparison.

## Visual and interaction grammar

- Face-region scan/results.
- Routine timeline and ordered step player.
- Product cards with ingredient/compatibility state.
- Shelf composition and missing/duplicate warnings.
- Before/after photo comparison.
- Diary and progress timeline.
- Environmental context attached to a day/routine.

## Product lessons, not widget decisions

- Routine execution and skin observation must remain separable.
- Ingredient “clash” claims need exact evidence and concentration/context.
- Image comparison requires standardized lighting, angle and device caveats.
- AI outputs cannot diagnose acne, disease or treatment response.
- Templates accelerate setup but never limit custom routines.

## Remaining evidence tasks

- Validate every scan/output category and training/benchmark evidence.
- Capture routine-player, diary and photo-comparison states.
- Audit image privacy, on-device/server processing and deletion.
- Independently validate ingredient and expected-timeline claims.

