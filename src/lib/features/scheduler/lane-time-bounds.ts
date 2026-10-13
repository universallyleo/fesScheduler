import type { FestivalDay, Lane } from '$lib/types';

const SCHEDULE_END_MINUTE = 30 * 60;

export function effectiveLaneEndMinute(lane: Lane, day: FestivalDay): number {
	return lane.endMinute ?? day.displayEndMinute ?? SCHEDULE_END_MINUTE;
}
