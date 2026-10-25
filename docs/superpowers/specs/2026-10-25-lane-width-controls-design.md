# Lane Width Controls Design

## Goal

Replace free lane-width dragging with predictable header controls and keep dense multi-booth 特典会 cells readable.

## Confirmed behavior

- Edit-mode lane headers expose `幅−` and `幅＋` controls; free divider resizing is removed.
- One press changes the displayed lane width by 10px.
- A width button is disabled whenever its next 10px step would exceed that lane’s allowed range; widths are never clamped by a button press.
- Every lane has a 140px shared base width. A 特典会 lane with two booths displays at 140px; a three-booth lane displays at 150px; four booths display at 200px; and every additional booth adds 50px. This preserves about 50px per booth once there are three or more.
- The displayed minimum is 20px below that lane’s booth-count default: 120px for two booths, 130px for three, 180px for four, and so on. The maximum is the smaller of the currently displayed grid width and four times that lane’s booth-count default.
- If a viewport is narrower than a lane’s enforced minimum, `幅−` still remains available until that lane reaches its minimum; only `幅＋` is blocked by the viewport maximum. This prevents a default multi-booth width from becoming stuck.
- In width-by-type mode, a change is allowed only when it remains inside the range for every lane of that type. Individual mode affects only the selected lane.
- 特典会 items in lanes with more than two booths use a slightly smaller main-content font and upright vertical text. Their main content must wrap/break rather than be clipped.
- Booth slices are percentage-based, so their widths update with the enclosing lane. When an individual multi-booth card cannot fit both `xx:xx` and its heart control on the start-time row, the favourite control moves below the start time; in edit mode, the delete control stacks below the favourite control.

## Tunable layout constants

`src/lib/features/scheduler/lane-width.ts` contains the authoritative named constants for the base width, minimum, step, maximum multiplier, per-booth target width, card inset, time label, favourite-control width, action gap, and stack threshold. Keep these values together when changing lane controls or narrow multi-booth card layout.

## Scope

Only lane-width controls and dense multi-booth item presentation change. Time, item placement, and lane reordering behavior do not change.
