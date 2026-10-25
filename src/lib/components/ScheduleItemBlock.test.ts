import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ScheduleItemBlock from './ScheduleItemBlock.svelte';
import type { ScheduleItem } from '$lib/types';

const item: ScheduleItem = {
	id: 'item-1',
	laneId: 'lane-1',
	startMinute: 600,
	endMinute: 620,
	artistLabel: 'Artist',
	artistEntityIds: [],
	favoriteLevel: 0,
	pairedTokutenItemIds: []
};

describe('ScheduleItemBlock', () => {
	it('renders an empty favourite control for an unfavourited item', () => {
		const { body } = render(ScheduleItemBlock, {
			props: {
				item,
				style: '',
				visible: true,
				conflict: false,
				partialColor: false,
				compactContent: false,
				editing: false,
				selected: false,
				formatMinute: (minute: number) => `${minute}`,
				bottomLine: '',
				showBottomLine: false,
				booths: [],
				tightMultiBooth: true,
				onCycleFavorite: () => {},
				onOpenRelated: () => {},
				onPointer: () => {},
				onEdit: () => {},
				onDelete: () => {},
				onBoothChange: () => {}
			}
		});

		expect(body).toContain('お気に入りレベルを変更');
		expect(body).toContain('♡');
		expect(body).toContain('multi-booth-tight');
	});
});
