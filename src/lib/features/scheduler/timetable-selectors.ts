import { getRelatedItemIds, normalizeArtistLabel } from '$lib/scheduler';
import type { Festival, Lane, ScheduleItem } from '$lib/types';

type SelectorContext = {
	items: ScheduleItem[];
	lanes: Lane[];
	searchNormalized: string;
	favoriteFilter: 0 | 1 | 2 | 3;
	editDraft: ScheduleItem | null;
	artistDirectory: Festival['artistDirectory'];
};

export function createTimetableSelectors(context: () => SelectorContext) {
	function displayItem(item: ScheduleItem): boolean {
		const { searchNormalized } = context();
		return !searchNormalized || item.artistLabel.normalize('NFKC').toLocaleLowerCase().includes(searchNormalized);
	}

	function itemForLane(laneId: string): ScheduleItem[] {
		const { favoriteFilter, items } = context();
		return items.filter((item) => item.laneId === laneId && (favoriteFilter === 0 || item.favoriteLevel >= favoriteFilter));
	}

	function laneForItem(item: ScheduleItem): Lane | undefined {
		return context().lanes.find((lane) => lane.id === item.laneId);
	}

	function itemBottomLine(item: ScheduleItem): string {
		const lane = laneForItem(item);
		if (lane?.type === 'tokuten' && lane.booths?.length) return item.boothId ?? lane.booths[0] ?? '';
		return lane?.venueName || item.subContent || lane?.name || '';
	}

	function relatedItemsForLane(lane: Lane): ScheduleItem[] {
		return context()
			.items
			.filter((item) => item.laneId === lane.id && item.id !== context().editDraft?.id)
			.sort(
				(left, right) =>
					left.startMinute - right.startMinute ||
					left.endMinute - right.endMinute ||
					left.artistLabel.localeCompare(right.artistLabel, 'ja')
			);
	}

	function relatedItemsForBooth(lane: Lane, booth: string): ScheduleItem[] {
		return relatedItemsForLane(lane).filter((item) => (item.boothId ?? lane.booths?.[0]) === booth);
	}

	function shouldExpandRelatedBranch(candidates: ScheduleItem[]): boolean {
		const draft = context().editDraft;
		if (!draft) return false;
		const draftArtist = normalizeArtistLabel(draft.artistLabel).replace(/\s+/g, '');
		return candidates.some((item) => {
			const candidateArtist = normalizeArtistLabel(item.artistLabel).replace(/\s+/g, '');
			const hasPartialArtistMatch =
				Boolean(draftArtist) &&
				Boolean(candidateArtist) &&
				(draftArtist.includes(candidateArtist) || candidateArtist.includes(draftArtist));
			return (
				hasPartialArtistMatch ||
				draft.pairedTokutenItemIds.includes(item.id) ||
				item.pairedTokutenItemIds.includes(draft.id)
			);
		});
	}

	function allRelatedItemIds(selectedItemId: string): string[] {
		const { artistDirectory, items } = context();
		const itemIds = [selectedItemId];
		const seen = new Set(itemIds);
		for (let index = 0; index < itemIds.length; index += 1) {
			for (const relatedItemId of getRelatedItemIds(items, artistDirectory, itemIds[index])) {
				if (seen.has(relatedItemId)) continue;
				seen.add(relatedItemId);
				itemIds.push(relatedItemId);
			}
		}
		return itemIds;
	}

	function relatedEventItems(lane: Lane): ScheduleItem[] {
		const { artistDirectory, items } = context();
		const ids = new Set<string>();
		for (const item of items.filter((candidate) => candidate.laneId === lane.id)) {
			for (const relatedId of getRelatedItemIds(items, artistDirectory, item.id)) ids.add(relatedId);
			for (const pairedId of item.pairedTokutenItemIds) ids.add(pairedId);
		}
		return items.filter((item) => ids.has(item.id));
	}

	return {
		displayItem,
		itemForLane,
		laneForItem,
		itemBottomLine,
		relatedItemsForLane,
		relatedItemsForBooth,
		shouldExpandRelatedBranch,
		allRelatedItemIds,
		relatedEventItems,
	};
}
