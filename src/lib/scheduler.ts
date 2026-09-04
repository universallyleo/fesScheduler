import type { ArtistEntity, CompactItemPlacement, ConflictReport, ScheduleItem } from './types';

const DARK_FOREGROUND = '#13262b';
const LIGHT_FOREGROUND = '#ffffff';

export function snapMinutes(value: number, increment: number): number {
	if (!Number.isFinite(value) || increment <= 0) return value;
	return Math.round(value / increment) * increment;
}

export function readableTextColor(color: string): typeof DARK_FOREGROUND | typeof LIGHT_FOREGROUND {
	const normalized = color.trim().replace(/^#/, '');
	const hex =
		normalized.length === 3
			? normalized
					.split('')
					.map((value) => value + value)
					.join('')
			: normalized;
	if (!/^[0-9a-f]{6}$/i.test(hex)) return DARK_FOREGROUND;
	const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
	const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
	const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;
	const luminance = [red, green, blue].map((channel) =>
		channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
	);
	const relativeLuminance = 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2];
	const darkContrast = (relativeLuminance + 0.05) / 0.05;
	const lightContrast = 1.05 / (relativeLuminance + 0.05);
	return darkContrast >= lightContrast ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}

export function computeGridRange(
	items: ScheduleItem[],
	openingMinute?: number
): { startMinute: number; endMinute: number } {
	if (items.length === 0)
		return {
			startMinute: openingMinute ?? 0,
			endMinute: openingMinute && openingMinute > 1440 ? openingMinute + 60 : 1440
		};
	const earliest = Math.min(...items.map((item) => item.startMinute));
	const latest = Math.max(...items.map((item) => item.endMinute));
	const startMinute = openingMinute ?? Math.max(0, earliest - 30);
	const endMinute = latest > 1440 ? latest + 60 : Math.max(1440, latest + 30);
	return { startMinute, endMinute };
}

function overlaps(left: ScheduleItem, right: ScheduleItem): boolean {
	return left.startMinute < right.endMinute && right.startMinute < left.endMinute;
}

export function normalizeArtistLabel(value: string): string {
	return value.normalize('NFKC').trim().toLocaleLowerCase();
}

export function detectConflicts(items: ScheduleItem[]): ConflictReport {
	const sameLane: [string, string][] = [];
	const sameArtist: [string, string][] = [];
	for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
		for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
			const left = items[leftIndex];
			const right = items[rightIndex];
			if (!left || !right || !overlaps(left, right)) continue;
			if (left.laneId === right.laneId && left.boothId === right.boothId)
				sameLane.push([left.id, right.id]);
			if (normalizeArtistLabel(left.artistLabel) === normalizeArtistLabel(right.artistLabel)) {
				sameArtist.push([left.id, right.id]);
			}
		}
	}
	return { sameLane, sameArtist };
}

export function packCompactItems(items: ScheduleItem[]): CompactItemPlacement[] {
	const sorted = [...items].sort(
		(left, right) =>
			left.startMinute - right.startMinute ||
			left.endMinute - right.endMinute ||
			left.id.localeCompare(right.id)
	);
	const columnsEnd: number[] = [];
	return sorted.map((item) => {
		let column = columnsEnd.findIndex((endMinute) => endMinute <= item.startMinute);
		if (column === -1) column = columnsEnd.length;
		columnsEnd[column] = item.endMinute;
		return { item, column };
	});
}

function relatedEntityIds(entityId: string, entities: ArtistEntity[]): Set<string> {
	const result = new Set<string>([entityId]);
	const entity = entities.find((candidate) => candidate.id === entityId);
	if (!entity) return result;
	if (entity.kind === 'group') {
		for (const memberId of entity.memberIds ?? []) result.add(memberId);
	} else {
		for (const groupId of entity.groupIds ?? []) result.add(groupId);
	}
	return result;
}

export function getRelatedItemIds(
	items: ScheduleItem[],
	entities: ArtistEntity[],
	selectedItemId: string
): string[] {
	const selected = items.find((item) => item.id === selectedItemId);
	if (!selected) return [];
	const pairedItemIds = new Set(selected.pairedTokutenItemIds);
	const relatedArtistEntityIds = new Set<string>();
	for (const entityId of selected.artistEntityIds) {
		for (const relatedEntityId of relatedEntityIds(entityId, entities))
			relatedArtistEntityIds.add(relatedEntityId);
	}
	return items
		.filter(
			(item) =>
				item.id !== selectedItemId &&
				(pairedItemIds.has(item.id) ||
					item.pairedTokutenItemIds.includes(selectedItemId) ||
					item.artistEntityIds.some((entityId) => relatedArtistEntityIds.has(entityId)))
		)
		.map((item) => item.id);
}

export function cycleFavorite(level: ScheduleItem['favoriteLevel']): ScheduleItem['favoriteLevel'] {
	return level === 3 ? 0 : ((level + 1) as ScheduleItem['favoriteLevel']);
}
