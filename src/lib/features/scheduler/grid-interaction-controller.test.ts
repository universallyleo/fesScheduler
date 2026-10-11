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
	laneWidthMode = 'type' as const
}: {
	editing?: boolean;
	compact?: boolean;
	items?: ScheduleItem[];
	laneWidthMode?: UserPreferences['laneWidthMode'];
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
		days: [{ id: 'day', date: '2026-10-11', lanes: [{ id: 'lane-a', name: 'A', type: 'stage' }], items }]
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

	it('does not begin lane resize or reorder outside edit mode', () => {
		const { controller } = createFixture({ editing: false });

		controller.beginLaneResize(createPointerEvent(), 'lane-a');
		controller.beginLaneReorder(createPointerEvent(), 'lane-a');

		expect(controller.laneResizePreview).toBeNull();
		expect(controller.reorderingLaneId).toBeNull();
	});

	it('changes each lane type width through a divider drag in type mode', () => {
		const { controller, preferences } = createFixture();

		controller.beginLaneResize(createPointerEvent(), 'lane-a');
		controller.updateLaneResize(createPointerEvent({ clientX: 30 }));
		controller.finishLaneResize();

		expect(preferences.laneWidths.stage).toBe(170);
	});

	it('writes one lane override through a divider drag in individual mode', () => {
		const { controller, getFestival, preferences } = createFixture({ laneWidthMode: 'individual' });

		controller.beginLaneResize(createPointerEvent(), 'lane-a');
		controller.updateLaneResize(createPointerEvent({ clientX: 30 }));
		controller.finishLaneResize();

		expect(preferences.laneWidths.stage).toBe(140);
		expect(getFestival().days[0]?.lanes[0]?.width).toBe(170);
	});
});
