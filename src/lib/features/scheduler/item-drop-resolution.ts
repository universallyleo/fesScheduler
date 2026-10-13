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
	selectedItemIds?: string[];
	endMinute?: number;
};

function overlaps(first: Pick<ScheduleItem, 'startMinute' | 'endMinute'>, second: Pick<ScheduleItem, 'startMinute' | 'endMinute'>): boolean {
	return first.startMinute < second.endMinute && second.startMinute < first.endMinute;
}

function sameBooth(first: ScheduleItem, second: ScheduleItem): boolean {
	return (first.boothId ?? '') === (second.boothId ?? '');
}

function toPatch(item: ScheduleItem, startMinute: number, endMinute: number, boothId?: string): ItemDropPatch {
	return { id: item.id, startMinute, endMinute, ...(boothId && boothId !== item.boothId ? { boothId } : {}) };
}

function applyPatches(item: ScheduleItem, patches: ItemDropPatch[]): ScheduleItem {
	return { ...item, ...(patches.find((patch) => patch.id === item.id) ?? {}) };
}

function conflicts(items: ScheduleItem[], patches: ItemDropPatch[]): boolean {
	return items.some((item, index) => {
		const displayed = applyPatches(item, patches);
		return items.slice(index + 1).some((candidate) => {
			const displayedCandidate = applyPatches(candidate, patches);
			return sameBooth(displayed, displayedCandidate) && overlaps(displayed, displayedCandidate);
		});
	});
}

function clampDelta(selected: ScheduleItem[], proposedDelta: number, lane: Lane, endMinute: number): number {
	const firstStart = Math.min(...selected.map((item) => item.startMinute));
	const lastEnd = Math.max(...selected.map((item) => item.endMinute));
	return Math.max((lane.openingMinute ?? 0) - firstStart, Math.min(proposedDelta, endMinute - lastEnd));
}

function resolveCascade(selected: ScheduleItem[], unselected: ScheduleItem[], patches: ItemDropPatch[], direction: 'up' | 'down', lane: Lane, endMinute: number): ItemDropResolution {
	const cascadePatches = [...patches];
	let hasConflict = false;
	for (const boothId of new Set(selected.map((item) => item.boothId ?? ''))) {
		const moved = selected.filter((item) => (item.boothId ?? '') === boothId).map((item) => applyPatches(item, cascadePatches));
		const candidates = unselected.filter((item) => (item.boothId ?? '') === boothId).sort((left, right) => direction === 'down' ? left.startMinute - right.startMinute : right.endMinute - left.endMinute);
		let boundary = direction === 'down' ? Math.max(...moved.map((item) => item.endMinute)) : Math.min(...moved.map((item) => item.startMinute));
		const groupStart = Math.min(...moved.map((item) => item.startMinute));
		const groupEnd = Math.max(...moved.map((item) => item.endMinute));
		for (const candidate of candidates) {
			const duration = candidate.endMinute - candidate.startMinute;
			if (direction === 'down') {
				if (candidate.startMinute >= boundary) break;
				if (candidate.endMinute <= groupStart) continue;
				if (boundary + duration > endMinute) { hasConflict = true; break; }
				cascadePatches.push(toPatch(candidate, boundary, boundary + duration));
				boundary += duration;
			} else {
				if (candidate.endMinute <= boundary) break;
				if (candidate.startMinute >= groupEnd) continue;
				if (boundary - duration < (lane.openingMinute ?? 0)) { hasConflict = true; break; }
				cascadePatches.push(toPatch(candidate, boundary - duration, boundary));
				boundary -= duration;
			}
		}
	}
	return { patches: cascadePatches, hasConflict: hasConflict || conflicts([...selected, ...unselected], cascadePatches) };
}

export function resolveItemDrop(input: ItemDropInput): ItemDropResolution {
	const laneItems = input.items.filter((candidate) => candidate.laneId === input.lane.id);
	const selectedIds = new Set(input.selectedItemIds?.length ? input.selectedItemIds : [input.item.id]);
	const selected = laneItems.filter((candidate) => selectedIds.has(candidate.id));
	if (!selected.length) return { patches: [], hasConflict: false };
	const endMinute = input.endMinute ?? DAY_END_MINUTE;
	const delta = clampDelta(selected, input.proposedStartMinute - input.item.startMinute, input.lane, endMinute);
	const patches = selected.map((item) => toPatch(item, item.startMinute + delta, item.endMinute + delta));
	const unselected = laneItems.filter((candidate) => !selectedIds.has(candidate.id));

	if (input.policy === 'free-booth' && selected.length === 1 && input.lane.booths?.length) {
		const moved = applyPatches(selected[0] as ScheduleItem, patches);
		const freeBooth = input.lane.booths.find((boothId) => !unselected.some((candidate) => candidate.boothId === boothId && overlaps(moved, candidate)));
		if (freeBooth) return { patches: [toPatch(selected[0] as ScheduleItem, moved.startMinute, moved.endMinute, freeBooth)], hasConflict: false };
	}
	if (input.policy !== 'cascade') return { patches, hasConflict: conflicts(laneItems, patches) };
	return resolveCascade(selected, unselected, patches, input.direction, input.lane, endMinute);
}
