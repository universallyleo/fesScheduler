import { describe, expect, it } from 'vitest';
import { currentTimeScrollTop, normalizeToFiveMinuteTime } from './timetable-layout';

describe('five-minute timetable input', () => {
	it('rounds typed time values to the nearest five-minute boundary without exceeding 30:00', () => {
		expect(normalizeToFiveMinuteTime('1012')).toBe('10:10');
		expect(normalizeToFiveMinuteTime('10:13')).toBe('10:15');
		expect(normalizeToFiveMinuteTime('29:58')).toBe('30:00');
	});
});

describe('current-time jump', () => {
	it('centres the current clock time without relying on the selected date', () => {
		expect(currentTimeScrollTop(14 * 60 + 20, 11 * 60, 180, 500)).toBe(350);
		expect(currentTimeScrollTop(9 * 60, 11 * 60, 180, 500)).toBe(0);
	});
});
