import { describe, expect, it } from 'vitest';
import { withoutSavedFestival } from './saved-festival-list';
import type { Festival } from '$lib/types';

const festivals = [
	{ id: 'first', title: 'First' },
	{ id: 'second', title: 'Second' },
	{ id: 'third', title: 'Third' }
] as Festival[];

describe('withoutSavedFestival', () => {
	it('removes only the requested local timetable from the saved list', () => {
		expect(withoutSavedFestival(festivals, 'second').map((festival) => festival.id)).toEqual([
			'first',
			'third'
		]);
	});
});
