# Baseline Drag, Selection, and Lane Bounds Design

## Goal

Make item editing predictable in dense festival timetables: 特典会 booths never overlap horizontally, drag-overlap behavior is reversible, and editors can select and move several items safely.

## Confirmed behavior

- 特典会 sublanes always divide their lane evenly. Each card has a width of `100% / booth count`, and its booth fixes its horizontal position. Cards from different booths never overlap horizontally.
- Display mode retains the usual booth text. In edit mode only, a compact booth select replaces that static text. Multi-booth main content uses a smaller font than ordinary cards. Start and end time share one font size.
- Every `Lane` may have an optional `endMinute`. Its effective schedule limit is: lane end, otherwise festival day `displayEndMinute`, otherwise 30:00.
- The effective limit constrains repeated addition, a single item drag, grouped dragging, and every cascade produced by a shift operation.
- Repetitive-add names are not used to mutate `repeatCount` during text entry. On 保存, slash-separated names are normalized and the final count is raised to at least the name count, then clamped to the effective schedule limit.
- Default overlap behavior is `cascade` (`前後をずらす`).
- Shift calculations use the drag-start snapshot, never a previous pointer preview. Only an item actually crossed by a moved card shifts; a subsequent item shifts only when the preceding displacement reaches it. Returning before an original boundary restores unselected items to their original positions.
- The editor modal is never opened by a drag. Its delete control removes immediately. The Delete keyboard shortcut removes an item only when focus is outside interactive controls.
- Multi-select is edit-mode only and locks to a single lane. Selected items retain their time offsets and booth assignments when dragged. Clicking selected cards deselects them; clicking an item in another lane leaves the active selection unchanged. `空きブースへ移動` preserves selected booth assignments and falls back to the ordinary conflict warning if the group cannot fit.

## Architecture

### Baseline drag session

`grid-interaction-controller.svelte.ts` owns a `DragSession`, captured at pointer down:

- selected item IDs;
- immutable original positions for all lane items;
- the active lane and pointer origin;
- the group’s relative time offsets and booths.

Every pointer move produces a fresh preview:

1. Apply a snapped five-minute delta to the selected items as a group, clamped by their shared allowable range.
2. Evaluate collision policy against the original unselected items in the same booth.
3. For `cascade`, propagate only from a real collision; each affected unselected item is placed immediately after/before the prior item, until an original gap absorbs the movement or the effective limit is reached.
4. Return patches only for the preview. Pointer release commits the final patches once.

Because every preview starts from the same baseline, changing direction cannot retain a prior cascade displacement.

### End-bound model

`Lane.endMinute?: number` is persisted data. A pure `effectiveLaneEndMinute(lane, day)` helper implements the precedence rule. Repeat utilities and item-drop resolution receive this resolved bound rather than a hard-coded 30:00 constant.

`LaneEditorModal.svelte` exposes optional `終了時刻`, normalized in the existing five-minute time-input flow.

### Selection and editing

The controller maintains a selected-ID set and selection lane ID. `TimetableGrid.svelte` forwards normal card clicks to either selection or edit behavior depending on the new edit-panel `複数選択` toggle. It applies a high-contrast selected-card class.

The card component owns only visual/DOM behavior: click suppression after a drag, edit-mode booth select, delete affordance, shared time font styling, and smaller multi-booth artist text. Route/controller code owns mutations.

### Overlap settings modal

The edit panel replaces the inline overlap radios with one `重なり時の動作` button. `OverlapPolicyModal.svelte` presents radio options and an accessible, reduced-motion-safe SVG illustration for each behavior:

- `重ねる（警告）` — two cards visually overlap and show a warning outline.
- `空きブースへ移動` — a card slides into an unoccupied booth.
- `前後をずらす` — a later card is pushed exactly to the first card’s end.

Changing the selected radio persists the existing preference immediately.

## Component responsibilities

| File | Responsibility |
| --- | --- |
| `src/lib/types.ts` | Lane end-time and drag-selection data types. |
| `src/lib/features/scheduler/lane-time-bounds.ts` | Pure effective-end calculation and tests. |
| `src/lib/features/scheduler/repeat-items.ts` | Repetition cap parameter and save-time count reconciliation. |
| `src/lib/features/scheduler/item-drop-resolution.ts` | Pure baseline group/cascade resolver. |
| `src/lib/features/scheduler/grid-interaction-controller.svelte.ts` | Drag session, selection state, one-release mutation, click suppression. |
| `src/lib/components/ScheduleItemBlock.svelte` | Card rendering, booth select/static label, selected/delete controls. |
| `src/lib/components/modals/LaneEditorModal.svelte` | Optional lane end-time editor. |
| `src/lib/components/modals/OverlapPolicyModal.svelte` | Policy selector and explanatory SVGs. |
| `src/lib/features/scheduler/TimetableGrid.svelte` | Routes card events and renders selection/policy modal trigger. |
| `src/lib/features/scheduler/TimetableToolbar.svelte` | Removes overlap controls from 表示設定. |
| `src/routes/+page.svelte` | Composes day bounds, controller, modal state, and persisted mutations. |
| `src/app.css` | Booth geometry, selected state, card typography, modal animation. |

## Verification

- Unit tests prove bounds precedence, repeated-add clamping, save-time name/count reconciliation, and no mutation while typing.
- Resolver tests prove a baseline cascade restores C when B returns before C’s original start, and respects lane/day/30:00 bounds.
- Controller tests prove grouped items preserve offsets, only same-booth unselected items cascade, and drag suppresses editor activation.
- Presentation tests prove equal booth widths and smaller multi-booth main-content class.
- `bun run check`, the unit suite, and production build must pass. Browser tests are run when Playwright’s browser runtime is installed.
