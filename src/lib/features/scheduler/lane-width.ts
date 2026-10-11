import type { Lane, LaneTypeWidths, LaneWidthMode } from '$lib/types';

export function resolvedLaneBaseWidth(
	lane: Lane,
	mode: LaneWidthMode,
	widths: LaneTypeWidths
): number {
	return mode === 'individual' && lane.width !== undefined ? lane.width : widths[lane.type];
}

export function displayLaneWidth(
	lane: Lane,
	mode: LaneWidthMode,
	widths: LaneTypeWidths
): number {
	const baseWidth = resolvedLaneBaseWidth(lane, mode, widths);
	return lane.type === 'tokuten' && (lane.booths?.length ?? 0) > 2 ? baseWidth * 1.5 : baseWidth;
}
