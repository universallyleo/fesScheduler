# Live-Fes Component Refactor Implementation Plan

> **For agentic workers:** Execute this plan inline, one task at a time. Do not alter timetable behaviour as part of this refactor.

**Goal:** Split the timetable route into focused Svelte components and feature controllers while retaining the route as meaningful page composition.

**Architecture:** `+page.svelte` is the page-level composition of feature components. `scheduler-session.svelte.ts` owns persisted festivals, preferences, loading, undo/redo, templates, imports, and festival-level settings. Focused controllers own item drafts, lane drafts, grid pointer interaction, and bulk entry. Pure selectors, layout helpers, presentation geometry, and UI copy live in plain modules. Presentational controls, timetable rendering, and modal shells communicate through typed data and callbacks; no wrapper component merely relocates the page.

**Tech Stack:** Svelte 5, TypeScript, SvelteKit, Bun.

## Global Constraints

- Preserve every existing interaction, Japanese UI copy, persistence behaviour, and keyboard semantics.
- Do not introduce a store or change the scheduler domain model in this refactor.
- Keep `scheduler-session.svelte.ts` as the only location that writes festival data and preferences; feature controllers issue mutations through its command.
- Do not run browser tests unless specifically requested; run type checking and the existing unit suite after the refactor.

---

### Task 1: Shared component foundations

**Files:**
- Create: `src/lib/components/ModalShell.svelte`
- Create: `src/lib/ui-types.ts`
- Modify: `src/routes/+page.svelte`

- [x] Define UI-only draft and interaction types outside the page.
- [x] Add a slot-based modal shell that owns the backdrop-dismiss rule, dialog attributes, title region, close action, body, and footer.
- [x] Keep reusable modal frame and page-composition responsibilities separate.

### Task 2: Dialog components

**Files:**
- Create: `src/lib/components/modals/FestivalSettingsModal.svelte`
- Create: `src/lib/components/modals/ItemEditorModal.svelte`
- Create: `src/lib/components/modals/LaneEditorModal.svelte`
- Create: `src/lib/components/modals/LaneInfoModal.svelte`
- Create: `src/lib/components/modals/RelatedItemsModal.svelte`
- Create: `src/lib/components/modals/ImportModal.svelte`
- Create: `src/lib/components/modals/BulkEntryModal.svelte`
- Modify: `src/routes/+page.svelte`

- [x] Move each dialog’s markup and its dialog-specific CSS into a component.
- [x] Move mutable item, lane, and bulk drafts into matching controllers; pass commands through typed callbacks.
- [x] Use `ModalShell` for every dialog to remove repeated backdrop and heading markup.

### Task 3: Page controls

**Files:**
- Create: `src/lib/components/AppHeader.svelte`
- Create: `src/lib/components/FestivalHeader.svelte`
- Create: `src/lib/components/TimetableToolbar.svelte`
- Modify: `src/routes/+page.svelte`

- [x] Move header, festival/day, browse, display, transfer, and edit-command markup.
- [x] Expose control state through typed props and callbacks; persistence remains in the session controller.
- [x] Retain responsive behaviour and the existing `保存済み`, theme, and sample controls.

### Task 4: Timetable components

**Files:**
- Create: `src/lib/components/ScheduleItemBlock.svelte`
- Create: `src/lib/components/LaneHeader.svelte`
- Create: `src/lib/components/TimetableGrid.svelte`
- Modify: `src/routes/+page.svelte`

- [x] Create one item block renderer shared by normal and compact layouts.
- [x] Move lane headers, time axis, lane bodies, creation preview, and scroll controls into the grid component.
- [x] Keep pointer interaction in a focused controller so drag/resize, right-click related items, and edit controls retain their present semantics.

### Task 5: Review and verification

**Files:**
- Modify: `src/routes/+page.svelte` and new component files only as needed for compile issues.

- [x] Inspect component interfaces for duplicated state or route mutations in child components.
- [x] Run Svelte type checking and the existing unit tests after the completed controller split.
- [x] Report verification failures without unrelated cleanup.

## Progress record

- [x] Extracted the global route stylesheet to `src/app.css` and imported it from `+layout.svelte`.
- [x] Added shared `ModalShell`, `ModalHeader`, `AppHeader`, `LaneHeader`, and `ScheduleItemBlock` components.
- [x] Extracted festival settings, import, lane information, and related-items dialogs.
- [x] Reused `ScheduleItemBlock` in both normal and compact timetable layouts.
- [x] Extracted festival title/actions and day navigation into `FestivalControls.svelte`.
- [x] Extracted the item editor and its related-event tree into `ItemEditorModal.svelte`.
- [x] Extracted the lane editor and bulk-entry dialog into dedicated modal components.
- [x] Extracted browse/edit controls into `features/scheduler/TimetableToolbar.svelte`.
- [x] Extracted the grid, time axis, lane columns, item interactions, and scrolling controls into `features/scheduler/TimetableGrid.svelte`.
- [x] Kept `+page.svelte` as the page-level composition after removing the temporary `SchedulerApp.svelte` wrapper, which did not provide a meaningful ownership boundary.
- [x] Moved festival snapshots, immutable mutations, and undo/redo state into `festival-history.svelte.ts`.
- [x] Moved persistence, loading, day selection, templates, imports, preferences, undo/redo, and festival settings into `scheduler-session.svelte.ts`.
- [x] Moved item drafts/commands, lane drafts/commands, grid pointer interaction, and bulk-entry commands into dedicated feature controllers.
- [x] Moved timetable filtering, lane lookup, relation traversal, and related-item selectors into `timetable-selectors.ts`.
- [x] Moved pure time placement, block presentation geometry, and UI copy into dedicated modules.
- [x] Moved grid-local scroll controls into `TimetableGrid.svelte` and replaced `any` toolbar/grid interfaces with explicit TypeScript contracts.
- [x] Verified the completed refactor with `bun run check` and `bun run test:unit -- --run` (0 type errors/warnings; 2 files and 9 tests passed).

## Completed ownership map

- `src/routes/+page.svelte`: page composition, lightweight visible-state coordination, and browser-only handoff functions.
- `scheduler-session.svelte.ts`: persisted festival and preferences session; the only module that writes storage.
- `item-editor-controller.svelte.ts`, `lane-editor-controller.svelte.ts`, `grid-interaction-controller.svelte.ts`, and `bulk-entry-controller.svelte.ts`: feature-specific draft and command state.
- `timetable-selectors.ts`, `timetable-layout.ts`, `timetable-presentation.ts`, and `scheduler-copy.ts`: pure reusable scheduler logic and copy.
- Svelte components: rendering and user-event forwarding only; no direct storage writes.
