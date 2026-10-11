import { describe, expect, it } from 'vitest';
import { resolveItemDrop } from './item-drop-resolution';
import type { Lane, ScheduleItem } from '$lib/types';

const lane: Lane = { id: 'tokuten', name: '特典会', type: 'tokuten', booths: ['A', 'B'] };

function item(
	id: string,
	startMinute: number,
	endMinute: number,
	boothId = 'A'
): ScheduleItem {
	return {
		id,
		laneId: lane.id,
		startMinute,
		endMinute,
		boothId,
		artistLabel: id,
		artistEntityIds: [],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	};
}

describe('resolveItemDrop', () => {
	it('keeps an overlapping placement and reports it for the allow policy', () => {
		const moving = item('moving', 600, 620);
		const result = resolveItemDrop({
			item: moving,
			items: [moving, item('existing', 615, 640)],
			lane,
			proposedStartMinute: 610,
			proposedEndMinute: 630,
			direction: 'down',
			policy: 'allow'
		});

		expect(result.hasConflict).toBe(true);
		expect(result.patches).toEqual([{ id: 'moving', startMinute: 610, endMinute: 630 }]);
	});

	it('uses an available booth for the free-booth policy', () => {
		const moving = item('moving', 600, 620, 'A');
		const result = resolveItemDrop({
			item: moving,
			items: [moving, item('occupied', 610, 640, 'A')],
			lane,
			proposedStartMinute: 610,
			proposedEndMinute: 630,
			direction: 'down',
			policy: 'free-booth'
		});

		expect(result.hasConflict).toBe(false);
		expect(result.patches).toEqual([
			{ id: 'moving', startMinute: 610, endMinute: 630, boothId: 'B' }
		]);
	});

	it('keeps the current booth and reports a conflict when no booth is free', () => {
		const moving = item('moving', 600, 620, 'A');
		const result = resolveItemDrop({
			item: moving,
			items: [moving, item('occupied-a', 610, 640, 'A'), item('occupied-b', 610, 640, 'B')],
			lane,
			proposedStartMinute: 610,
			proposedEndMinute: 630,
			direction: 'down',
			policy: 'free-booth'
		});

		expect(result.hasConflict).toBe(true);
		expect(result.patches).toEqual([{ id: 'moving', startMinute: 610, endMinute: 630 }]);
	});

	it('pushes a later run down by the overlap amount', () => {
		const moving = item('moving', 600, 620);
		const result = resolveItemDrop({
			item: moving,
			items: [moving, item('later-one', 620, 640), item('later-two', 660, 680)],
			lane,
			proposedStartMinute: 610,
			proposedEndMinute: 630,
			direction: 'down',
			policy: 'cascade'
		});

		expect(result.hasConflict).toBe(false);
		expect(result.patches).toEqual([
			{ id: 'moving', startMinute: 610, endMinute: 630 },
			{ id: 'later-one', startMinute: 630, endMinute: 650 },
			{ id: 'later-two', startMinute: 670, endMinute: 690 }
		]);
	});

	it('pushes an earlier run upward by the overlap amount', () => {
		const moving = item('moving', 640, 660);
		const result = resolveItemDrop({
			item: moving,
			items: [item('earlier-one', 570, 590), item('earlier-two', 600, 620), moving],
			lane,
			proposedStartMinute: 610,
			proposedEndMinute: 630,
			direction: 'up',
			policy: 'cascade'
		});

		expect(result.hasConflict).toBe(false);
		expect(result.patches).toEqual([
			{ id: 'moving', startMinute: 610, endMinute: 630 },
			{ id: 'earlier-one', startMinute: 560, endMinute: 580 },
			{ id: 'earlier-two', startMinute: 590, endMinute: 610 }
		]);
	});

	it('caps a downward cascade at 30:00 and reports the remaining overlap', () => {
		const moving = item('moving', 1700, 1720);
		const result = resolveItemDrop({
			item: moving,
			items: [moving, item('later', 1775, 1800)],
			lane,
			proposedStartMinute: 1765,
			proposedEndMinute: 1785,
			direction: 'down',
			policy: 'cascade'
		});

		expect(result.hasConflict).toBe(true);
		expect(result.patches).toEqual([
			{ id: 'moving', startMinute: 1765, endMinute: 1785 },
			{ id: 'later', startMinute: 1775, endMinute: 1800 }
		]);
	});

	it('caps an upward cascade at the lane opening time and reports the remaining overlap', () => {
		const openingLane = { ...lane, openingMinute: 600 };
		const moving = item('moving', 640, 660);
		const result = resolveItemDrop({
			item: moving,
			items: [item('earlier', 600, 620), moving],
			lane: openingLane,
			proposedStartMinute: 610,
			proposedEndMinute: 630,
			direction: 'up',
			policy: 'cascade'
		});

		expect(result.hasConflict).toBe(true);
		expect(result.patches).toEqual([
			{ id: 'moving', startMinute: 610, endMinute: 630 },
			{ id: 'earlier', startMinute: 600, endMinute: 620 }
		]);
	});
});
