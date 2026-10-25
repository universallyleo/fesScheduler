import { describe, expect, it } from 'vitest';
import { createTimetableSelectors } from './timetable-selectors';
import type { Lane, ScheduleItem } from '$lib/types';

const item = (id: string, artistLabel: string): ScheduleItem => ({
	id,
	laneId: 'lane',
	startMinute: 600,
	endMinute: 620,
	artistLabel,
	artistEntityIds: [],
	favoriteLevel: 0,
	pairedTokutenItemIds: []
});

describe('related event suggestions', () => {
	it('lists items in chronological order instead of their creation order', () => {
		const lane: Lane = { id: 'event', name: 'イベント・インフォ', type: 'event', color: '#5c9ed6' };
		const selectors = createTimetableSelectors(() => ({
			items: [
				{ ...item('created-last', '終演後案内'), laneId: 'event', startMinute: 660, endMinute: 690 },
				{ ...item('created-first', 'Wristband交換'), laneId: 'event', startMinute: 540, endMinute: 570 },
				{ ...item('same-time', '入場案内'), laneId: 'event', startMinute: 540, endMinute: 565 }
			],
			lanes: [lane],
			searchNormalized: '',
			favoriteFilter: 0,
			editDraft: null,
			artistDirectory: []
		}));

		expect(selectors.relatedItemsForLane(lane).map((candidate) => candidate.id)).toEqual([
			'same-time',
			'created-first',
			'created-last'
		]);
	});

	it('expands a lane for a partial normalized artist-name match', () => {
		const draft = item('draft', 'MaryCrown');
		const selectors = createTimetableSelectors(() => ({
			items: [draft, item('candidate', 'Mary')],
			lanes: [],
			searchNormalized: '',
			favoriteFilter: 0,
			editDraft: draft,
			artistDirectory: []
		}));

		expect(selectors.shouldExpandRelatedBranch([item('candidate', 'Mary')])).toBe(true);
	});

	it('matches a partial artist name even when one label includes spaces', () => {
		const draft = item('draft', 'Mary Crown');
		const selectors = createTimetableSelectors(() => ({
			items: [draft, item('candidate', 'MaryCrown')],
			lanes: [],
			searchNormalized: '',
			favoriteFilter: 0,
			editDraft: draft,
			artistDirectory: []
		}));

		expect(selectors.shouldExpandRelatedBranch([item('candidate', 'MaryCrown')])).toBe(true);
	});
});
