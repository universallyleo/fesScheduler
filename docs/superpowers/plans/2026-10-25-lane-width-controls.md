# Lane Width Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unreliable free lane resizing with bounded width buttons and preserve readable dense multi-booth 特典会 content.

**Architecture:** Width-range helpers own visible-to-base conversion and bound checks. The grid measures its available width for button state, while `LaneHeader` renders the controls. `ScheduleItemBlock` owns the dense booth text treatment.

**Tech Stack:** Svelte 5, TypeScript, Vitest, CSS.

**Spec:** `docs/superpowers/specs/2026-10-25-lane-width-controls-design.md`

## Global Constraints

- Width changes are exactly 10 displayed pixels.
- Buttons disable before their next step would cross a bound; no clamping.
- Every lane has a 140px shared base. 特典会 lanes use a 50px-per-booth target from three booths onward: `max(140px, booth count × 50px)`. Their minimum is 20px below that booth-count default, and their maximum is `min(displayed grid width, 4 × booth-count default)`.
- When the visible grid is narrower than a lane’s current width, Width− may still move toward that lane’s lower bound; the viewport maximum blocks only Width＋.
- Do not add cell hover animation.

## Review Focus

- A lane whose stored legacy width is already below its minimum remains usable and can be widened.
- Type-wide controls respect the strictest participating lane bound.
- More-than-two-booth main content wraps vertically without clipping times or the footer.

### Task 1: Width range and control state

**Files:** `src/lib/features/scheduler/lane-width.ts`, `lane-width.test.ts`, `grid-interaction-controller.svelte.ts`, `grid-interaction-controller.test.ts`

- [x] Add failing tests for booth-aware bounds and pre-crossing disable behavior.
- [x] Implement shared displayed-width bounds and bounded 10px adjustment helpers.
- [x] Replace pointer-resize controller entry points with width-button state and adjustment methods.
- [x] Run focused width/controller tests.

### Task 2: Header controls and responsive grid bound

**Files:** `src/lib/components/LaneHeader.svelte`, `src/lib/features/scheduler/TimetableGrid.svelte`, `src/routes/+page.svelte`, `src/app.css`

- [x] Pass measured grid width and adjustment callbacks to headers.
- [x] Render `幅−` / `幅＋` only in edit mode and remove free-resize handling.
- [x] Style compact header controls without obscuring existing actions.

### Task 3: Dense multi-booth item text

**Files:** `src/lib/components/ScheduleItemBlock.svelte`, `src/app.css`

- [x] Mark more-than-two-booth 特典会 cells.
- [x] Apply slightly smaller, upright vertical main-content text with safe word breaking and no clipping.
- [x] Run the full unit suite, `bun run check`, and `bun run build`.

### Task 4: Narrow multi-booth controls

**Files:** `src/lib/features/scheduler/lane-width.ts`, `lane-width.test.ts`, `TimetableGrid.svelte`, `ScheduleItemBlock.svelte`, `src/app.css`

- [x] Preserve Width− when a narrow viewport places a multi-booth lane above its viewport cap.
- [x] Derive narrow booth cards from the current lane width rather than saving an independent sublane width.
- [x] Stack the favourite and edit-delete controls beneath the start time in narrow multi-booth cards.
- [x] Restore the 140px shared base and replace the blunt multi-booth multiplier with documented 50px-per-booth sizing from three booths onward.
- [x] Centralize lane and narrow-card geometry values as documented constants in `lane-width.ts`.
