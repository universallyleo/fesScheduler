# Shared Event Conflict Exemption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let explicitly grouped simultaneous event copies avoid cross-lane artist warnings without hiding real occupancy conflicts.

**Architecture:** `ScheduleItem.sharedEventGroupId` carries the persisted grouping. The pure scheduler conflict detector applies the exemption, and `ItemTreePicker` provides the shared lane → booth → item selection UI for `関連するイベント` and `同時開催グループ`. The item editor controller resolves that selected membership on save.

**Tech Stack:** Svelte 5, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-26-shared-event-conflicts-design.md`

## Global Constraints

- Suppress only cross-lane `sameArtist` warnings when both values are the same non-empty group ID.
- Never suppress same-lane or same-booth occupancy warnings.
- Existing timetable files without the property remain valid.
- UI labels remain Japanese.

## Review Focus

- Whitespace-only group IDs must behave as empty values.
- Two events with identical labels but different or absent groups must still warn.
- Same-group items in the same booth must still produce a lane warning.
- Newly created, duplicated, repeated, and related items must retain or deliberately clear the property consistently.

### Task 1: Persisted field and pure conflict rule

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/scheduler.ts`, `src/lib/scheduler.test.ts`

**Interfaces:**
- Produces: optional `ScheduleItem.sharedEventGroupId?: string`.
- Produces: `detectConflicts(items)` suppression of `sameArtist` only for matching non-empty group IDs.

- [x] Write and observe a failing conflict test for matching groups, distinct groups, and same-lane occupancy.
- [x] Add the optional type field and conflict predicate.
- [x] Run `bun run test:unit -- --run src/lib/scheduler.test.ts`.

### Task 2: Item-picker editor and item creation consistency

**Files:**
- Add: `src/lib/components/ItemTreePicker.svelte`
- Modify: `src/lib/features/scheduler/item-editor-controller.svelte.ts`, `src/lib/features/scheduler/item-editor-controller.test.ts`, `src/lib/components/modals/ItemEditorModal.svelte`, `src/routes/+page.svelte`

**Interfaces:**
- Consumes: selected existing schedule-item IDs and the current item's saved group.
- Produces: a `同時開催グループ` picker whose checked items become the current item's exact group membership on save.

- [x] Extract the reusable lane → booth → item picker and use it for both existing related events and simultaneous-event selection.
- [x] Thread the selected IDs through the page and modal. On save, checked items move into the current item's group; unchecked former members leave it.
- [x] Add a controller regression test for exact saved group membership.
- [x] Confirm new and duplicate items remain ungrouped because their explicit construction omits the field; repeated entries inherit their saved draft by design.
- [x] Run the focused controller/conflict tests and the Svelte type check.

### Task 3: Documentation and verification

**Files:**
- Modify: `README.md` if its data-format section lists item fields; `docs/superpowers/specs/2026-10-26-shared-event-conflicts-design.md`

- [x] Record the persisted field and warning rule in the dedicated design spec; README has no data-format section to update.
- [x] Run `bun run test:unit -- --run`, `bun run check`, `bun run build`, and `git diff --check`.
