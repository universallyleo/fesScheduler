import { describe, expect, it } from 'vitest';
import { createTimetablePresentation, itemDisplayColor } from './timetable-presentation';
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

describe('multi-booth item stacking', () => {
	it('keeps overlapping booths on small local stack levels instead of using clock minutes', () => {
		const boothLane: Lane = {
			id: 'tokuten',
			name: '特典会',
			type: 'tokuten',
			booths: ['A', 'B']
		};
		const early = { ...item, id: 'early', laneId: 'tokuten', boothId: 'A', startMinute: 600, endMinute: 720 };
		const later = { ...item, id: 'later', laneId: 'tokuten', boothId: 'B', startMinute: 630, endMinute: 660 };
		const presentation = createTimetablePresentation(() => ({
			items: [early, later],
			preferences: { language: 'ja', theme: 'light', snapMinutes: 5, timeZoom: 180, laneWidthMode: 'type', laneWidths: { stage: 140, tokuten: 140, event: 140 }, itemOverlapPolicy: 'allow', compactFavorites: false, blockColorMode: 'full' },
			compactActive: false,
			minuteToY: (minute) => minute,
			laneForItem: () => boothLane,
			itemBottomLine: () => ''
		}));

		expect(presentation.itemStyle(early)).toContain('--item-z:1;');
		expect(presentation.itemStyle(later)).toContain('--item-z:2;');
	});

	it('raises only the active dragged item above its lane while leaving settled items at local levels', () => {
		const presentation = createTimetablePresentation(() => ({
			items: [item],
			preferences: { language: 'ja', theme: 'light', snapMinutes: 5, timeZoom: 180, laneWidthMode: 'type', laneWidths: { stage: 140, tokuten: 140, event: 140 }, itemOverlapPolicy: 'allow', compactFavorites: false, blockColorMode: 'full' },
			compactActive: false,
			minuteToY: (minute) => minute,
			laneForItem: () => lane,
			itemBottomLine: () => '',
			draggingItemId: 'item'
		}));

		expect(presentation.itemStyle(item)).toContain('--item-z:20;');
	});

	it('uses local time order for a settled overlap even outside a multi-booth lane', () => {
		const later = { ...item, id: 'later', startMinute: 610, endMinute: 630 };
		const presentation = createTimetablePresentation(() => ({
			items: [item, later],
			preferences: { language: 'ja', theme: 'light', snapMinutes: 5, timeZoom: 180, laneWidthMode: 'type', laneWidths: { stage: 140, tokuten: 140, event: 140 }, itemOverlapPolicy: 'allow', compactFavorites: false, blockColorMode: 'full' },
			compactActive: false,
			minuteToY: (minute) => minute,
			laneForItem: () => lane,
			itemBottomLine: () => ''
		}));

		expect(presentation.itemStyle(item)).toContain('--item-z:1;');
		expect(presentation.itemStyle(later)).toContain('--item-z:2;');
	});
});
