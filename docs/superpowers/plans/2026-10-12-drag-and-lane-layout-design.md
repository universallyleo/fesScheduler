# Drag, Collision, and Lane-Width Design

## Goal

Make lane ordering and item movement predictable on touch and pointer devices, allow useful width control without breaking multi-booth geometry, and remove card controls that obstruct dense schedules.

## Confirmed behaviour

- Column width is adjusted only in edit mode by dragging the divider on the right edge of a column header, not by a value control in `表示設定`.
  - `表示設定` holds only the scope choice: `種類ごとに変更` (default) or `レーンごとに変更`.
  - In `種類ごとに変更`, dragging a divider updates every lane of that type: `ステージ`, `特典会`, or `イベント・インフォ`.
  - In `レーンごとに変更`, dragging a divider saves an override only on that lane; lanes without an override inherit their type width.
  - On fine-pointer devices, the divider shows the standard horizontal column-resize cursor on hover. On touch devices, its visible hit area provides the affordance instead.
  - A multi-booth lane continues to use its existing booth-placement formula. Changing the parent lane width scales every booth's usable horizontal width proportionally, including the 150%-wide presentation for three or more booths.
- Lane reordering starts only from an explicit move grip (`⠿`) in the column header.
  - Desktop shows the current insertion rule and target state.
  - Mobile requires a short hold on the grip, then renders a drag ghost, a clear insertion rule, and a live destination label such as `移動先: Stage C の前`.
  - The whole header is not a drag surface, so horizontal scrolling cannot accidentally reorder lanes.
- `表示設定` stores one persistent item-overlap policy:
  1. `重ねる（警告）`: retain the placement and report a conflict.
  2. `空きブースへ移動`: choose a booth in the same multi-booth lane that has no interval overlap. If no booth is available, retain the current booth and report the conflict.
  3. `前後をずらす`: resolve on release. A downward move pushes every collided and later item in the same sublane down by the final overlap amount; an upward move pushes every collided and earlier item up by that amount. Item dragging always clamps to 00:00–30:00, independently of festival and venue opening or closing times. Opening time remains display metadata only.
- Dragging an item uses a temporary preview, rather than writing the festival on every pointer move. The drag state is committed in a single mutation on release, producing one undo step and avoiding pointer lag.
- While dragged, the active item is above every other item in its lane. After release, non-overlapping cards have the same z-index. Overlapping cards use a small local order: later-starting overlapping cards appear above earlier cards, exactly as multi-booth cards do. Headers remain above cards; settings and floating edit/current-time controls remain above headers.
- Item-card content order is start time, main content, optional subcontent, then end time on the final line.
  - The in-card pencil is removed because clicking a card in edit mode opens the editor.
  - Duplication moves to the item editor's action row.
  - A multi-booth card in edit mode uses the final line for `終了時刻 [A/B/C select]`; it does not render the word `ブース` and does not use right-side action icons.
- `表示設定` must render above the column headers and item cards.

## Architecture

### Domain and preferences

- `src/lib/types.ts`
  - Add optional `width?: number` to `Lane` for an explicit lane override.
  - Replace the single visual lane-width preference with type-specific widths and new overlap-policy / individual-width preferences. Preserve migration from the existing `laneWidth` preference.
- `src/lib/features/scheduler/scheduler-session.svelte.ts`
  - Own preference migration and persistence only. It does not calculate drag geometry.

### Pure geometry and collision resolution

- New `src/lib/features/scheduler/item-drop-resolution.ts`
  - Determine collisions in a lane or booth.
  - Select an available booth for the `空きブースへ移動` policy.
  - Produce a resolved set of item-time/booth updates for all three policies, including the confirmed directional cascading rule and bounds.
  - Return a presentable preview summary without mutating schedule state.
- `src/lib/features/scheduler/timetable-presentation.ts`
  - Resolve inherited vs individual lane widths.
  - Keep booth widths proportional to the resolved lane width.
  - Calculate card stack levels, including the temporarily raised active dragged item.

### Interaction controller

- `src/lib/features/scheduler/grid-interaction-controller.svelte.ts`
  - Track a pointer drag preview locally, including initial placement, direction, pointer id, intended item result, and collision-resolution preview.
  - Use pointer capture and a document-level pointer move/up lifecycle while active, avoiding loss of movement when the pointer crosses another card or column.
  - Commit a single festival mutation on release.
  - Split header reordering from resizing: grip-only hold/drag reordering and explicit edge resize drag.
  - Expose drag preview, lane reorder destination, and resize state to the grid.

### Rendering components

- `src/lib/features/scheduler/TimetableToolbar.svelte`
  - Own `表示設定` controls for the lane-width scope and the persistent overlap-policy radio group.
  - Its settings panel receives the highest overlay layer among normal timetable controls.
- `src/lib/components/LaneHeader.svelte`
  - Render the move grip, live mobile reorder affordance, and resize handle. It only forwards events.
- `src/lib/features/scheduler/TimetableGrid.svelte`
  - Render item and lane drag previews, mobile destination label, insertion rule, and header resize affordance.
  - Pass the active-drag identity to item rendering/presentation.
- `src/lib/components/ScheduleItemBlock.svelte`
  - Render the revised time/content/footer arrangement.
  - Remove the pencil and duplicate controls from cards.
  - Render the compact booth selector only when editing a multi-booth item.
- `src/lib/components/modals/ItemEditorModal.svelte`
  - Add the duplicate action to the editor action row.

### Page composition

- `src/routes/+page.svelte`
  - Remains the composition boundary: wires preferences, controller callbacks, preview state, and modal actions. It does not contain collision algorithms.

## Error handling and accessibility

- The active overlap policy is visible in `表示設定` and uses native radio inputs.
- A failed automatic booth move does not silently alter data: it keeps the original booth and shows the existing conflict warning.
- Mobile drag start, current destination, resize width, and collision resolution have concise `aria-live` status text.
- Grip, resize handle, and quick booth select remain keyboard reachable. Existing Alt+Arrow lane movement remains available.

## Verification

- Unit-test collision resolution for overlap, free-booth selection, upward/downward cascades, 00:00/30:00 clamps, and no-free-booth fallback.
- Unit-test divider resizing in both scope modes, width inheritance, and proportional multi-booth layout.
- Unit-test the controller so it updates preview during movement and commits only once on release.
- Run `bun run check`, the full unit suite, a production build, and the existing Playwright suite when the browser runtime is available.

