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

	it('pushes only the later item reached by a downward overlap', () => {
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
			{ id: 'later-one', startMinute: 630, endMinute: 650 }
		]);
	});

	it('pushes only the earlier item reached by an upward overlap', () => {
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
			{ id: 'moving', startMinute: 1765, endMinute: 1785 }
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
			{ id: 'moving', startMinute: 610, endMinute: 630 }
		]);
	});

	it('recomputes a downward cascade from baseline when a card moves back before the next item', () => {
		const middle = item('B', 760, 790);
		const next = item('C', 795, 825);
		const movedDown = resolveItemDrop({
			item: middle, items: [middle, next], lane, proposedStartMinute: 770, proposedEndMinute: 800,
			direction: 'down', policy: 'cascade', endMinute: 1800
		});
		const movedBack = resolveItemDrop({
			item: middle, items: [middle, next], lane, proposedStartMinute: 750, proposedEndMinute: 780,
			direction: 'up', policy: 'cascade', endMinute: 1800
		});

		expect(movedDown.patches).toContainEqual({ id: 'C', startMinute: 800, endMinute: 830 });
		expect(movedBack.patches).not.toContainEqual({ id: 'C', startMinute: 800, endMinute: 830 });
	});

	it('moves a selected group by one delta without changing booth assignments', () => {
		const first = item('first', 600, 620, 'A');
		const second = item('second', 630, 650, 'B');
		const result = resolveItemDrop({
			item: first, items: [first, second], lane, selectedItemIds: ['first', 'second'],
			proposedStartMinute: 620, proposedEndMinute: 640, direction: 'down', policy: 'free-booth', endMinute: 1800
		});

		expect(result.patches).toEqual([
			{ id: 'first', startMinute: 620, endMinute: 640 },
			{ id: 'second', startMinute: 650, endMinute: 670 }
		]);
	});
});
