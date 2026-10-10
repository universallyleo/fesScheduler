# Grid editing and multi-booth repeat design

## Purpose

Make timetable editing faster without making its normal browsing view more complex. In edit mode, users should be able to create an item by dragging an empty lane, open a normal item form from the floating add button, reorder whole lanes by dragging a lane header, and repeat a pattern across every booth of a multi-booth 特典会 lane.

## Scope

- Replace the `複数ブース` checkbox row with the compact オン/オフ accordion treatment already used by `繰り返し追加`.
- Keep drag-to-add enabled whenever edit mode is enabled. It has no separate toggle.
- Change `＋ 項目を追加` to open the item editor immediately.
- Support lane selection in a manually opened new-item editor; lock that selection when an item originates from a lane drag.
- Reorder normal timetable lanes through pointer dragging on their headers.
- Extend repeated item creation for multi-booth 特典会 lanes with optional copied patterns and booth start offsets.

Out of scope: reordering compact/favourite columns, cross-day lane moves, and changing item drag/resize semantics.

## Interaction design

### Multi-booth lane setting

`複数ブース` is a `<details>` accordion visible only for 特典会 lanes. Its summary displays `🟢` when a multi-booth list is enabled and `❌` otherwise. Both markers use the same fixed square icon box and font size so their visible size and alignment match. Opening it initializes `A, B` if no valid booth list exists. Closing it clears `lane.booths`. The content contains only the comma-separated booth name input; there is no checkbox control.

### New item creation

In edit mode, dragging over an empty standard lane always begins a time-range creation gesture. On release, the editor opens with that lane shown as `追加先レーン` and disabled, because the gesture establishes the destination.

The floating `＋ 項目を追加` action instead opens the same editor without a lane. Its first control is an enabled `追加先レーン` selector. Saving is unavailable until the user chooses a lane. The item type and color controls remain available as today.

### Lane reordering

Only normal, non-compact lane headers are draggable in edit mode. A horizontal pointer drag starts a lane-reorder gesture. The implementation may use pointer events or native drag and drop, but must preserve the following observable behavior:

- dropping over a different header moves the full lane column to that position;
- the lane’s items remain attached through their existing `laneId` values;
- dropping back on its original position makes no data change;
- heading edit/info buttons continue to activate normally and do not start a reorder;
- compact/favourite rendering does not permit lane reordering.

The persisted `FestivalDay.lanes` array is the ordering source of truth. A single history snapshot is written only when the order changes.

### Repeating across booths

For a new item in a 特典会 lane with at least two booths, the open `繰り返し追加` section offers an optional `全ブースへコピー` control. Enabling it creates the selected repeat pattern for every booth, assigning the respective `boothId`.

The option exposes `開始ずらし` with `IntervalDelta` controls in five-minute steps:

- One offset means a successive interval. With A/B/C and `+20分`, B starts 20 minutes after A and C starts 20 minutes after B.
- `ずらし時間を追加` adds an explicit offset entry for the next booth. Once entries exist for all following booths, each is measured from A. With A/B/C and `+20分`, `+45分`, B starts 20 minutes after A and C starts 45 minutes after A.
- Each booth receives the same item names, durations, rest schedule, item type, and color as the base repeat pattern.
- Any individual repeated item that would end after 30:00 is omitted. Preview and maximum count calculations use the same rule.

The repeat preview groups generated entries by booth and includes their effective offsets, so the user can confirm the batch before saving.

## Architecture

### Pure modules

Create a pure `multi-booth-repeat` module that receives a base repeat specification, ordered booth names, and user-entered offsets. It returns the effective per-booth offsets, generated `ScheduleItem` data, and preview entries. It contains the 30:00 limit and has unit coverage for successive offsets, explicit offsets, and boundary clipping.

Keep existing single-lane repeat generation in `repeat-items.ts`; extract shared primitive calculations only where it avoids duplicating timing logic.

### Controllers

Extend `item-editor-controller.svelte.ts` with draft-only state for destination lane, destination locking, whole-booth copying, and offsets. The controller owns validation and calls the pure repeat builder when saving. No repeat-only UI state is persisted in a schedule item.

Extend `grid-interaction-controller.svelte.ts` with a creation origin (`drag` or `toolbar`) and a separate lane-reorder gesture. It calls focused callbacks supplied by the page/session rather than mutating festival state itself.

Add a lane-order operation beside existing session/lane-editor operations. It reorders `day.lanes`, saves one history state when changed, and persists normally.

### Responsibility map

| File | Control or component | Purpose |
| --- | --- | --- |
| `src/lib/components/modals/LaneEditorModal.svelte` | `複数ブース` accordion | Replaces the full-width checkbox row. Opens/closes the booth-name input and displays the `🟢`/`❌` state. |
| `src/lib/components/modals/ItemEditorModal.svelte` | `追加先レーン` selector | First field for an item started with `＋ 項目を追加`; it is selectable there and shown locked for an item created by a lane drag. |
| `src/lib/components/modals/ItemEditorModal.svelte` | `全ブースへコピー`, `開始ずらし`, and `ずらし時間を追加` | Displays multi-booth repeat options only for eligible 特典会 lanes, explains the offset rule, and shows the grouped preview. |
| `src/lib/features/scheduler/TimetableGrid.svelte` | Floating `＋ 項目を追加` button | Opens a new item editor directly rather than arming a placement gesture. |
| `src/lib/features/scheduler/TimetableGrid.svelte` | Empty-lane pointer handling | Forwards edit-mode drag-to-add gestures to the grid interaction controller. |
| `src/lib/components/LaneHeader.svelte` | Lane-header drag and keyboard affordance | Starts a lane reorder while preserving the existing edit and information button actions. |
| `src/lib/features/scheduler/grid-interaction-controller.svelte.ts` | Creation and reorder interaction state | Tracks drag-created item ranges and header reorder gestures; it asks supplied callbacks to make data changes. |
| `src/lib/features/scheduler/item-editor-controller.svelte.ts` | New-item destination and repeat state | Validates the destination, holds non-persisted multi-booth repeat settings, and saves the generated items. |
| `src/lib/features/scheduler/multi-booth-repeat.ts` | Multi-booth repeat builder | New pure module that calculates effective booth offsets, produces items, and applies the 30:00 limit. |
| `src/lib/features/scheduler/lane-editor-controller.svelte.ts` | Lane save operation | Persists the booth list changed in the lane editor. |
| `src/routes/+page.svelte` | Component wiring | Passes the controllers, callbacks, and state between the existing grid and modals; it contains no offset calculations. |

## Accessibility and feedback

- The accordion summaries expose their expanded state natively and show a `🟢`/`❌` status badge.
- Lane headers remain keyboard-operable for their existing edit/info actions. Reordering also has a keyboard fallback through `Alt+ArrowLeft` and `Alt+ArrowRight` while a focused heading has edit mode enabled.
- Drag creation and lane reorder display a visible preview/drop target; no state changes occur until pointer release or keyboard confirmation.
- `ずらし時間を追加` has help text explaining that additional values are offsets from booth A, while a single value is repeated between booths.

## Verification

- Unit tests for offset calculation, generated booth IDs, 30:00 clipping, and no-op lane reorder.
- Component/type check through `bun run check`.
- Unit suite through `bun run test:unit -- --run`.
- Manual browser check: open the editor from the button, create by drag, reorder headers, and verify multi-booth preview/save.
