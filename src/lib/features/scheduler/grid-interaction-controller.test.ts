import { describe, expect, it } from 'vitest';
import { createGridInteractionController } from './grid-interaction-controller.svelte';
import type { Festival } from '$lib/types';

function createPointerEvent(): PointerEvent {
	return {
		button: 0,
		currentTarget: {},
		clientY: 0,
		pointerId: 1,
		preventDefault() {},
		stopPropagation() {}
	} as unknown as PointerEvent;
}

function createFixture({ editing = true, compact = false } = {}) {
	const opened: { laneId: string; startMinute: number; endMinute: number; lockDestination: boolean }[] = [];
	const reordered: [string, string][] = [];
	let festival: Festival = {
		id: 'festival', title: 'Test', timezone: 'Asia/Tokyo', artistDirectory: [], updatedAt: '',
		days: [{ id: 'day', date: '2026-10-11', lanes: [{ id: 'lane-a', name: 'A', type: 'stage' }], items: [] }]
	};
	const controller = createGridInteractionController({
		getEditMode: () => editing,
		getCompactActive: () => compact,
		getLanes: () => festival.days[0]?.lanes ?? [],
		getPreferences: () => ({
			language: 'ja',
			theme: 'light',
			snapMinutes: 5,
			timeZoom: 180,
			laneWidth: 140,
			compactFavorites: false,
			blockColorMode: 'full'
		}),
		minuteFromPointer: () => 600,
		updateFestival: (mutator) => {
			const next = structuredClone(festival);
			mutator(next);
			festival = next;
		},
		openNew: (options) => opened.push(options),
		openRelated: () => {},
		notify: () => {},
		reorderLanes: (sourceId, targetId) => reordered.push([sourceId, targetId])
	});
	return { controller, opened, reordered, getFestival: () => festival };
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
});
