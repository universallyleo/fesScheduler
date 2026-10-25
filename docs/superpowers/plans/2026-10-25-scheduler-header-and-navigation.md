# Scheduler Header and Grid Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the scheduler header and floating controls while making timeline navigation visible and reliable on long, wide timetables.

**Architecture:** Keep header-only controls in AppHeader, day navigation in FestivalControls, and grid-only state and actions in TimetableGrid. The former TimetableToolbar is retired rather than retained as an empty wrapper. The scheduler session gains reset semantics that preserve the active record.

**Tech Stack:** Svelte 5, TypeScript, CSS custom properties, Bun/Vitest.

**Spec:** docs/superpowers/specs/2026-10-25-scheduler-header-and-navigation-design.md

## Global Constraints

- Preserve the original LIVE-FES / タイムテーブル two-line brand.
- Add no hover animation or unrequested interaction.
- Wide-screen header height is 100px with two 50px action rows.
- The frozen-header control is icon-only and defaults to frozen.

## Review Focus

- Header controls must not disappear or duplicate when the viewport crosses the desktop breakpoint.
- Reset must preserve the active festival identity and clear its timetable data.
- Sticky headers must be controlled by page scroll, not accidentally trapped by a vertical overflow container.
- Horizontal controls must only display when horizontal overflow exists and its native scrollbar is below the viewport.
- Favourite filter drawer must remain reachable without obscuring 編集 or 現在時刻へ.

---

### Task 1: Header action composition and reset behavior

**Files:**
- Modify: `src/lib/components/AppHeader.svelte`
- Modify: `src/lib/components/FestivalControls.svelte`
- Delete: `src/lib/features/scheduler/TimetableToolbar.svelte`
- Modify: `src/lib/features/scheduler/scheduler-session.svelte.ts`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: existing import/export/share/sample callbacks and `createBlankFestival()`.
- Produces: a single header action menu, 100px desktop header layout, and `resetFestival()` that retains the active festival id.

- [x] Move search and display settings into the wide-screen header and use a two-row action tray.
- [x] Move new/import/export/share/sample/reset into a single accessible menu labelled `他のフェス・シェア`.
- [x] Replace destructive remove-and-new behavior with reset-in-place behavior labelled `リセット`.
- [x] Run `bun run check`.

### Task 2: Grid navigation and filter controls

**Files:**
- Modify: `src/lib/features/scheduler/TimetableGrid.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: existing favourite filter state, `jumpToNow()`, horizontal scrolling, and edit-mode callbacks.
- Produces: frozen-header toggle state, page-top action, and favourite filter drawer.

- [x] Make the icon-only corner cell toggle frozen stage headings, defaulting to frozen.
- [x] Ensure the existing horizontal buttons are fixed only while the native horizontal scrollbar is below the viewport.
- [x] Add page-top, favourite drawer, and current-time floating actions in the requested order.
- [x] Run `bun run check`.

### Task 3: Item time typography and integration verification

**Files:**
- Modify: `src/lib/components/ScheduleItemBlock.svelte`
- Modify: `src/app.css`
- Test: existing type/build checks

**Interfaces:**
- Consumes: existing `formatMinute` output.
- Produces: matched start/end timestamp typography.

- [x] Render start and end time using the same CSS class and font properties.
- [x] Run `bun run check` and `bun run build`.

