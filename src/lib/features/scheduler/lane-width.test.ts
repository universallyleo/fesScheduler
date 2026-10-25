import { describe, expect, it } from 'vitest';
import {
	canAdjustLaneDisplayWidth,
	displayLaneWidth,
	laneDisplayBounds,
	nextLaneBaseWidth,
	resolvedLaneBaseWidth,
	shouldStackMultiBoothActions
} from './lane-width';
import type { Lane, LaneTypeWidths } from '$lib/types';

const widths: LaneTypeWidths = { stage: 152, tokuten: 168, event: 140 };

describe('lane widths', () => {
	it('inherits the configured type width by default', () => {
		const lane: Lane = { id: 'stage', name: 'メイン', type: 'stage' };
		expect(resolvedLaneBaseWidth(lane, 'type', widths)).toBe(152);
	});

	it('uses a lane override only in individual width mode', () => {
		const lane: Lane = { id: 'event', name: 'インフォ', type: 'event', width: 220 };
		expect(resolvedLaneBaseWidth(lane, 'type', widths)).toBe(140);
		expect(resolvedLaneBaseWidth(lane, 'individual', widths)).toBe(220);
	});

	it('gives more booths proportionally wider defaults while preserving the shared base width', () => {
		const lane = (boothCount: number): Lane => ({
			id: `tokuten-${boothCount}`,
			name: '特典会',
			type: 'tokuten',
			width: 140,
			booths: Array.from({ length: boothCount }, (_, index) => String(index))
		});

		expect(displayLaneWidth(lane(2), 'individual', widths)).toBe(140);
		expect(displayLaneWidth(lane(3), 'individual', widths)).toBe(150);
		expect(displayLaneWidth(lane(4), 'individual', widths)).toBe(200);
		expect(displayLaneWidth(lane(5), 'individual', widths)).toBe(250);
		expect(nextLaneBaseWidth(lane(4), 200, -1)).toBe(130);
	});

	it('uses booth-aware bounds and disables only when the next 10px step crosses a bound', () => {
		const single: Lane = { id: 'single', name: 'Single', type: 'stage' };
		const threeBooths: Lane = {
			id: 'booths', name: 'Booths', type: 'tokuten', booths: ['A', 'B', 'C']
		};

		expect(laneDisplayBounds(single, 900)).toEqual({ min: 120, max: 560 });
		expect(laneDisplayBounds(threeBooths, 640)).toEqual({ min: 130, max: 600 });
		expect(canAdjustLaneDisplayWidth(single, 550, 900, 1)).toBe(true);
		expect(canAdjustLaneDisplayWidth(single, 560, 900, 1)).toBe(false);
		expect(canAdjustLaneDisplayWidth(single, 120, 900, -1)).toBe(false);
	});

	it('permits two 10px decreases from a three-booth default', () => {
		const threeBooths: Lane = {
			id: 'booths',
			name: 'Booths',
			type: 'tokuten',
			booths: ['A', 'B', 'C']
		};

		expect(canAdjustLaneDisplayWidth(threeBooths, 150, 180, -1)).toBe(true);
		expect(canAdjustLaneDisplayWidth(threeBooths, 140, 180, -1)).toBe(true);
		expect(canAdjustLaneDisplayWidth(threeBooths, 130, 180, -1)).toBe(false);
	});

	it('stacks multi-booth controls when the time and heart cannot share a booth cell', () => {
		const lane: Lane = {
			id: 'booths', name: 'Booths', type: 'tokuten', booths: ['A', 'B', 'C']
		};

		expect(shouldStackMultiBoothActions(lane, 140)).toBe(true);
		expect(shouldStackMultiBoothActions(lane, 180)).toBe(false);
	});
});
