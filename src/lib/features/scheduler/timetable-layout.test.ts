import { describe, expect, it } from 'vitest';
import { normalizeToFiveMinuteTime } from './timetable-layout';

describe('five-minute timetable input', () => {
	it('rounds typed time values to the nearest five-minute boundary without exceeding 30:00', () => {
		expect(normalizeToFiveMinuteTime('1012')).toBe('10:10');
		expect(normalizeToFiveMinuteTime('10:13')).toBe('10:15');
		expect(normalizeToFiveMinuteTime('29:58')).toBe('30:00');
	});
});
