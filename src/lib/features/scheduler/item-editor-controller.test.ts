import { describe, expect, it } from 'vitest';
import { createItemEditorController } from './item-editor-controller.svelte';
import type { Festival } from '$lib/types';

function createFixture() {
	let festival: Festival = {
		id: 'festival',
		title: 'Test festival',
		timezone: 'Asia/Tokyo',
		artistDirectory: [],
		updatedAt: '',
		days: [{
			id: 'day',
			date: '2026-10-11',
			lanes: [{ id: 'lane-a', name: 'Stage', type: 'stage', color: '#226b72' }],
			items: []
		}]
	};
	const notices: string[] = [];
	let nextId = 1;
	const controller = createItemEditorController({
		getItems: () => festival.days[0]?.items ?? [],
		getLanes: () => festival.days[0]?.lanes ?? [],
		getSelectedDayId: () => 'day',
		isEditingEnabled: () => true,
		updateFestival: (mutator) => {
			const next = structuredClone(festival);
			mutator(next);
			festival = next;
		},
		newId: () => `new-${nextId++}`,
		notify: (message) => notices.push(message),
		laneTypeLabel: (type) => type,
		getLaneEndMinute: () => 30 * 60
	});
	return { controller, getFestival: () => festival, notices };
}

describe('item editor controller new item drafts', () => {
	it('makes the saved simultaneous-event group match the checked items', () => {
		const { controller, getFestival } = createFixture();
		const items = getFestival().days[0]!.items;
		items.push(
			{
				id: 'current', laneId: 'lane-a', startMinute: 600, endMinute: 630,
				artistLabel: 'Wristband交換', subContent: '', artistEntityIds: [], favoriteLevel: 0,
				pairedTokutenItemIds: [], sharedEventGroupId: 'current-group'
			},
			{
				id: 'former-member', laneId: 'lane-a', startMinute: 600, endMinute: 630,
				artistLabel: 'Wristband交換', subContent: '', artistEntityIds: [], favoriteLevel: 0,
				pairedTokutenItemIds: [], sharedEventGroupId: 'current-group'
			},
			{
				id: 'selected', laneId: 'lane-a', startMinute: 600, endMinute: 630,
				artistLabel: 'Wristband交換', subContent: '', artistEntityIds: [], favoriteLevel: 0,
				pairedTokutenItemIds: [], sharedEventGroupId: 'other-group'
			}
		);

		controller.open(items[0]!);
		expect(controller.sharedEventItemIds).toEqual(['former-member']);
		controller.toggleSharedEventItem('former-member');
		controller.toggleSharedEventItem('selected');
		controller.save();

		expect(getFestival().days[0]!.items.map((item) => [item.id, item.sharedEventGroupId])).toEqual([
			['current', 'current-group'],
			['former-member', undefined],
			['selected', 'current-group']
		]);
	});

	it('keeps a manually opened new item outside the festival until it is saved', () => {
		const { controller, getFestival, notices } = createFixture();

		controller.openNew();

		expect(getFestival().days[0]?.items).toEqual([]);
		expect(controller.destinationLocked).toBe(false);
		controller.save();
		expect(notices).toContain('追加先レーンを選択してください');
	});

	it('locks the destination for a drag-created new item', () => {
		const { controller } = createFixture();

		controller.openNew({ laneId: 'lane-a', startMinute: 600, endMinute: 615, lockDestination: true });

		expect(controller.draft?.laneId).toBe('lane-a');
		expect(controller.destinationLocked).toBe(true);
	});

	it('saves a repeated pattern for each booth when booth copying is enabled', () => {
		const { controller, getFestival } = createFixture();
		getFestival().days[0]?.lanes.splice(0, 1, {
			id: 'tokuten',
			name: '特典会',
			type: 'tokuten',
			color: '#777777',
			booths: ['A', 'B']
		});

		controller.openNew({ laneId: 'tokuten', startMinute: 600, endMinute: 615, lockDestination: true });
		controller.setRepeatEnabled(true);
		controller.setRepeatCount(2);
		controller.setRepeatRestMinutes(0);
		controller.setCopyAcrossBooths(true);
		controller.setBoothOffsets([20]);
		controller.save();

		expect(getFestival().days[0]?.items.map(({ boothId, startMinute }) => [boothId, startMinute]))
			.toEqual([['A', 600], ['A', 615], ['B', 620], ['B', 635]]);
	});

	it('removes one explicit booth offset while preserving the sequential offset', () => {
		const { controller, getFestival } = createFixture();
		getFestival().days[0]?.lanes.splice(0, 1, {
			id: 'tokuten',
			name: '特典会',
			type: 'tokuten',
			color: '#777777',
			booths: ['A', 'B', 'C']
		});

		controller.openNew({ laneId: 'tokuten' });
		controller.setBoothOffsets([20, 45]);
		controller.removeBoothOffset(1);

		expect(controller.boothOffsets).toEqual([20]);
	});
});
