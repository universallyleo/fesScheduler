# Five-minute Repetition and Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scheduler editing consistently five-minute based, add compact repeated-item creation, and improve edit-mode placement and item dragging.

**Architecture:** Keep repeat scheduling and shared-opening calculations as pure scheduler modules with unit tests. Keep the reusable time increment control visual and stateless; modal/controller code owns editable state and persistence. The route remains composition-only: controls and grid controllers receive callbacks rather than duplicating scheduling logic.

**Tech Stack:** Svelte 5, TypeScript, Vitest, SvelteKit.

**Spec:** User request in this conversation (2026-10-10).

## Global Constraints

- Use Japanese copy for web-app controls.
- Snap and duration increments are fixed at 5 minutes.
- All time increment controls clamp to 30:00 (1,800 minutes), never wrap.
- Repetition must not create an item ending later than 24:00 (1,440 minutes).
- Repeat names accept `/` and `／`, trim names, and repeat the final supplied name.
- Do not run browser E2E tests unless the user asks.

## Review Focus

- Partial lane opening times leave the existing timetable start unchanged; all lanes set chooses the earliest opening.
- A repeated schedule that ends exactly at 24:00 is accepted, one minute later is excluded.
- Empty or whitespace-only repeat-name segments use the normal draft name rather than creating blank cards.
- Dragging an item captures the pointer so a drag does not become a favorite click or stop outside the card.
- Time controls cannot step below 00:00 or above 30:00.

---

### Task 1: Pure timing and repetition rules

**Files:**
- Modify: `src/lib/scheduler.ts`
- Modify: `src/lib/scheduler.test.ts`
- Create: `src/lib/features/scheduler/repeat-items.ts`
- Create: `src/lib/features/scheduler/repeat-items.test.ts`

**Interfaces:**
- Produces `getSharedLaneOpeningMinute(lanes: Lane[]): number | undefined`.
- Produces `buildRepeatedItemSpecs(input): RepeatedItemSpec[]` and `maximumRepeatCount(input): number`.

- [x] Write failing unit tests for complete/partial lane opening values, trimmed full-width-slash names, rest cadence, and the 24:00 boundary.
- [x] Run the focused tests and verify the imports fail because the new functions do not exist.
- [x] Implement the pure functions without UI dependencies.
- [x] Run the focused tests and verify they pass.

### Task 2: Fixed five-minute controls and reusable time delta

**Files:**
- Create: `src/lib/components/IntervalDelta.svelte`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/features/scheduler/TimetableToolbar.svelte`
- Modify: `src/lib/components/modals/ItemEditorModal.svelte`
- Modify: `src/lib/components/modals/LaneEditorModal.svelte`
- Modify: `src/lib/components/modals/FestivalSettingsModal.svelte`
- Modify: `src/lib/components/modals/BulkEntryModal.svelte`

**Interfaces:**
- `IntervalDelta` receives `value`, `onChange`, and optional `min`/`max`, displaying compact `− [5分] +` adjustments.

- [x] Make the only selectable schedule increment five minutes and remove the misleading interval chooser.
- [x] Add the reusable clamp-aware delta control at each time-input line.
- [x] Confirm controls preserve 30:00 as their upper limit.

### Task 3: Repeat-item editor and persisted lane opening behavior

**Files:**
- Modify: `src/lib/features/scheduler/item-editor-controller.svelte.ts`
- Modify: `src/lib/features/scheduler/lane-editor-controller.svelte.ts`
- Modify: `src/lib/components/modals/ItemEditorModal.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Item editor exposes repeat state, preview specs, and setters to the modal.
- Lane save applies `getSharedLaneOpeningMinute` only after every lane has an opening value.

- [x] Keep `繰り返し追加` closed by default, with a clear `オン` / `オフ` state in its header.
- [x] Use a whole-number range control for count, rest duration, and cadence; cap count at the last complete item before 24:00.
- [x] Render a Japanese preview and create the scheduled item copies on save.
- [x] Derive timetable start from the earliest opening only when every lane is configured.

### Task 4: Edit ergonomics and pointer drag reliability

**Files:**
- Modify: `src/lib/components/FestivalControls.svelte`
- Modify: `src/lib/features/scheduler/TimetableToolbar.svelte`
- Modify: `src/lib/features/scheduler/grid-interaction-controller.svelte.ts`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

- [x] Move `編集モード` beside the festival delete control and remove its duplicate toolbar position.
- [x] Use pointer capture and default-prevention for edit-mode item drags, leaving view-mode favorite behavior unchanged.
- [x] Keep undo/redo and edit actions visually stable.

### Task 5: Verification and documentation

**Files:**
- Modify: this plan

- [x] Run `bun run check`.
- [x] Run `bun run test:unit -- --run`.
- [x] Mark completed work in this plan and report exact verification results.
