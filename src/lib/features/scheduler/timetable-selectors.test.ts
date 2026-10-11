import { describe, expect, it } from 'vitest';
import { createTimetableSelectors } from './timetable-selectors';
import type { ScheduleItem } from '$lib/types';

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
