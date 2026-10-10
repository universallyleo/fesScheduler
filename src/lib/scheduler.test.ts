import { describe, expect, it } from 'vitest';
import {
	computeGridRange,
	detectConflicts,
	packCompactItems,
	snapMinutes,
	cycleFavorite,
	getSharedLaneOpeningMinute,
	getRelatedItemIds,
	readableTextColor
} from './scheduler';
import type { ArtistEntity, Lane, ScheduleItem } from './types';

const item = (
	id: string,
	laneId: string,
	startMinute: number,
	endMinute: number,
	artistLabel: string
): ScheduleItem => ({
	id,
	laneId,
	startMinute,
	endMinute,
	artistLabel,
	subContent: '',
	artistEntityIds: [],
	favoriteLevel: 0,
	pairedTokutenItemIds: []
});

describe('scheduler pure functions', () => {
	it('snaps minutes to the nearest configured increment', () => {
		expect(snapMinutes(12, 15)).toBe(15);
		expect(snapMinutes(22, 15)).toBe(15);
		expect(snapMinutes(23, 15)).toBe(30);
	});

	it('derives a padded grid range and respects explicit opening time', () => {
		expect(computeGridRange([], undefined)).toEqual({ startMinute: 0, endMinute: 1440 });
		expect(computeGridRange([item('a', 'main', 630, 720, 'A')], undefined)).toEqual({
			startMinute: 600,
			endMinute: 1440
		});
		expect(computeGridRange([item('a', 'main', 1380, 1500, 'A')], 1320)).toEqual({
			startMinute: 1320,
			endMinute: 1560
		});
	});

	it('uses the earliest lane opening only when every lane has one', () => {
		const lanes: Lane[] = [
			{ id: 'main', name: 'メイン', type: 'stage', openingMinute: 660 },
			{ id: 'sub', name: 'サブ', type: 'stage', openingMinute: 630 }
		];
		expect(getSharedLaneOpeningMinute(lanes)).toBe(630);
		expect(getSharedLaneOpeningMinute([{ ...lanes[0] }, { ...lanes[1], openingMinute: undefined }])).toBeUndefined();
		expect(getSharedLaneOpeningMinute([])).toBeUndefined();
	});

	it('packs filtered intervals into the leftmost non-overlapping columns', () => {
		const result = packCompactItems([
			item('a', 'main', 600, 660, 'A'),
			item('b', 'garden', 630, 690, 'B'),
			item('c', 'tokuten', 690, 720, 'C')
		]);
		expect(result.map((entry) => [entry.item.id, entry.column])).toEqual([
			['a', 0],
			['b', 1],
			['c', 0]
		]);
	});

	it('reports same-lane and normalized artist conflicts without dropping items', () => {
		const conflicts = detectConflicts([
			item('a', 'main', 600, 660, 'Ａ'),
			item('b', 'main', 630, 690, 'A'),
			item('c', 'garden', 630, 690, 'a')
		]);
		expect(conflicts.sameLane.map((pair) => pair.sort())).toContainEqual(['a', 'b']);
		expect(conflicts.sameArtist.map((pair) => pair.sort())).toContainEqual(['a', 'b']);
		expect(conflicts.sameArtist.map((pair) => pair.sort())).toContainEqual(['a', 'c']);
	});

	it('cycles favorite levels from zero through three', () => {
		expect(cycleFavorite(0)).toBe(1);
		expect(cycleFavorite(3)).toBe(0);
	});

	it('finds related group and member items', () => {
		const entities: ArtistEntity[] = [
			{ id: 'group', kind: 'group', name: '星組', memberIds: ['member-a', 'member-b'] },
			{ id: 'member-a', kind: 'member', name: 'A', groupIds: ['group'] },
			{ id: 'member-b', kind: 'member', name: 'B', groupIds: ['group'] }
		];
		const items = [
			{ ...item('stage', 'main', 600, 660, '星組'), artistEntityIds: ['group'] },
			{ ...item('benefit-a', 'tokuten', 700, 730, 'A'), artistEntityIds: ['member-a'] },
			{ ...item('other', 'main', 700, 730, '別組'), artistEntityIds: [] }
		];
		expect(getRelatedItemIds(items, entities, 'stage')).toEqual(['benefit-a']);
	});

	it('chooses readable foreground colors for lane colors', () => {
		expect(readableTextColor('#fff4c2')).toBe('#13262b');
		expect(readableTextColor('#243447')).toBe('#ffffff');
		expect(readableTextColor('not-a-color')).toBe('#13262b');
	});
});
