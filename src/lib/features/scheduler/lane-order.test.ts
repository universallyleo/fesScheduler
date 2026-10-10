import { describe, expect, it } from 'vitest';
import { reorderLanes } from './lane-order';
import type { Lane } from '$lib/types';

const a: Lane = { id: 'a', name: 'A', type: 'stage' };
const b: Lane = { id: 'b', name: 'B', type: 'stage' };
const c: Lane = { id: 'c', name: 'C', type: 'stage' };

describe('lane ordering', () => {
	it('moves the source lane to the target lane position without changing lane objects', () => {
		const lanes = [a, b, c];
		const reordered = reorderLanes(lanes, 'c', 'a');

		expect(reordered.map((lane) => lane.id)).toEqual(['c', 'a', 'b']);
		expect(reordered[0]).toBe(c);
	});

	it('returns the original array for a no-op or invalid move', () => {
		const lanes = [a, b];

		expect(reorderLanes(lanes, 'a', 'a')).toBe(lanes);
		expect(reorderLanes(lanes, 'missing', 'b')).toBe(lanes);
	});
});
