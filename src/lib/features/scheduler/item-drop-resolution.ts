import type { ItemOverlapPolicy, Lane, ScheduleItem } from '$lib/types';

const DAY_END_MINUTE = 30 * 60;

export type ItemDropPatch = Pick<ScheduleItem, 'id'> &
	Partial<Pick<ScheduleItem, 'startMinute' | 'endMinute' | 'boothId'>>;

export interface ItemDropResolution {
	patches: ItemDropPatch[];
	hasConflict: boolean;
}

export type ItemDropInput = {
	item: ScheduleItem;
	items: ScheduleItem[];
	lane: Lane;
	proposedStartMinute: number;
	proposedEndMinute: number;
	direction: 'up' | 'down';
	policy: ItemOverlapPolicy;
};

function overlaps(
	first: Pick<ScheduleItem, 'startMinute' | 'endMinute'>,
	second: Pick<ScheduleItem, 'startMinute' | 'endMinute'>
): boolean {
	return first.startMinute < second.endMinute && second.startMinute < first.endMinute;
}

function sameBooth(first: ScheduleItem, second: ScheduleItem): boolean {
	return (first.boothId ?? '') === (second.boothId ?? '');
}

function patchItem(item: ScheduleItem, patches: ItemDropPatch[]): ScheduleItem {
	const patch = patches.find((candidate) => candidate.id === item.id);
	return patch ? { ...item, ...patch } : item;
}

function conflictsFor(
	item: ScheduleItem,
	items: ScheduleItem[],
	patches: ItemDropPatch[]
): boolean {
	const patchedItem = patchItem(item, patches);
	return items.some((candidate) => {
		if (candidate.id === item.id) return false;
		const patchedCandidate = patchItem(candidate, patches);
		return sameBooth(patchedItem, patchedCandidate) && overlaps(patchedItem, patchedCandidate);
	});
}

function placementPatch(
	item: ScheduleItem,
	startMinute: number,
	endMinute: number,
	boothId?: string
): ItemDropPatch {
	return {
		id: item.id,
		startMinute,
		endMinute,
		...(boothId && boothId !== item.boothId ? { boothId } : {})
	};
}

function laneItems(input: ItemDropInput): ScheduleItem[] {
	return input.items.filter((candidate) => candidate.laneId === input.lane.id);
}

export function resolveItemDrop(input: ItemDropInput): ItemDropResolution {
	const minimumMinute = input.lane.openingMinute ?? 0;
	const duration = Math.max(5, input.proposedEndMinute - input.proposedStartMinute);
	const startMinute = Math.max(minimumMinute, Math.min(input.proposedStartMinute, DAY_END_MINUTE - duration));
	const endMinute = startMinute + duration;
	const placement = placementPatch(input.item, startMinute, endMinute);
	const currentLaneItems = laneItems(input);

	if (input.policy === 'free-booth' && input.lane.booths?.length) {
		const targetBoothId = input.lane.booths.find((boothId) => {
			const moved = { ...input.item, ...placement, boothId };
			return !currentLaneItems.some(
				(candidate) =>
					candidate.id !== input.item.id && candidate.boothId === boothId && overlaps(moved, candidate)
			);
		});
		if (targetBoothId) {
			const patch = placementPatch(input.item, startMinute, endMinute, targetBoothId);
			return { patches: [patch], hasConflict: false };
		}
	}

	if (input.policy !== 'cascade') {
		return {
			patches: [placement],
			hasConflict: conflictsFor(input.item, currentLaneItems, [placement])
		};
	}

	const inSameBooth = currentLaneItems.filter(
		(candidate) => candidate.id !== input.item.id && sameBooth(candidate, input.item)
	);
	const moving = { ...input.item, ...placement };
	const shiftCandidates = inSameBooth.filter((candidate) =>
		input.direction === 'down'
			? candidate.startMinute >= input.item.startMinute
			: candidate.endMinute <= input.item.endMinute
	);
	const initialOverlap = shiftCandidates.reduce((largest, candidate) => {
		if (!overlaps(moving, candidate)) return largest;
		return input.direction === 'down'
			? Math.max(largest, moving.endMinute - candidate.startMinute)
			: Math.max(largest, candidate.endMinute - moving.startMinute);
	}, 0);

	if (initialOverlap <= 0) {
		return {
			patches: [placement],
			hasConflict: conflictsFor(input.item, currentLaneItems, [placement])
		};
	}

	const shiftable = shiftCandidates.length
		? input.direction === 'down'
			? Math.max(0, DAY_END_MINUTE - Math.max(...shiftCandidates.map((candidate) => candidate.endMinute)))
			: Math.max(
				0,
				Math.min(...shiftCandidates.map((candidate) => candidate.startMinute)) - minimumMinute
			)
		: 0;
	const appliedShift = Math.min(initialOverlap, shiftable);
	const signedShift = input.direction === 'down' ? appliedShift : -appliedShift;
	const patches = [
		placement,
		...shiftCandidates.map((candidate) =>
			placementPatch(
				candidate,
				candidate.startMinute + signedShift,
				candidate.endMinute + signedShift
			)
		)
	];

	return {
		patches,
		hasConflict:
			appliedShift < initialOverlap ||
			conflictsFor(input.item, currentLaneItems, patches)
	};
}
