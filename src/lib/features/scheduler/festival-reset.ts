import type { Festival } from '$lib/types';

/** Replaces the active timetable without discarding its local saved record. */
export function resetFestival(current: Festival, blankFestival: Festival): Festival {
	return { ...blankFestival, id: current.id };
}

