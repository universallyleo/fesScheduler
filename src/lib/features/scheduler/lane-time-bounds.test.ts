import { describe, expect, it } from 'vitest';
import { effectiveLaneEndMinute } from './lane-time-bounds';
import type { FestivalDay, Lane } from '$lib/types';

const lane: Lane = { id: 'lane', name: 'Stage', type: 'stage' };
const day: FestivalDay = { id: 'day', date: '2026-10-13', displayEndMinute: 1320, lanes: [], items: [] };

describe('effectiveLaneEndMinute', () => {

	it('prefers a lane end over the festival-day end', () => {
		expect(effectiveLaneEndMinute({ ...lane, endMinute: 1260 }, day)).toBe(1260);
	});

	it('uses the festival-day end when the lane has no end', () => {
		expect(effectiveLaneEndMinute(lane, day)).toBe(1320);
	});

	it('falls back to 30:00 when neither lane nor day specifies an end', () => {
		expect(effectiveLaneEndMinute(lane, { ...day, displayEndMinute: undefined })).toBe(1800);
	});
});
