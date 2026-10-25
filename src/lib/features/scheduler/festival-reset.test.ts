import { describe, expect, it } from 'vitest';
import { resetFestival } from './festival-reset';
import type { Festival } from '$lib/types';

const current: Festival = {
	id: 'saved-festival',
	title: 'Festival to reset',
	timezone: 'Asia/Tokyo',
	artistDirectory: [],
	days: [],
	updatedAt: '2026-10-25T00:00:00.000Z'
};

const blank: Festival = {
	id: 'new-id',
	title: '新しいフェスティバル',
	timezone: 'Asia/Tokyo',
	artistDirectory: [],
	days: [{ id: 'blank-day', date: '2026-10-25', lanes: [], items: [] }],
	updatedAt: '2026-10-25T00:00:00.000Z'
};

describe('resetFestival', () => {
	it('replaces timetable contents while retaining the active saved record', () => {
		const result = resetFestival(current, blank);

		expect(result).toMatchObject({ id: 'saved-festival', title: '新しいフェスティバル' });
		expect(result.days).toEqual(blank.days);
	});
});

