# Shared Event Conflict Exemption Design

## Intent

Allow intentionally simultaneous copies of one operational event—such as `Wristband交換` in several lanes—to coexist without an artist-conflict warning, while preserving every genuine same-lane and same-booth collision warning.

## Chosen approach

Each `ScheduleItem` gains an optional `sharedEventGroupId`. Items with the same non-empty group ID are recognised as one simultaneous event group. The item editor exposes a `同時開催グループ` item picker, using the same lane → booth → item hierarchy as `関連するイベント`; it never accepts a typed group label.

`detectConflicts` continues to report same-lane/same-booth time overlaps unconditionally. It suppresses only a cross-lane `sameArtist` conflict when both overlapping items share the same non-empty `sharedEventGroupId`.

## Why this approach

- It is explicit and persisted with the timetable, rather than guessing from identical names or times.
- It selects actual schedule items, so an unintended item cannot join merely by sharing a typed label.
- It limits the exemption to the intended copies of an event.
- It does not change drag/drop collision handling or conceal occupancy problems within a lane or booth.
- Existing files without the property remain fully compatible and continue using current warning behavior.

## UI behavior

- The editor label is `同時開催グループ`.
- The selector shows the existing lane → booth → item hierarchy and excludes the current item.
- On `保存`, the current item plus its checked items become the exact membership of one group. A checked item moves out of any former group into this group.
- When editing an existing group, unchecked former members leave that group. If nothing is checked, only the current item leaves; the remaining former members retain their old group.
- Empty means ordinary conflict detection.
- A helper note explains that items in one group do not produce a cross-lane artist-overlap warning, but same-lane and same-booth warnings remain.

## Verification

- Same-label overlapping items in different lanes warn by default.
- Matching non-empty group IDs suppress only their cross-lane artist warning.
- Different groups still warn.
- Matching groups in one lane/booth still report the lane conflict.
