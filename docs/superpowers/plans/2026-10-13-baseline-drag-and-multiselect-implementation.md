# Baseline Drag and Multi-select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dense timetable editing predictable by giving every lane an effective end bound, resolving drag collisions from a stable baseline, and supporting safe multi-item selection and movement.

**Architecture:** Keep policy and scheduling decisions in pure scheduler modules, then let the grid interaction controller own transient selection and drag-session state. Keep card components focused on rendering and DOM interaction; route-level composition supplies persisted mutations and modal state. The overlap chooser becomes a focused edit-mode modal rather than a permanent display-setting control.

**Tech Stack:** Svelte 5, TypeScript, SvelteKit, Vitest, Bun.

**Spec:** `docs/superpowers/specs/2026-10-13-baseline-drag-and-multiselect-design.md`

## Global Constraints

- Snap every drag and edited time to five-minute intervals.
- An effective limit is lane `endMinute`, otherwise festival-day `displayEndMinute`, otherwise 30:00.
- Do not mutate persistent schedule data during pointer movement or while a repetitive-add name is being typed.
- 特典会 booths always occupy equal, non-overlapping horizontal slices of their parent lane.
- Selection is available only in edit mode and can contain items from one lane only.
- UI copy remains Japanese; use the existing terms such as `重なり時の動作`, `複数選択`, and `終了時刻`.
- Do not run Prettier. Use `apply_patch` for all source and documentation edits.

## Review Focus

- A lane end earlier than the festival end must cap repeat previews, commit-time repetition, the dragged group, and every cascade; Task 1 and Task 2 test each precedence case.
- Moving B back before C's original start must restore C exactly to its baseline; Task 3 tests the 12:40–13:10 / 13:15–13:45 case.
- A multi-selection that spans booths must retain each selected card's booth and relative offset; Task 4 tests group patches rather than relying on visual inspection.
- Pressing Delete while an input, select, button, or other interactive element owns focus must not delete the item; Task 5 tests the card/modal keyboard guard.
- A reduced-motion user must receive the same overlap-policy explanation without running SVG animation; Task 6 tests the semantic labels and reduced-motion CSS contract.

## File Structure

```text
src/
├── app.css                                             [modify] shared selected-card, booth, card, and modal styles
├── lib/
│   ├── types.ts                                        [modify] lane end time and drag-session types
│   ├── ui-types.ts                                     [modify] grid-facing drag and selection types
│   ├── components/
│   │   ├── ScheduleItemBlock.svelte                    [modify] card interactions and compact visual controls
│   │   └── modals/
│   │       ├── LaneEditorModal.svelte                  [modify] optional lane ending-time editor
│   │       └── OverlapPolicyModal.svelte               [new] focused overlap-policy chooser and SVG explanation
│   └── features/scheduler/
│       ├── lane-time-bounds.ts                         [new] pure lane/festival end-bound calculation
│       ├── lane-time-bounds.test.ts                    [new] end-bound precedence coverage
│       ├── repeat-items.ts                             [modify] bounded repeat planning and save-time count reconciliation
│       ├── repeat-items.test.ts                        [modify] bounded repeat and delayed name reconciliation coverage
│       ├── item-drop-resolution.ts                     [modify] pure baseline group and cascade resolution
│       ├── item-drop-resolution.test.ts                [modify] baseline restore, group, booth, and bound coverage
│       ├── grid-interaction-controller.svelte.ts       [modify] drag session, selection, and click suppression
│       ├── grid-interaction-controller.test.ts         [modify] controller integration coverage
│       ├── item-editor-controller.svelte.ts            [modify] repeat-save normalization and effective-end input
│       ├── lane-editor-controller.svelte.ts            [modify] lane end-time draft persistence
│       ├── timetable-presentation.ts                   [modify] equal booth geometry and selected-card presentation
│       ├── timetable-presentation.test.ts              [modify] equal-width and compact-booth assertions
│       ├── TimetableGrid.svelte                        [modify] edit-panel controls and card event routing
│       └── TimetableToolbar.svelte                     [modify] remove inline overlap controls from 表示設定
└── routes/
    ├── +page.svelte                                    [modify] controller, bounds, modal, and preference composition
    └── scheduler.e2e.ts                                 [modify] modal policy and keyboard-deletion interaction coverage
```

---

### Task 1: Persist lane ending times and expose one effective end bound

**Files:**
- Create: `src/lib/features/scheduler/lane-time-bounds.ts`
- Create: `src/lib/features/scheduler/lane-time-bounds.test.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/components/modals/LaneEditorModal.svelte`
- Modify: `src/lib/features/scheduler/lane-editor-controller.svelte.ts`

**Interfaces:**
- Produces: `effectiveLaneEndMinute(lane: Lane, day: FestivalDay): number`.
- Produces: optional persisted `Lane.endMinute?: number`.
- Consumed by Tasks 2–4 and route composition in Task 7.

- [x] **Step 1: Write failing end-bound tests**

  Add `lane-time-bounds.test.ts` cases asserting: lane `endMinute` wins over a day end; a day `displayEndMinute` is used when the lane has no end; and an unbounded lane resolves to `30 * 60`.

- [x] **Step 2: Run the new bound test to verify it fails**

  Run: `bun run test -- src/lib/features/scheduler/lane-time-bounds.test.ts`

  Expected: FAIL because the module and helper do not exist.

- [x] **Step 3: Implement the persisted lane end and pure helper**

  Add `endMinute?: number` to `Lane`. Implement `effectiveLaneEndMinute` with the exact precedence above, without inspecting UI state or preferences.

- [x] **Step 4: Add the optional `終了時刻` field to lane editing**

  Reuse the existing five-minute time-input normalization and interval-delta controls. The controller must copy, validate, and persist `endMinute`; an empty input clears it.

- [x] **Step 5: Run focused verification**

  Run: `bun run test -- src/lib/features/scheduler/lane-time-bounds.test.ts`

  Expected: PASS.

- [x] **Step 6: Commit the bounded-lane foundation**

  ```bash
  git add src/lib/types.ts src/lib/components/modals/LaneEditorModal.svelte src/lib/features/scheduler/lane-editor-controller.svelte.ts src/lib/features/scheduler/lane-time-bounds.ts src/lib/features/scheduler/lane-time-bounds.test.ts
  git commit -m "feat: add lane schedule end bounds"
  ```

### Task 2: Make repetition save-time bounded and name-count stable

**Files:**
- Modify: `src/lib/features/scheduler/repeat-items.ts`
- Modify: `src/lib/features/scheduler/repeat-items.test.ts`
- Modify: `src/lib/features/scheduler/item-editor-controller.svelte.ts`

**Interfaces:**
- Consumes: `effectiveLaneEndMinute(lane, day)` from Task 1.
- Produces: `maximumRepeatCount(input: RepeatPlanInput, endMinute: number): number` and `reconcileRepeatCount(repeatCount: number, namesText: string, maximumCount: number): number`.
- Consumed by Task 7 when the route opens/saves the item editor.

- [x] **Step 1: Write failing repeat tests**

  Add assertions that a repeat plan stops at a lane end before the festival end, falls back to the festival end when the lane has none, and falls back to 30:00 otherwise. Add an assertion that removing slash-separated names while typing does not lower `repeatCount`, while saving raises it to normalized-name count and clamps it to the supplied maximum.

- [x] **Step 2: Run focused repeat tests to verify the new cases fail**

  Run: `bun run test -- src/lib/features/scheduler/repeat-items.test.ts src/lib/features/scheduler/item-editor-controller.test.ts`

  Expected: FAIL on the new bound and save-time reconciliation assertions.

- [x] **Step 3: Implement explicit repetition limits and reconciliation**

  Pass an end-minute argument through repetition planning instead of relying on a `30:00` constant. Normalize `/` and `／` names only at save time, trim each non-empty name, raise the count to their number, then clamp it to `maximumRepeatCount`.

- [x] **Step 4: Keep text-entry state non-mutating**

  Change the item-editor controller so `setRepeatNamesText` stores text only. Invoke `reconcileRepeatCount` from the save path, after the lane and day have resolved their effective end.

- [x] **Step 5: Run focused verification**

  Run: `bun run test -- src/lib/features/scheduler/repeat-items.test.ts src/lib/features/scheduler/item-editor-controller.test.ts`

  Expected: PASS.

- [x] **Step 6: Commit bounded repetition**

  ```bash
  git add src/lib/features/scheduler/repeat-items.ts src/lib/features/scheduler/repeat-items.test.ts src/lib/features/scheduler/item-editor-controller.svelte.ts src/lib/features/scheduler/item-editor-controller.test.ts
  git commit -m "fix: bound repeated items by schedule end"
  ```

### Task 3: Resolve drops from an immutable baseline, including selected groups

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/ui-types.ts`
- Modify: `src/lib/features/scheduler/item-drop-resolution.ts`
- Modify: `src/lib/features/scheduler/item-drop-resolution.test.ts`

**Interfaces:**
- Consumes: selected IDs, immutable lane items, snapped group delta, `ItemOverlapPolicy`, and resolved effective end minute.
- Produces: `resolveItemDrop(input: BaselineDropInput): ItemDropResolution`, whose patches include selected movement plus only collisions reached from that baseline.
- Consumed by Task 4.

- [x] **Step 1: Write failing baseline-resolver tests**

  Cover these exact cases: dragging B from `12:40–13:10` down past C's original `13:15–13:45` puts C immediately after B; recomputing B at `12:30–13:00` restores C to `13:15–13:45`; a two-item selection preserves its original offset; only unselected cards in the same booth can cascade; and no patch may extend past the supplied end minute.

- [x] **Step 2: Run the resolver tests to verify they fail**

  Run: `bun run test -- src/lib/features/scheduler/item-drop-resolution.test.ts`

  Expected: FAIL on group input, baseline restoration, or supplied end-bound behavior.

- [x] **Step 3: Define baseline resolver input and output types**

  Add `BaselineDropInput` and any supporting selection/patch types to the type modules. It must contain original items, the selected IDs, one snapped delta, drag direction, the active lane, policy, and resolved limit. Do not embed Svelte state or mutate its input.

- [x] **Step 4: Implement group motion and reversible cascade resolution**

  First move every selected item by one shared, clamped delta. For `cascade`, scan original unselected same-booth items in drag direction; move an item only after a true collision, and stop the propagation when an original gap absorbs it. For `allow`, retain the conflict warning. For `free-booth`, preserve a multi-selection's booth assignments and return the normal conflict outcome if it cannot fit.

- [x] **Step 5: Run focused verification**

  Run: `bun run test -- src/lib/features/scheduler/item-drop-resolution.test.ts`

  Expected: PASS.

- [x] **Step 6: Commit baseline drop resolution**

  ```bash
  git add src/lib/types.ts src/lib/ui-types.ts src/lib/features/scheduler/item-drop-resolution.ts src/lib/features/scheduler/item-drop-resolution.test.ts
  git commit -m "feat: resolve item drags from a baseline"
  ```

### Task 4: Add controller-owned selection, group sessions, and click suppression

**Files:**
- Modify: `src/lib/features/scheduler/grid-interaction-controller.svelte.ts`
- Modify: `src/lib/features/scheduler/grid-interaction-controller.test.ts`

**Interfaces:**
- Consumes: `resolveItemDrop(input)` from Task 3 and `effectiveLaneEndMinute(lane, day)` from Task 1.
- Produces: controller state/actions `selectedItemIds`, `selectedLaneId`, `toggleItemSelection(itemId)`, `clearSelection()`, `beginItemDrag(...)`, `updateItemDrag(...)`, `finishItemDrag(...)`, and `consumeSuppressedCardClick(itemId)`.
- Consumed by Tasks 5 and 7.

- [x] **Step 1: Write failing controller tests**

  Assert that selection accepts cards only from the first selected lane, toggles a selected card off, and is cleared when edit mode ends. Assert that moving a selected group commits exactly one baseline-derived patch set on pointer release, preserves offsets/booths, uses the effective lane end, and suppresses the following card activation after a real drag.

- [x] **Step 2: Run controller tests to verify the new cases fail**

  Run: `bun run test -- src/lib/features/scheduler/grid-interaction-controller.test.ts`

  Expected: FAIL because there is no selected-ID state or baseline drag session.

- [x] **Step 3: Capture an immutable `DragSession` at pointer down**

  Snapshot all relevant lane items, selected IDs, original positions/booths, pointer origin, direction, and resolved end bound. During pointer movement, call Task 3 with that snapshot and replace only transient preview state; do not update festival data.

- [x] **Step 4: Commit once and consume post-drag clicks**

  On pointer release, apply the final patch set once, then mark that card activation as suppressed. Clear the session, but retain selection until the user toggles a card, changes mode, or explicitly clears it.

- [x] **Step 5: Run focused verification**

  Run: `bun run test -- src/lib/features/scheduler/grid-interaction-controller.test.ts`

  Expected: PASS.

- [x] **Step 6: Commit interaction state**

  ```bash
  git add src/lib/features/scheduler/grid-interaction-controller.svelte.ts src/lib/features/scheduler/grid-interaction-controller.test.ts
  git commit -m "feat: support baseline group dragging"
  ```

### Task 5: Render equal booth columns and compact, selectable item cards

**Files:**
- Modify: `src/lib/features/scheduler/timetable-presentation.ts`
- Modify: `src/lib/features/scheduler/timetable-presentation.test.ts`
- Modify: `src/lib/components/ScheduleItemBlock.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: controller selection/click-suppression actions from Task 4.
- Produces: `selected` card presentation, equal booth geometry, card delete callback, and edit-only booth select behavior.
- Consumed by Task 7's grid composition.

- [ ] **Step 1: Write failing presentation tests**

  Assert that a three-booth 特典会 lane gives every booth exactly one third of the lane and left positions `0`, `1/3`, and `2/3`, regardless of start times. Assert that multi-booth cards receive a compact main-content class and that selected cards receive a selected presentation flag.

- [ ] **Step 2: Run presentation tests to verify the new cases fail**

  Run: `bun run test -- src/lib/features/scheduler/timetable-presentation.test.ts`

  Expected: FAIL on equal-width or selected-card expectations.

- [ ] **Step 3: Make booth layout deterministic and non-overlapping**

  Replace start-time-sensitive booth width logic with `width = 100 / boothCount` and `left = boothIndex * width`. Preserve the usual static booth bottom line in display mode; in edit mode render the compact select in its place, not alongside it.

- [ ] **Step 4: Add card-only interaction affordances**

  Render selected cards with a high-contrast frame, decrease multi-booth main-content size, give start/end times one shared font rule, and add an immediate delete icon in the card's top-right edit-mode controls. Card activation must first consume the controller's post-drag suppression and then route to selection or editing.

- [ ] **Step 5: Run focused verification**

  Run: `bun run test -- src/lib/features/scheduler/timetable-presentation.test.ts`

  Expected: PASS.

- [ ] **Step 6: Commit card presentation**

  ```bash
  git add src/lib/features/scheduler/timetable-presentation.ts src/lib/features/scheduler/timetable-presentation.test.ts src/lib/components/ScheduleItemBlock.svelte src/app.css
  git commit -m "feat: refine booth and item card editing"
  ```

### Task 6: Move overlap settings into an explanatory edit-mode modal

**Files:**
- Create: `src/lib/components/modals/OverlapPolicyModal.svelte`
- Modify: `src/lib/features/scheduler/TimetableToolbar.svelte`
- Modify: `src/lib/features/scheduler/TimetableGrid.svelte`
- Modify: `src/app.css`
- Modify: `src/routes/scheduler.e2e.ts`

**Interfaces:**
- Consumes: `ItemOverlapPolicy` and an `onChange(policy: ItemOverlapPolicy)` callback.
- Produces: `OverlapPolicyModal` with an accessible `重なり時の動作` radio group and a close callback.
- Consumed by Task 7.

- [ ] **Step 1: Add a failing browser interaction test for the policy chooser**

  In `src/routes/scheduler.e2e.ts`, enter edit mode, open `重なり時の動作`, assert the three Japanese options are exposed as radio controls, select `前後をずらす`, close the modal, and reopen it to assert that policy remains selected.

- [ ] **Step 2: Implement `OverlapPolicyModal.svelte`**

  Render `重ねる（警告）`, `空きブースへ移動`, and `前後をずらす` as Japanese radio choices. Pair each with a small inline SVG showing, respectively, overlap plus warning, a lateral booth move, and a later card touching the first card's end. Honour `prefers-reduced-motion` by disabling motion while retaining the diagrams and accessible text.

- [ ] **Step 3: Replace inline display settings**

  Remove the overlap-policy controls from `TimetableToolbar.svelte`. Add an edit-panel `重なり時の動作` trigger to `TimetableGrid.svelte`, alongside the new `複数選択` toggle, and route opening/closing state through its parent.

- [ ] **Step 4: Set the default policy to cascade**

  Ensure newly initialized preferences use `cascade` (`前後をずらす`) without overwriting an existing saved preference.

- [ ] **Step 5: Verify component and type checks**

  Run: `bun run check`; then `bun run test:e2e -- scheduler.e2e.ts`

  Expected: PASS when Playwright's browser runtime is installed; otherwise record the missing-runtime result and continue with `bun run check`.

- [ ] **Step 6: Commit overlap controls**

  ```bash
  git add src/lib/components/modals/OverlapPolicyModal.svelte src/lib/features/scheduler/TimetableToolbar.svelte src/lib/features/scheduler/TimetableGrid.svelte src/app.css src/routes/scheduler.e2e.ts
  git commit -m "feat: explain drag overlap behavior"
  ```

### Task 7: Compose route behavior and protect modal deletion shortcuts

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/lib/components/modals/ItemEditorModal.svelte`
- Modify: `src/lib/features/scheduler/TimetableGrid.svelte`
- Modify: `src/lib/features/scheduler/grid-interaction-controller.test.ts`
- Modify: `src/routes/scheduler.e2e.ts`

**Interfaces:**
- Consumes: bounds helper (Task 1), item-editor repeat reconciliation (Task 2), controller actions (Task 4), card/grid state (Task 5), and overlap modal (Task 6).
- Produces: complete route-level editing behavior, persistence, and safe keyboard deletion.

- [ ] **Step 1: Add failing controller and browser tests for mode transitions and deletion**

  In the controller test, assert that leaving edit mode clears selection. In `scheduler.e2e.ts`, open an item editor, focus a text input and press Delete to assert the item remains, then focus the modal backdrop and press Delete to assert the item is removed.

- [ ] **Step 2: Wire effective bounds into every edit entry point**

  Resolve each lane's effective end from its current day and pass it to drag sessions, repeat previews, repeat saves, and single item validation. Maintain the existing five-minute snapping and use 30:00 only through Task 1's helper.

- [ ] **Step 3: Wire selection and overlap modal state into the route and grid**

  Keep `複数選択` edit-mode-only. Route card activation through the controller so it chooses selection or item editing; pass the selected state to cards; persist policy changes immediately through preferences; clear selection when the edit panel exits.

- [ ] **Step 4: Implement safe immediate deletion**

  Connect the card top-right delete affordance to the existing deletion mutation without an extra confirmation. In `ItemEditorModal.svelte`, handle Delete only when the event target is not interactive; ordinary text editing and every focused control retain normal Delete behavior.

- [ ] **Step 5: Run focused verification**

  Run: `bun run test -- src/lib/features/scheduler/grid-interaction-controller.test.ts src/lib/features/scheduler/item-editor-controller.test.ts`

  Expected: PASS.

- [ ] **Step 6: Commit composed editing behavior**

  ```bash
  git add src/routes/+page.svelte src/lib/components/modals/ItemEditorModal.svelte src/lib/features/scheduler/TimetableGrid.svelte src/lib/features/scheduler/grid-interaction-controller.test.ts src/routes/scheduler.e2e.ts
  git commit -m "feat: compose bounded multi-item editing"
  ```

### Task 8: Run the complete verification suite and record the completed plan

**Files:**
- Modify: `docs/superpowers/plans/2026-10-13-baseline-drag-and-multiselect-implementation.md`

**Interfaces:**
- Consumes: all completed implementation tasks.
- Produces: verified completion record with every checkbox marked only after the associated command passes.

- [ ] **Step 1: Run static and unit verification**

  Run: `bun run check`; then `bun run test:unit -- --run`.

  Expected: both commands PASS.

- [ ] **Step 2: Build the production bundle**

  Run: `bun run build`

  Expected: PASS.

- [ ] **Step 3: Run browser tests when a Playwright browser is installed**

  Run: `bun run test:e2e`

  Expected: PASS. If Playwright reports a missing browser executable, record that environmental limitation rather than claiming the suite passed.

- [ ] **Step 4: Mark completed implementation steps and record verification results**

  Update this plan after each completed task and add exact final command outcomes below this task.

- [ ] **Step 5: Commit the completion record**

  ```bash
  git add docs/superpowers/plans/2026-10-13-baseline-drag-and-multiselect-implementation.md
  git commit -m "docs: record baseline drag implementation"
  ```

