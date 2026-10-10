# Grid Editing and Multi-Booth Repeat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make edit-mode item creation direct and reliable, support lane reordering, and let a repeated 特典会 pattern be copied safely across booths.

**Architecture:** Keep timing and lane-order calculations pure and unit-tested. Controllers own transient modal and pointer state; components only render controls and forward events. `FestivalDay.lanes` remains the persisted lane ordering source of truth, while generated booth items continue to use the existing `boothId` on `ScheduleItem`.

**Tech Stack:** Svelte 5 runes, TypeScript, Vitest, SvelteKit, Bun.

**Spec:** [`docs/superpowers/specs/2026-10-10-grid-editing-and-multi-booth-repeat-design.md`](../specs/2026-10-10-grid-editing-and-multi-booth-repeat-design.md)

## Global Constraints

- User-facing app copy is Japanese; conversation and developer-facing records are English.
- `複数ブース` status uses `🟢` when enabled and `❌` when disabled; render both inside equal-sized icon boxes.
- Drag-to-add is always enabled in edit mode; it has no toggle.
- `＋ 項目を追加` opens the editor directly, and manually created items require an `追加先レーン` selection before they can be saved.
- An item created by a lane drag shows its originating lane but does not permit changing it.
- All generated timings are in five-minute increments and an item ending after 30:00 is excluded.
- Header reorder works only for standard, non-compact timetable lanes in edit mode.
- Do not run Prettier; use `apply_patch` for source edits.

## Review Focus

- A pattern at 29:55 with a 10-minute duration must produce no item ending after 30:00 — Task 1.
- Three booths with one `+20分` entry must have effective offsets `0, 20, 40` — Task 1.
- Three booths with `+20分` and `+45分` must have effective offsets `0, 20, 45` — Task 1.
- Moving a lane header onto itself must leave the lane order unchanged and avoid a history update — Task 3.
- Clicking a heading’s edit/info button must not start a reorder gesture — Task 4 manual/browser check.

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/lib/features/scheduler/repeat-items.ts` | Existing single-pattern calculation, updated to a 30:00 boundary. |
| `src/lib/features/scheduler/multi-booth-repeat.ts` | New pure calculation of booth offsets, copied item specs, and grouped previews. |
| `src/lib/features/scheduler/multi-booth-repeat.test.ts` | Offset and boundary test coverage for the new pure module. |
| `src/lib/features/scheduler/lane-order.ts` | New pure lane-array reorder helper. |
| `src/lib/features/scheduler/lane-order.test.ts` | Pure lane-order behavior tests. |
| `src/lib/features/scheduler/item-editor-controller.svelte.ts` | Non-persisted new-item drafts, destination selection/lock, and multi-booth repeat save state. |
| `src/lib/features/scheduler/grid-interaction-controller.svelte.ts` | Always-on edit-mode range creation and lane-header reorder gesture state. |
| `src/lib/components/modals/ItemEditorModal.svelte` | Destination selector/lock, multi-booth repeat controls, help, and preview. |
| `src/lib/components/modals/LaneEditorModal.svelte` | `複数ブース` accordion with equal-size `🟢`/`❌` status icon. |
| `src/lib/components/LaneHeader.svelte` | Header pointer and keyboard events, preserving edit/info buttons. |
| `src/lib/features/scheduler/TimetableGrid.svelte` | Wires direct add, empty-lane creation, and header-reorder events. |
| `src/routes/+page.svelte` | Wires controllers, history-aware callbacks, and modal/grid props. |
| `src/app.css` | Accordion, equal-size state icon, lane-drag preview, and modal layout styles. |

### Task 1: Timing primitives for 30:00 and booth copies

**Files:**
- Modify: `src/lib/features/scheduler/repeat-items.ts`
- Create: `src/lib/features/scheduler/multi-booth-repeat.ts`
- Modify: `src/lib/features/scheduler/repeat-items.test.ts`
- Create: `src/lib/features/scheduler/multi-booth-repeat.test.ts`

**Interfaces:**
- Produces `const SCHEDULE_END_MINUTE = 30 * 60` from `repeat-items.ts`.
- Produces `effectiveBoothOffsets(booths: string[], enteredOffsets: number[]): number[]`.
- Produces `buildMultiBoothRepeat(input: MultiBoothRepeatInput): MultiBoothRepeatResult` with `{ items: BoothRepeatItemSpec[]; preview: BoothRepeatPreviewGroup[] }`.
- Later tasks consume `buildMultiBoothRepeat` and its preview groups; no component calculates offsets itself.

- [x] **Step 1: Write failing single-repeat boundary tests**

```ts
expect(maximumRepeatCount({ startMinute: 1790, endMinute: 1800, restMinutes: 0, itemsBeforeRest: 1 })).toBe(1);
expect(maximumRepeatCount({ startMinute: 1795, endMinute: 1805, restMinutes: 0, itemsBeforeRest: 1 })).toBe(0);
```

- [x] **Step 2: Run the boundary test to verify it fails**

Run: `bun run test:unit -- src/lib/features/scheduler/repeat-items.test.ts --run`

Expected: FAIL because the old 24:00 boundary is still used.

- [x] **Step 3: Export and use `SCHEDULE_END_MINUTE = 30 * 60` in `repeat-items.ts`**

Apply that single boundary to `maximumRepeatCount` and its dependent repeat builder.

- [x] **Step 4: Run the single-repeat boundary test to verify it passes**

Run: `bun run test:unit -- src/lib/features/scheduler/repeat-items.test.ts --run`

Expected: PASS.

- [x] **Step 5: Write failing multi-booth tests**

```ts
expect(effectiveBoothOffsets(['A', 'B', 'C'], [20])).toEqual([0, 20, 40]);
expect(effectiveBoothOffsets(['A', 'B', 'C'], [20, 45])).toEqual([0, 20, 45]);
expect(buildMultiBoothRepeat(inputEndingAt1805).items).toEqual([]);
```

Also assert that a copied item retains its matching `boothId` and that grouped preview entries name their booth and effective offset.

- [x] **Step 6: Run multi-booth tests to verify they fail**

Run: `bun run test:unit -- src/lib/features/scheduler/multi-booth-repeat.test.ts --run`

Expected: FAIL because the module does not exist.

- [x] **Step 7: Implement `multi-booth-repeat.ts`**

`MultiBoothRepeatInput` combines a base `RepeatItemInput`, ordered `booths`, `copyAcrossBooths`, and `enteredOffsets`. With one entered offset, multiply it for each later booth. With one explicit entry per later booth, treat each as an offset from the first booth. Build each booth’s base pattern with the existing repeat functions shifted by its effective offset; omit items that end after `SCHEDULE_END_MINUTE`.

- [x] **Step 8: Run multi-booth tests to verify they pass**

Run: `bun run test:unit -- src/lib/features/scheduler/multi-booth-repeat.test.ts --run`

Expected: PASS.

- [x] **Step 9: Review the task diff without committing shared work**

Run: `git diff -- src/lib/features/scheduler/repeat-items.ts src/lib/features/scheduler/repeat-items.test.ts src/lib/features/scheduler/multi-booth-repeat.ts src/lib/features/scheduler/multi-booth-repeat.test.ts`

The workspace already contains shared uncommitted work. Preserve it; do not create an intermediate commit unless the user requests one.

### Task 2: Draft-first item creation and multi-booth saving

**Files:**
- Modify: `src/lib/features/scheduler/item-editor-controller.svelte.ts`
- Modify: `src/lib/components/modals/ItemEditorModal.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes `buildMultiBoothRepeat(input: MultiBoothRepeatInput): MultiBoothRepeatResult` from Task 1.
- Produces `openNew(options?: { laneId?: string; startMinute?: number; endMinute?: number; lockDestination?: boolean }): void`.
- Produces `setDestinationLaneId(laneId: string): void`, `destinationLocked: boolean`, `setCopyAcrossBooths(value: boolean): void`, and `setBoothOffsets(value: number[]): void`.
- Task 4 calls `openNew` for toolbar and lane-drag creation.

- [x] **Step 1: Add controller tests for a non-persisted new item draft**

Create `src/lib/features/scheduler/item-editor-controller.test.ts` with a minimal controller fixture. Assert that `openNew()` does not mutate festival items, that `save()` rejects an empty destination lane, and that `openNew({ laneId: 'lane-a', lockDestination: true })` exposes a locked destination.

- [x] **Step 2: Run the controller tests to verify they fail**

Run: `bun run test:unit -- src/lib/features/scheduler/item-editor-controller.test.ts --run`

Expected: FAIL because `openNew` and destination state do not exist.

- [x] **Step 3: Refactor new-item lifecycle in `item-editor-controller.svelte.ts`**

Create new drafts without immediately inserting them into `FestivalDay.items`. `save()` inserts the first saved draft and then any repeat copies; editing an existing item still updates it in place. Destination selection updates `laneId`, default `itemType`, and default booth without overriding an explicit alternate item type/color. Preserve the existing related-event behavior.

- [x] **Step 4: Add multi-booth repeat state and save behavior**

Expose `copyAcrossBooths`, `boothOffsets`, and a grouped booth preview only when the chosen lane is a multi-booth 特典会 lane. On save, use Task 1’s generated specs, create fresh IDs, assign booth IDs, and preserve only the first item’s related-item links.

- [x] **Step 5: Run controller tests to verify they pass**

Run: `bun run test:unit -- src/lib/features/scheduler/item-editor-controller.test.ts --run`

Expected: PASS.

- [x] **Step 6: Update `ItemEditorModal.svelte` and its CSS**

Place `追加先レーン` as the first new-item field. Use a disabled select with explanatory text for locked drag origins. In the open `繰り返し追加` panel, conditionally render `全ブースへコピー`; show one `IntervalDelta` by default and `ずらし時間を追加` with help text that explains successive versus explicit offsets. Render grouped booth previews with each effective offset.

- [x] **Step 7: Run Svelte type checking**

Run: `bun run check`

Expected: 0 errors and 0 warnings.

- [x] **Step 8: Review the task diff without committing shared work**

Run: `git diff -- src/lib/features/scheduler/item-editor-controller.svelte.ts src/lib/features/scheduler/item-editor-controller.test.ts src/lib/components/modals/ItemEditorModal.svelte src/routes/+page.svelte src/app.css`

The workspace already contains shared uncommitted work. Preserve it; do not create an intermediate commit unless the user requests one.

### Task 3: Lane-order calculation and multi-booth lane accordion

**Files:**
- Create: `src/lib/features/scheduler/lane-order.ts`
- Create: `src/lib/features/scheduler/lane-order.test.ts`
- Modify: `src/lib/components/modals/LaneEditorModal.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Produces `reorderLanes(lanes: Lane[], sourceId: string, targetId: string): Lane[]`.
- Returns the original array reference when source and target are equal or missing, enabling callers to skip history writes.
- Task 4 uses `reorderLanes` in its history-aware page callback.

- [x] **Step 1: Write failing lane-order tests**

```ts
const lanes = [a, b];
expect(reorderLanes([a, b, c], 'c', 'a').map((lane) => lane.id)).toEqual(['c', 'a', 'b']);
expect(reorderLanes(lanes, 'a', 'a')).toBe(lanes);
expect(reorderLanes(lanes, 'missing', 'b')).toBe(lanes);
```

- [x] **Step 2: Run the lane-order test to verify it fails**

Run: `bun run test:unit -- src/lib/features/scheduler/lane-order.test.ts --run`

Expected: FAIL because the module does not exist.

- [x] **Step 3: Implement `reorderLanes` in `lane-order.ts`**

Return a new reordered array only for a valid move. Do not alter lane objects or their item associations.

- [x] **Step 4: Run the lane-order test to verify it passes**

Run: `bun run test:unit -- src/lib/features/scheduler/lane-order.test.ts --run`

Expected: PASS.

- [x] **Step 5: Replace the booth checkbox in `LaneEditorModal.svelte`**

Use the native `<details>` accordion. Its summary uses an equal-width/equal-height status span: `🟢` for enabled valid booth lists and `❌` otherwise. Opening defaults to `['A', 'B']`; closing clears `draft.booths`. Keep only the comma-separated input inside.

- [x] **Step 6: Add the `booth-entry` CSS and run Svelte type checking**

Run: `bun run check`

Expected: 0 errors and 0 warnings.

- [x] **Step 7: Review the task diff without committing shared work**

Run: `git diff -- src/lib/features/scheduler/lane-order.ts src/lib/features/scheduler/lane-order.test.ts src/lib/components/modals/LaneEditorModal.svelte src/app.css`

The workspace already contains shared uncommitted work. Preserve it; do not create an intermediate commit unless the user requests one.

### Task 4: Always-on drag creation and lane-header reordering

**Files:**
- Modify: `src/lib/features/scheduler/grid-interaction-controller.svelte.ts`
- Modify: `src/lib/components/LaneHeader.svelte`
- Modify: `src/lib/features/scheduler/TimetableGrid.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes `openNew` from Task 2 and `reorderLanes` from Task 3.
- Produces `beginLaneReorder(event: PointerEvent, laneId: string): void`, `handleLaneReorderMove(event: PointerEvent): void`, and `finishLaneReorder(): void` in the grid interaction controller.
- Page provides `reorderSelectedDayLanes(sourceId: string, targetId: string): void`; it writes history only when `reorderLanes` returns a new array.

- [x] **Step 1: Write a failing grid interaction test for always-on creation**

Create `src/lib/features/scheduler/grid-interaction-controller.test.ts`. Assert that an edit-mode empty-lane drag invokes `openNew({ laneId, lockDestination: true })` without a preceding toolbar action, while view mode and compact mode do not invoke it.

- [x] **Step 2: Run the grid interaction test to verify it fails**

Run: `bun run test:unit -- src/lib/features/scheduler/grid-interaction-controller.test.ts --run`

Expected: FAIL because creation still requires `addMode` and inserts before editing.

- [x] **Step 3: Implement always-on drag creation**

Remove `addMode`, `addLaneId`, and `clearAddMode`. Keep the existing 5-minute snap and preview. On pointer release, pass the calculated range and originating lane to `openNew`; do not mutate festival data until the modal saves.

- [x] **Step 4: Implement header reorder gesture and keyboard fallback**

Track only edit-mode, non-compact header gestures. Ignore pointer events from heading buttons. Show a source/drop-target class while the pointer crosses lane headers. On release, call the page reorder callback. Add `Alt+ArrowLeft`/`Alt+ArrowRight` to move the focused lane one valid position and use the same callback.

- [x] **Step 5: Wire `LaneHeader`, `TimetableGrid`, and the page callback**

Pass the necessary pointer/key callbacks through `LaneHeader.svelte` and `TimetableGrid.svelte`. Change the floating `＋ 項目を追加` handler to `itemEditor.openNew()`; it must never call the drag creation controller. In `+page.svelte`, use `reorderLanes` inside `updateFestival` only for changed orders so undo/redo receives one meaningful snapshot.

- [x] **Step 6: Run focused unit tests**

Run: `bun run test:unit -- src/lib/features/scheduler/grid-interaction-controller.test.ts src/lib/features/scheduler/lane-order.test.ts --run`

Expected: PASS.

- [x] **Step 7: Run browser/manual verification**

With `bun run dev` running, verify all of the following in the timetable:

1. In edit mode, drag an empty lane for a five-minute-aligned item; the editor shows a disabled originating lane.
2. Use `＋ 項目を追加`; the editor opens immediately with an enabled `追加先レーン`, and saving without a selection is blocked.
3. Drag a heading across another heading; the columns reorder and remain reordered after reload.
4. Click heading edit/info icons; each activates its normal modal/action without moving a lane.
5. On a multi-booth 特典会 lane, verify `🟢`/`❌` have equal visible size and create one successive-offset and one explicit-offset repeat pattern.

- [x] **Step 8: Run full verification**

Run: `bun run check; bun run test:unit -- --run; git diff --check`

Expected: Svelte check reports 0 errors/warnings, all unit tests pass, and `git diff --check` exits 0.

- [x] **Step 9: Review the task diff without committing shared work**

Run: `git diff -- src/lib/features/scheduler/grid-interaction-controller.svelte.ts src/lib/features/scheduler/grid-interaction-controller.test.ts src/lib/components/LaneHeader.svelte src/lib/features/scheduler/TimetableGrid.svelte src/routes/+page.svelte src/app.css`

The workspace already contains shared uncommitted work. Preserve it; do not create an intermediate commit unless the user requests one.

## Plan self-review

- **Spec coverage:** Task 1 implements five-minute, 30:00-safe repeat timing; Task 2 implements direct add, destination lock, whole-booth copying, offsets, and preview; Task 3 implements the accordion and pure lane ordering; Task 4 implements always-on dragging and visible lane reordering. No scope item is omitted.
- **Step scan:** Each task begins with a targeted failing test, names the command that demonstrates the expected state, and exposes interfaces used by subsequent tasks.
- **Type consistency:** `buildMultiBoothRepeat`, `openNew`, `reorderLanes`, and `reorderSelectedDayLanes` are named consistently across producer and consumer tasks.
- **Review focus:** Every stated risky condition has a named owning task and concrete test or manual verification.
- **Proportion:** The plan specifies interfaces, exact behavior, and tests without embedding implementation bodies.
