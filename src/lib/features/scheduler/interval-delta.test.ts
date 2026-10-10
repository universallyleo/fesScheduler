import { describe, expect, it } from 'vitest';
import { intervalDeltaText } from './interval-delta';

describe('intervalDeltaText', () => {
	it('shows the fixed five-minute step unless a live value is requested', () => {
		expect(intervalDeltaText(25)).toBe('5分');
		expect(intervalDeltaText(25, true)).toBe('25分');
	});
});
