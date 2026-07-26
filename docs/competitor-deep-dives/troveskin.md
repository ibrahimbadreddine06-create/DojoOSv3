# TroveSkin competitor deep dive

Status: Tier A hygiene/looks reconstruction, official product pass  
Verified: 2026-07-25

## Evidence boundary

Primary official evidence:

- [TroveSkin product site](https://www.troveskin.com/)

The current public site describes functionality but does not disclose enough
technical evidence to validate automated trigger or skin-change inference.
Claims remain product claims until independently tested.

## Product architecture

TroveSkin combines:

- skincare product inventory;
- routine execution/logging;
- product expiration, ingredients, spending and notes;
- lifestyle, mood, diet and stress records;
- multi-angle facial photography;
- region-specific photo comparison;
- longitudinal skin diary.

Its product question is not limited to compliance. It tries to connect routine,
product and lifestyle records with user-observed skin change.

## Visual and interaction grammar

- Daily routine checklist/log.
- Product shelf with expiry and notes.
- Consistent-angle photo capture.
- Side-by-side progress comparison.
- Facial-region navigation for forehead, nose and cheeks.
- Timeline combining products, habits and observations.

## Product lessons, not widget decisions

- Photos require capture-condition guidance and private storage.
- Product use, routine completion and skin observation are separate facts.
- “Trigger” discovery is observational and must not imply causality.
- Everything must remain user-extensible because routines and concerns vary.
- Product expiry/spending can be useful without becoming health claims.

## Remaining evidence tasks

- Obtain current in-app captures and full feature/subscription inventory.
- Verify whether any automated analysis is active and how it is validated.
- Audit photo processing, retention, export and deletion.
- Test timeline alignment and minimum evidence for claimed patterns.

