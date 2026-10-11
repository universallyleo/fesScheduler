# Drag and Lane Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make timetable lane resizing, lane reordering, and item dragging responsive and predictable while preserving dense multi-booth scheduling.

**Architecture:** Pure modules resolve lane-width inheritance and item-drop outcomes; the grid controller owns transient pointer previews and commits one resolved mutation on release. Rendering components only display preview/state and forward typed interaction events. The route remains the page-level composition boundary.

**Tech Stack:** Svelte 5, TypeScript, SvelteKit, Vitest, Bun.

**Spec:** `docs/superpowers/plans/2026-10-12-drag-and-lane-layout-design.md`

## Global Constraints

- Keep all timetable UI labels in Japanese.
- Change widths only while edit mode is active.
- Default divider resizing changes every lane of the same type; individual mode changes only the selected lane.
- Preserve proportional multi-booth geometry, including the 150% width treatment for three or more booths.
- Snap drag calculations to five-minute increments and clamp shifted schedules to lane opening time/00:00 and 30:00.
- Persist item movement only once, when the pointer drag finishes.
- Do not run Prettier.

## Review Focus

- A 特典会 lane with three booths must retain evenly proportional booth positions after its type or individual width changes; Task 2 tests both inherited and overridden widths.
- A downward cascade at 29:55 must not place any item later than 30:00; Task 1 tests the capped resolution.
- An upward cascade in a lane with `openingMinute` must not cross that opening time; Task 1 tests the opening-time clamp.
- `空きブースへ移動` must preserve the original booth and emit an overlap result if no booth is free; Task 1 tests this fallback.
- A long pointer move must not create multiple history writes; Task 3 tests that only `handlePointerUp` calls `updateFestival`.

## File tree

```text
src/
├── app.css                                             [modify]
├── lib/
│   ├── types.ts                                        [modify]
│   ├── ui-types.ts                                     [modify]
│   ├── components/
│   │   ├── LaneHeader.svelte                           [modify]
│   │   ├── ScheduleItemBlock.svelte                    [modify]
│   │   └── modals/
│   │       └── ItemEditorModal.svelte                  [modify]
│   └── features/scheduler/
│       ├── item-drop-resolution.ts                     [new] pure overlap/cascade resolver
│       ├── item-drop-resolution.test.ts                [new] resolver tests
│       ├── lane-width.ts                               [new] width inheritance helpers
│       ├── lane-width.test.ts                          [new] width/layout tests
│       ├── TimetableGrid.svelte                        [modify]
│       ├── TimetableToolbar.svelte                     [modify]
│       ├── grid-interaction-controller.svelte.ts       [modify]
│       ├── grid-interaction-controller.test.ts         [modify]
│       ├── scheduler-copy.ts                           [modify]
│       ├── scheduler-session.svelte.ts                 [modify]
│       ├── timetable-presentation.ts                   [modify]
│       └── timetable-presentation.test.ts              [modify]
└── routes/
    └── +page.svelte                                    [modify]
```

### Task 1: Pure item-drop resolution

**Files:**
- Create: `src/lib/features/scheduler/item-drop-resolution.ts`
- Create: `src/lib/features/scheduler/item-drop-resolution.test.ts`
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `ItemOverlapPolicy = 'allow' | 'free-booth' | 'cascade'`, `ItemDropResolution`, and `resolveItemDrop(input)`.
- Consumes: `ScheduleItem`, `Lane`, proposed start/end minute, drag direction, and lane bounds.
- Used by: `grid-interaction-controller.svelte.ts` in Task 3.

- [x] **Step 1: Write failing resolver tests**

  Cover: allow-with-warning; free booth selection; no-free-booth fallback; a 10-minute downward cascade; a 10-minute upward cascade; 30:00 and opening-time clamps.

- [x] **Step 2: Run the resolver test file and verify it fails**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/item-drop-resolution.test.ts`

  Expected: FAIL because `resolveItemDrop` does not exist.

- [x] **Step 3: Add the policy type and implement `resolveItemDrop`**

  Add `ItemOverlapPolicy` to `src/lib/types.ts`. Implement:

  ```ts
  export function resolveItemDrop(input: {
    item: ScheduleItem;
    items: ScheduleItem[];
    lane: Lane;
    proposedStartMinute: number;
    proposedEndMinute: number;
    direction: 'up' | 'down';
    policy: ItemOverlapPolicy;
  }): ItemDropResolution;
  ```

  Return immutable item patches and a conflict flag. For cascade, shift the complete earlier/later run in the same booth by the final overlap amount, clamp the run as a group, and preserve five-minute boundaries.

- [x] **Step 4: Run the resolver test file and verify it passes**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/item-drop-resolution.test.ts`

- [x] **Step 5: Commit the resolver**

  ```sh
  git add src/lib/types.ts src/lib/features/scheduler/item-drop-resolution.ts src/lib/features/scheduler/item-drop-resolution.test.ts
  git commit -m "feat: resolve item drop overlaps"
  ```

### Task 2: Lane-width domain model and presentation geometry

**Files:**
- Create: `src/lib/features/scheduler/lane-width.ts`
- Create: `src/lib/features/scheduler/lane-width.test.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/features/scheduler/scheduler-session.svelte.ts`
- Modify: `src/lib/features/scheduler/timetable-presentation.ts`
- Modify: `src/lib/features/scheduler/timetable-presentation.test.ts`

**Interfaces:**
- Produces: `LaneWidthMode = 'type' | 'individual'`, `LaneTypeWidths`, `resolvedLaneBaseWidth(lane, widths)`, and `displayLaneWidth(lane, widths)`.
- Consumes: existing persisted `laneWidth` values during session migration.
- Used by: toolbar, grid controller, and timetable presentation in later tasks.

- [x] **Step 1: Write failing width tests**

  Assert type-level inheritance, a per-lane override, and a three-booth 特典会 display width that is exactly 1.5 times its resolved base width.

- [x] **Step 2: Run width tests and verify they fail**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/lane-width.test.ts`

- [x] **Step 3: Implement persisted width types and migration**

  Add optional `width?: number` to `Lane`. Replace `UserPreferences.laneWidth` with:

  ```ts
  laneWidthMode: LaneWidthMode;
  laneWidths: Record<LaneType, number>;
  itemOverlapPolicy: ItemOverlapPolicy;
  ```

  In `scheduler-session.svelte.ts`, migrate an existing scalar `laneWidth` into all three type widths and default new settings to `type` / `allow`.

- [x] **Step 4: Implement lane-width helpers and use them in presentation**

  `resolvedLaneBaseWidth` returns `lane.width` only in individual mode, otherwise the type width. `displayLaneWidth` applies the multi-booth 1.5 multiplier after the base-width calculation.

- [x] **Step 5: Run width and presentation tests**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/lane-width.test.ts src/lib/features/scheduler/timetable-presentation.test.ts`

- [x] **Step 6: Commit lane width handling**

  ```sh
  git add src/lib/types.ts src/lib/features/scheduler/lane-width.ts src/lib/features/scheduler/lane-width.test.ts src/lib/features/scheduler/scheduler-session.svelte.ts src/lib/features/scheduler/timetable-presentation.ts src/lib/features/scheduler/timetable-presentation.test.ts
  git commit -m "feat: support type and individual lane widths"
  ```

### Task 3: Preview-first grid interaction controller

**Files:**
- Modify: `src/lib/ui-types.ts`
- Modify: `src/lib/features/scheduler/grid-interaction-controller.svelte.ts`
- Modify: `src/lib/features/scheduler/grid-interaction-controller.test.ts`

**Interfaces:**
- Consumes: `resolveItemDrop`, width mode, overlap policy, `ScheduleItem[]`, and lane lookup.
- Produces: `itemDragPreview`, `laneResizePreview`, and mobile reorder destination state for `TimetableGrid`.
- Guarantees: it performs no festival mutation during pointer move and one mutation at pointer release.

- [x] **Step 1: Write failing controller tests**

  Assert an item move updates `itemDragPreview` without calling `updateFestival`; `handlePointerUp` commits the resolver patches once; non-edit mode rejects lane resize/reorder; and a divider drag changes type widths or one lane override according to `laneWidthMode`.

- [x] **Step 2: Run controller tests and verify they fail**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/grid-interaction-controller.test.ts`

- [x] **Step 3: Add explicit preview state and commit-on-release behavior**

  Extend `DragState` in `ui-types.ts` with pointer id, direction, original item placement, and resolved preview. `handlePointerMove` only updates this state. `handlePointerUp` applies returned patches through one `updateFestival` call.

- [x] **Step 4: Split header interaction into grip reorder and divider resize**

  Add `beginLaneReorder`, `beginLaneResize`, `updateLaneResize`, and their finish methods. Reordering must require the grip; on coarse pointers, do not mark it active until the hold threshold completes. Resize behavior must return immediately outside edit mode.

- [x] **Step 5: Run controller tests and verify they pass**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/grid-interaction-controller.test.ts`

- [x] **Step 6: Commit grid interaction behavior**

  ```sh
  git add src/lib/ui-types.ts src/lib/features/scheduler/grid-interaction-controller.svelte.ts src/lib/features/scheduler/grid-interaction-controller.test.ts
  git commit -m "feat: preview timetable drag interactions"
  ```

### Task 4: Display settings and lane-header affordances

**Files:**
- Modify: `src/lib/features/scheduler/scheduler-copy.ts`
- Modify: `src/lib/features/scheduler/TimetableToolbar.svelte`
- Modify: `src/lib/components/LaneHeader.svelte`
- Modify: `src/lib/features/scheduler/TimetableGrid.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: `laneWidthMode`, `itemOverlapPolicy`, controller resize/reorder state, and resolved lane widths.
- Produces: accessible settings radio groups, a grip-only reorder affordance, divider drag handle, and visible mobile destination feedback.

- [x] **Step 1: Add display-setting copy and radio controls**

  Add Japanese labels for `レーン幅`, `種類ごとに変更`, `レーンごとに変更`, `項目の重なり`, and the three overlap policies. Bind native radio inputs to preferences and persist on change.

- [x] **Step 2: Add header grip, resize divider, and preview props**

  Render `⠿` as the only reorder activator. Add an edge handle with a 44px coarse-pointer hit target. Pass state through `TimetableGrid` and the route without putting scheduling logic in components.

- [x] **Step 3: Style visible state and overlay hierarchy**

  Add the desktop `col-resize` cursor only when editing. On mobile, show a held-header ghost, target insertion rule, and `移動先` text. Raise the `表示設定` panel above headers/cards; retain the established floating edit/current-time controls above it where required by the existing layering contract.

- [x] **Step 4: Verify type checking and focused tests**

  Run: `bun run check && bun run test:unit -- --run src/lib/features/scheduler/grid-interaction-controller.test.ts src/lib/features/scheduler/lane-width.test.ts`

- [x] **Step 5: Commit settings and lane affordances**

  ```sh
  git add src/lib/features/scheduler/scheduler-copy.ts src/lib/features/scheduler/TimetableToolbar.svelte src/lib/components/LaneHeader.svelte src/lib/features/scheduler/TimetableGrid.svelte src/routes/+page.svelte src/app.css
  git commit -m "feat: add lane resize and drag settings"
  ```

### Task 5: Item-card editing controls and drag preview rendering

**Files:**
- Modify: `src/lib/components/ScheduleItemBlock.svelte`
- Modify: `src/lib/components/modals/ItemEditorModal.svelte`
- Modify: `src/lib/features/scheduler/TimetableGrid.svelte`
- Modify: `src/lib/features/scheduler/timetable-presentation.ts`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: active drag preview, booth choices, and editor duplicate callback.
- Produces: a raised active card, post-drop local stack order, card click editing, compact footer booth selection, and modal duplication action.

- [x] **Step 1: Write failing presentation/component-facing tests**

  Extend `timetable-presentation.test.ts` to assert the active dragged item receives the temporary top stack level and that settled non-overlapping cards share one stack level.

- [x] **Step 2: Run presentation tests and verify they fail**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/timetable-presentation.test.ts`

- [x] **Step 3: Render the new item-card hierarchy**

  Render start time on the top line and end time in the footer. Remove the pencil and inline duplicate buttons. In edit mode, use a compact native booth select beside the footer end time only for lanes with multiple booths; its change invokes one route mutation.

- [x] **Step 4: Move duplication to the modal action row**

  Add a duplicate action to `ItemEditorModal` and pass the existing controller command through the route. The card’s normal edit click remains the way to open this modal.

- [x] **Step 5: Render and style drag previews**

  Apply preview placement without mutating source items; give the active dragged card the temporary top item layer. After release, use the existing low local overlap order. Do not use transparency as a substitute for readable multi-booth footer controls.

- [x] **Step 6: Run focused tests and type checking**

  Run: `bun run test:unit -- --run src/lib/features/scheduler/timetable-presentation.test.ts && bun run check`

- [x] **Step 7: Commit card controls and previews**

  ```sh
  git add src/lib/components/ScheduleItemBlock.svelte src/lib/components/modals/ItemEditorModal.svelte src/lib/features/scheduler/TimetableGrid.svelte src/lib/features/scheduler/timetable-presentation.ts src/routes/+page.svelte src/app.css src/lib/features/scheduler/timetable-presentation.test.ts
  git commit -m "feat: refine item card drag controls"
  ```

### Task 6: Full verification

**Files:**
- Modify only as required by verification failures.

- [x] **Step 1: Run the complete verification set**

  Run:

  ```sh
  bun run check
  bun run test:unit -- --run
  bun run build
  bun run test:e2e
  ```

- [x] **Step 2: Report the exact result**

  Record any unavailable Playwright browser runtime separately from application failures. Do not claim browser coverage if Playwright cannot launch.

	**Recorded 2026-10-12:** `bun run check`, 52 unit tests, and `bun run build` passed. `bun run test:e2e` could not launch because Playwright's Chromium headless-shell executable is absent from the local Playwright cache; this is an environment prerequisite, not an application-test failure.

## Self-review

- Spec coverage: Tasks 1–5 cover every confirmed interaction, data, layout, accessibility, and stacking requirement; Task 6 verifies the integrated result.
- Type consistency: Task 1 defines `ItemOverlapPolicy` used by Task 2 preferences and Task 3 resolver/controller flow. Task 2 defines lane-width types used by Tasks 3–5.
- Review-focus coverage: every listed risk is covered by the indicated Task 1–3 tests.
- Proportion: the plan specifies public types, UI boundaries, and test cases without transcribing implementation bodies.
