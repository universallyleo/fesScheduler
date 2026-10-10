import { describe, expect, it } from 'vitest';
import { itemDisplayColor } from './timetable-presentation';
import type { Lane, ScheduleItem } from '$lib/types';

const lane: Lane = { id: 'stage', name: 'Stage', type: 'stage', color: '#ff8800' };
const item: ScheduleItem = {
	id: 'item', laneId: 'stage', startMinute: 600, endMinute: 615, artistLabel: 'A',
	artistEntityIds: [], favoriteLevel: 0, pairedTokutenItemIds: []
};

describe('item presentation color', () => {
	it('uses gray for a tokuten item and otherwise uses its override or lane color', () => {
		expect(itemDisplayColor({ ...item, itemType: 'tokuten' }, lane)).toBe('var(--tokuten-item)');
		expect(itemDisplayColor({ ...item, itemType: 'event', color: '#123456' }, lane)).toBe('#123456');
		expect(itemDisplayColor(item, lane)).toBe('#ff8800');
	});
});
