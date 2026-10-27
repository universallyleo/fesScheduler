import type { Lane, LaneTypeWidths, LaneWidthMode } from '$lib/types';

/** Shared displayed lane width for a freshly opened timetable. */
export const DEFAULT_LANE_WIDTH = 140;
/** Absolute floor for every lane, including multi-booth 特典会 lanes. */
export const MINIMUM_LANE_WIDTH = 120;
/** One press of a lane-header width control changes this many CSS pixels. */
export const LANE_WIDTH_STEP = 10;
/** The largest a lane can grow, expressed as a multiple of its default width. */
export const MAXIMUM_LANE_WIDTH_MULTIPLIER = 4;
/** Target display width for each booth once a 特典会 lane has three or more booths. */
export const MULTI_BOOTH_TARGET_WIDTH = 50;

// These match the visible item-card geometry. Keep them together because the
// stack decision must follow the same layout as the rendered controls.
export const SCHEDULE_BLOCK_HORIZONTAL_INSET = 8;
export const ITEM_TIME_LABEL_WIDTH = 33;
export const FAVORITE_TOGGLE_WIDTH = 17;
export const ITEM_ACTION_GAP = 3;
export const MULTI_BOOTH_ACTION_STACK_WIDTH =
	ITEM_TIME_LABEL_WIDTH + FAVORITE_TOGGLE_WIDTH + ITEM_ACTION_GAP;

/**
 * Multi-booth 特典会 lanes retain the 140px base for two booths. From three
 * booths onward, the lane grows in 50px slices so that each booth remains
 * legible: 3 → 150px, 4 → 200px, 5 → 250px, and so on.
 */
export function multiBoothWidthOffset(lane: Lane): number {
	const boothCount = lane.type === 'tokuten' ? lane.booths?.length ?? 0 : 0;
	return Math.max(0, boothCount * MULTI_BOOTH_TARGET_WIDTH - DEFAULT_LANE_WIDTH);
}

export function minimumLaneDisplayWidth(lane: Lane): number {
	return MINIMUM_LANE_WIDTH + multiBoothWidthOffset(lane);
}

/**
 * Stack the actions when a booth card cannot fit both `xx:xx` and its heart
 * control on the start-time row. The card itself remains percentage based.
 */
export function shouldStackMultiBoothActions(
	lane: Lane,
	displayedLaneWidth: number,
	boothCount = lane.booths?.length ?? 0
): boolean {
	return (
		lane.type === 'tokuten' &&
		boothCount > 1 &&
		(displayedLaneWidth - SCHEDULE_BLOCK_HORIZONTAL_INSET) / boothCount <
			MULTI_BOOTH_ACTION_STACK_WIDTH
	);
}

export function laneDisplayBounds(lane: Lane, displayedGridWidth: number): {
	min: number;
	max: number;
} {
	const min = minimumLaneDisplayWidth(lane);
	const defaultDisplayedWidth = DEFAULT_LANE_WIDTH + multiBoothWidthOffset(lane);
	return {
		min,
		max: Math.max(
			min,
			Math.min(displayedGridWidth, defaultDisplayedWidth * MAXIMUM_LANE_WIDTH_MULTIPLIER)
		)
	};
}

export function canAdjustLaneDisplayWidth(
	lane: Lane,
	currentDisplayedWidth: number,
	displayedGridWidth: number,
	direction: -1 | 1
): boolean {
	const nextWidth = currentDisplayedWidth + direction * LANE_WIDTH_STEP;
	const bounds = laneDisplayBounds(lane, displayedGridWidth);
	// A narrow viewport can make the computed maximum smaller than a lane's
	// already-rendered width. In that state, Width− must remain usable until
	// the lane reaches its own minimum; otherwise the user cannot recover.
	return direction === -1 ? nextWidth >= bounds.min : nextWidth <= bounds.max;
}

export function nextLaneBaseWidth(
	lane: Lane,
	currentDisplayedWidth: number,
	direction: -1 | 1
): number {
	return currentDisplayedWidth + direction * LANE_WIDTH_STEP - multiBoothWidthOffset(lane);
}

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
	return Math.max(baseWidth + multiBoothWidthOffset(lane), minimumLaneDisplayWidth(lane));
}
