import { describe, expect, it } from 'vitest';
import { createGridInteractionController } from './grid-interaction-controller.svelte';
import type { Festival, ScheduleItem, UserPreferences } from '$lib/types';

function createPointerEvent({ clientX = 0, clientY = 0, pointerType = 'mouse' } = {}): PointerEvent {
	return {
		button: 0,
		currentTarget: {},
		clientX,
		clientY,
		pointerId: 1,
		pointerType,
		preventDefault() {},
		stopPropagation() {}
	} as unknown as PointerEvent;
}

function createFixture({
	editing = true,
	compact = false,
	items = [],
	laneWidthMode = 'type' as const,
	laneEndMinute
}: {
	editing?: boolean;
	compact?: boolean;
	items?: ScheduleItem[];
	laneWidthMode?: UserPreferences['laneWidthMode'];
	laneEndMinute?: number;
} = {}) {
	const opened: { laneId: string; startMinute: number; endMinute: number; lockDestination: boolean }[] = [];
	const reordered: [string, string][] = [];
	let updateFestivalCount = 0;
	const preferences: UserPreferences = {
		language: 'ja', theme: 'light', snapMinutes: 5, timeZoom: 180,
		laneWidthMode, laneWidths: { stage: 140, tokuten: 140, event: 140 },
		itemOverlapPolicy: 'allow', compactFavorites: false, blockColorMode: 'full'
	};
	let festival: Festival = {
		id: 'festival', title: 'Test', timezone: 'Asia/Tokyo', artistDirectory: [], updatedAt: '',
		days: [{ id: 'day', date: '2026-10-11', lanes: [{ id: 'lane-a', name: 'A', type: 'stage', endMinute: laneEndMinute }], items }]
	};
	const controller = createGridInteractionController({
		getEditMode: () => editing,
		getCompactActive: () => compact,
		getLanes: () => festival.days[0]?.lanes ?? [],
		getItems: () => festival.days[0]?.items ?? [],
		getPreferences: () => preferences,
		minuteFromPointer: () => 600,
		updateFestival: (mutator) => {
			updateFestivalCount += 1;
			const next = structuredClone(festival);
			mutator(next);
			festival = next;
		},
		updatePreferences: (mutator) => mutator(preferences),
		openNew: (options) => opened.push(options),
		openRelated: () => {},
		notify: () => {},
		reorderLanes: (sourceId, targetId) => reordered.push([sourceId, targetId])
	});
	return { controller, opened, reordered, getFestival: () => festival, preferences, getUpdateFestivalCount: () => updateFestivalCount };
}

function scheduledItem(id: string, startMinute = 600, endMinute = 620): ScheduleItem {
	return {
		id, laneId: 'lane-a', startMinute, endMinute, artistLabel: id,
		artistEntityIds: [], favoriteLevel: 0, pairedTokutenItemIds: []
	};
}

describe('grid item creation', () => {
	it('opens a new item from an edit-mode empty-lane drag without arming add mode', () => {
		const { controller, opened, getFestival } = createFixture();

		controller.beginCreate(createPointerEvent(), 'lane-a');
		controller.handlePointerUp();

		expect(opened).toEqual([
			{ laneId: 'lane-a', startMinute: 600, endMinute: 615, lockDestination: true }
		]);
		expect(getFestival().days[0]?.items).toEqual([]);
	});

	it.each([{ editing: false }, { compact: true }])('does not create outside standard edit mode', (mode) => {
		const { controller, opened } = createFixture(mode);

		controller.beginCreate(createPointerEvent(), 'lane-a');
		controller.handlePointerUp();

		expect(opened).toEqual([]);
	});

	it('reorders only when a header drag finishes over a different lane', () => {
		const { controller, reordered } = createFixture();

		controller.beginLaneReorder(createPointerEvent(), 'lane-a');
		controller.setLaneReorderTarget('lane-b');
		controller.finishLaneReorder();

		expect(reordered).toEqual([['lane-a', 'lane-b']]);
	});

	it('keeps an item movement in preview until the pointer is released', () => {
		const moving = scheduledItem('moving');
		const { controller, getFestival, getUpdateFestivalCount } = createFixture({ items: [moving] });

		controller.beginItemPointer(createPointerEvent(), moving, 'move');
		controller.handlePointerMove(createPointerEvent({ clientY: 30 }));

		expect(controller.itemDragPreview?.patches).toEqual([
			{ id: 'moving', startMinute: 610, endMinute: 630 }
		]);
		expect(getUpdateFestivalCount()).toBe(0);
		expect(getFestival().days[0]?.items[0]).toMatchObject({ startMinute: 600, endMinute: 620 });

		controller.handlePointerUp();
		expect(getUpdateFestivalCount()).toBe(1);
		expect(getFestival().days[0]?.items[0]).toMatchObject({ startMinute: 610, endMinute: 630 });
	});

	it('ignores lane and festival closing limits while dragging', () => {
		const moving = scheduledItem('moving', 1190, 1210);
		const { controller } = createFixture({ items: [moving], laneEndMinute: 1200 });

		controller.beginItemPointer(createPointerEvent(), moving, 'move');
		controller.handlePointerMove(createPointerEvent({ clientY: 30 }));

		expect(controller.itemDragPreview?.patches).toEqual([
			{ id: 'moving', startMinute: 1200, endMinute: 1220 }
		]);
	});

	it('does not begin lane reorder outside edit mode', () => {
		const { controller } = createFixture({ editing: false });

		controller.beginLaneReorder(createPointerEvent(), 'lane-a');

		expect(controller.reorderingLaneId).toBeNull();
	});

	it('locks multi-selection to the first selected lane and toggles selected items', () => {
		const first = scheduledItem('first');
		const otherLane = { ...scheduledItem('other'), laneId: 'lane-b' };
		const { controller } = createFixture({ items: [first, otherLane] });

		controller.setMultiSelectEnabled(true);
		controller.toggleItemSelection(first);
		controller.toggleItemSelection(otherLane);
		expect(controller.selectedItemIds).toEqual(['first']);
		controller.toggleItemSelection(first);
		expect(controller.selectedItemIds).toEqual([]);
	});

	it('moves all selected items by one baseline delta and suppresses the follow-up click', () => {
		const first = scheduledItem('first', 600, 620);
		const second = scheduledItem('second', 630, 650);
		const { controller, getFestival, getUpdateFestivalCount } = createFixture({ items: [first, second] });

		controller.setMultiSelectEnabled(true);
		controller.toggleItemSelection(first);
		controller.toggleItemSelection(second);
		controller.beginItemPointer(createPointerEvent(), first, 'move');
		controller.handlePointerMove(createPointerEvent({ clientY: 30 }));
		controller.handlePointerUp();

		expect(getUpdateFestivalCount()).toBe(1);
		expect(getFestival().days[0]?.items.map((item) => [item.id, item.startMinute, item.endMinute])).toEqual([
			['first', 610, 630], ['second', 640, 660]
		]);
		expect(controller.consumeSuppressedCardClick('first')).toBe(true);
		expect(controller.consumeSuppressedCardClick('first')).toBe(false);
	});
});
