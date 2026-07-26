# Widget umbrella specification — Log Intake

Status: functional contract  
Updated: 2026-07-25  
Umbrella ID: `nutrition.log_intake`

## Identity

Question: **What entered my body, and how can I record it accurately now?**

Essential `1×1`: a context-aware capture action plus the current draft/pending
state when one exists.

## Canonical records

Consumed intake is distinct from planned intake. Every entry preserves time,
quantity, source/provenance, completeness and optional links to a plan, meal,
routine, attachment or goal.

Manual entry, recent/repeat, search, barcode, description and future photo
assistance are capture methods inside this umbrella. They are not separate
widget identities.

## Interaction

Start, continue or cancel a draft; select a capture method; confirm, edit,
reuse or remove an intake record. Assisted results always require review and
retain their provenance.

## Variants and sizes

Initial variant families:

- immediate capture;
- recent/repeat capture;
- active draft.

Initial sizes: `1×1`, `1×2`, `2×1`.

Larger sizes may reveal recent items or multiple capture paths without becoming
a menu dump.

## Required states

Ready, draft, searching, analysing, review required, saved, incomplete,
offline, permission denied, conflict and error.

## Detail/history

Saved records open intake detail; the umbrella's detail destination exposes the
complete intake timeline and coverage semantics.

