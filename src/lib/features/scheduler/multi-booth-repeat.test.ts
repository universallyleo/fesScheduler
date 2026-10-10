import { describe, expect, it } from 'vitest';
import { buildMultiBoothRepeat, effectiveBoothOffsets } from './multi-booth-repeat';

describe('multi-booth repeat scheduling', () => {
	it('uses one entered offset as a successive gap between booths', () => {
		expect(effectiveBoothOffsets(['A', 'B', 'C'], [20])).toEqual([0, 20, 40]);
	});

	it('uses one explicit offset for every later booth as offsets from the first booth', () => {
		expect(effectiveBoothOffsets(['A', 'B', 'C'], [20, 45])).toEqual([0, 20, 45]);
	});

	it('copies the repeated pattern to every booth and groups the preview by booth', () => {
		const result = buildMultiBoothRepeat({
			repeat: {
				startMinute: 600,
				endMinute: 615,
				fallbackName: 'A',
				namesText: 'A / B',
				repeatCount: 2,
				restMinutes: 0,
				itemsBeforeRest: 1
			},
			booths: ['A', 'B', 'C'],
			enteredOffsets: [20],
			copyAcrossBooths: true
		});

		expect(result.items.map(({ boothId, startMinute, artistLabel }) => [boothId, startMinute, artistLabel]))
			.toEqual([
				['A', 600, 'A'], ['A', 615, 'B'],
				['B', 620, 'A'], ['B', 635, 'B'],
				['C', 640, 'A'], ['C', 655, 'B']
			]);
		expect(result.preview.map(({ boothId, offset }) => [boothId, offset])).toEqual([
			['A', 0], ['B', 20], ['C', 40]
		]);
	});

	it('omits a booth copy that would end after 30:00', () => {
		const result = buildMultiBoothRepeat({
			repeat: {
				startMinute: 1795,
				endMinute: 1805,
				fallbackName: 'A',
				namesText: '',
				repeatCount: 1,
				restMinutes: 0,
				itemsBeforeRest: 1
			},
			booths: ['A', 'B'],
			enteredOffsets: [5],
			copyAcrossBooths: true
		});

		expect(result.items).toEqual([]);
	});
});
