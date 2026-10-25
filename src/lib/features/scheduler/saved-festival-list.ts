import type { Festival } from '$lib/types';

export function withoutSavedFestival(festivals: Festival[], id: string): Festival[] {
	return festivals.filter((festival) => festival.id !== id);
}
