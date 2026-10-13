import { describe, expect, it } from 'vitest';
import { buildRepeatPreview, buildRepeatedItemSpecs, countRepeatNames, maximumRepeatCount, reconcileRepeatCount } from './repeat-items';

describe('repeated item scheduling', () => {
	it('trims full-width slash-separated names and repeats the final name', () => {
		const items = buildRepeatedItemSpecs({
			startMinute: 600,
			endMinute: 615,
			fallbackName: '新しい項目',
			namesText: ' groupA ／ groupB ',
			repeatCount: 4,
			restMinutes: 0,
			itemsBeforeRest: 1
		});
		expect(items.map((item) => item.artistLabel)).toEqual(['groupA', 'groupB', 'groupB', 'groupB']);
	});

	it('inserts rest after the configured cadence', () => {
		expect(
			buildRepeatedItemSpecs({
				startMinute: 600,
				endMinute: 615,
				fallbackName: 'A',
				namesText: '',
				repeatCount: 4,
				restMinutes: 5,
				itemsBeforeRest: 2
			}).map(({ startMinute, endMinute }) => [startMinute, endMinute])
		).toEqual([
			[600, 615],
			[615, 630],
			[635, 650],
			[650, 665]
		]);
	});

	it('caps repeat count at items ending no later than 30:00', () => {
		const input = {
			startMinute: 1410,
			endMinute: 1425,
			restMinutes: 0,
			itemsBeforeRest: 1
		};
		expect(maximumRepeatCount(input)).toBe(26);
		expect(maximumRepeatCount({ ...input, restMinutes: 5 })).toBe(19);
		expect(
			maximumRepeatCount({
				startMinute: 1795,
				endMinute: 1805,
				restMinutes: 0,
				itemsBeforeRest: 1
			})
		).toBe(0);
	});

	it('caps repeat count at the supplied schedule end', () => {
		expect(maximumRepeatCount({ startMinute: 600, endMinute: 630, restMinutes: 0, itemsBeforeRest: 1 }, 690)).toBe(3);
	});

	it('reconciles entered names only at save time', () => {
		expect(reconcileRepeatCount(1, ' A / B ／ C ', 2)).toBe(2);
		expect(reconcileRepeatCount(1, ' A / B ', 8)).toBe(2);
		expect(reconcileRepeatCount(4, '', 8)).toBe(4);
	});

	it('counts non-empty ASCII and full-width slash-separated names', () => {
		expect(countRepeatNames(' groupA / ／ groupB ／ ')).toBe(2);
	});

	it('adds a standalone rest row between the configured repeated items', () => {
		expect(
			buildRepeatPreview({
				startMinute: 600,
				endMinute: 615,
				fallbackName: 'A',
				namesText: '',
				repeatCount: 3,
				restMinutes: 10,
				itemsBeforeRest: 2
			}).map((entry) => entry.kind === 'rest' ? entry.minutes : entry.artistLabel)
		).toEqual(['A', 'A', 10, 'A']);
	});
});
