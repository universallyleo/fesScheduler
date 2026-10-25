# Scheduler Header and Grid Navigation Design

## Intent

Make the wide-screen timetable easier to operate by putting festival, browsing, and transfer actions in a compact header; retain grid-specific controls near the grid; and make long/wide timetables navigable without relying on hidden scrollbars.

## Approved layout

- Preserve the existing two-line brand lockup: `LIVE-FES` above `タイムテーブル`.
- On wide screens, use a 100px header:
  - festival title and `LOCAL TIMETABLE · timezone` form one vertically centred identity block;
  - artist search follows the identity block;
  - a two-by-two right action tray has `他のフェス・シェア` over `表示設定`, with theme over language in the second column.
- `他のフェス・シェア` opens one menu for: 新しいフェス, インポート, エクスポート, 共有, リセット, bundled samples, and a plain-language action to reopen locally saved timetables.
- Reset retains the active local festival record and replaces its contents with a blank timetable. It is not a destructive deletion.
- The timetable corner has no TIME label. The whole cell is an icon-only frozen-header toggle, frozen by default. A frozen state is marked by a border on the entire stage-header row, not on the corner control.
- On wide screens, a synchronized viewport-level header layer takes over after the timetable’s native header reaches the top of the client viewport. This avoids the horizontal scroll container trapping the frozen stage headings.
- Keep fixed left/right horizontal-scroll buttons when the scrollbar is below the viewport, and retain `現在時刻へ`.
- Add `ページ最上部へ` outside the grid at the client viewport’s lower right.
- Move favourite filtering to a floating button immediately above 編集. Its drawer offers 0, ♥1+, ♥2+, and ♥3; 0 replaces ALL.
- Start and end time in every item cell use the same font style and size.

## Constraints

- No new hover animations, decorative motion, or changed interactions beyond the requested controls.
- Existing mobile behavior remains compact; the header reflow is wide-screen focused.
- Do not remove existing import/export/share/sample capabilities; regroup them.

