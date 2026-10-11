import { readableTextColor } from '$lib/scheduler';
import type { Lane, ScheduleItem, UserPreferences } from '$lib/types';

export function itemDisplayColor(item: ScheduleItem, lane: Lane | undefined): string {
	return item.itemType === 'tokuten' || (!item.itemType && lane?.type === 'tokuten')
		? 'var(--tokuten-item)'
		: (item.color ?? lane?.color ?? '#a8adb5');
}

function overlaps(left: ScheduleItem, right: ScheduleItem): boolean {
	return left.startMinute < right.endMinute && right.startMinute < left.endMinute;
}

type PresentationContext = {
	items: ScheduleItem[];
	preferences: UserPreferences;
	compactActive: boolean;
	minuteToY: (minute: number) => number;
	laneForItem: (item: ScheduleItem) => Lane | undefined;
	itemBottomLine: (item: ScheduleItem) => string;
};

export function createTimetablePresentation(context: () => PresentationContext) {
	function displayedItemHeight(item: ScheduleItem): number {
		const { minuteToY } = context();
		return Math.max(24, minuteToY(item.endMinute) - minuteToY(item.startMinute) - 4);
	}

	function itemHasLimitedContent(item: ScheduleItem): boolean {
		return displayedItemHeight(item) < 66;
	}

	function shouldShowItemBottomLine(item: ScheduleItem): boolean {
		const { itemBottomLine, laneForItem } = context();
		const lane = laneForItem(item);
		return Boolean(itemBottomLine(item)) && (!itemHasLimitedContent(item) || Boolean(lane?.booths?.length));
	}

	function itemStyle(item: ScheduleItem): string {
		const { minuteToY, laneForItem, compactActive, items } = context();
		const top = minuteToY(item.startMinute);
		const height = displayedItemHeight(item);
		const lane = laneForItem(item);
		const color = itemDisplayColor(item, lane);
		const itemText =
			item.itemType === 'tokuten' || (!item.itemType && lane?.type === 'tokuten')
				? 'var(--tokuten-item-text)'
				: readableTextColor(item.color ?? lane?.color ?? '#a8adb5');
		const booths = !compactActive && lane?.type === 'tokuten' ? lane.booths ?? [] : [];
		const boothIndex = booths.length ? Math.max(0, booths.indexOf(item.boothId ?? booths[0] ?? '')) : 0;
		const sameStartBooths = new Set(
			booths.length
				? items
						.filter((candidate) => candidate.laneId === item.laneId && candidate.startMinute === item.startMinute)
						.map((candidate) => candidate.boothId)
				: []
		);
		const hasSimultaneousBooths = sameStartBooths.size > 1;
		const boothWidth =
			booths.length <= 1
				? 1
				: hasSimultaneousBooths
					? 1 / booths.length
					: Math.min(0.62, 1 / booths.length + 0.24);
		const boothLeft = booths.length > 1 ? (boothIndex * (1 - boothWidth)) / (booths.length - 1) : 0;
		const itemStackLevel =
			1 +
			(booths.length > 1
				? items.filter(
						(candidate) =>
							candidate.id !== item.id &&
							candidate.laneId === item.laneId &&
							candidate.startMinute < item.startMinute &&
							overlaps(candidate, item)
					).length
				: 0);
		const boothLayout = booths.length
			? `left:calc(4px + (100% - 8px) * ${boothLeft});right:auto;width:calc((100% - 8px) * ${boothWidth});`
			: '';
		return `top:${top + 3}px;height:${height}px;--item-color:${color};--item-text:${itemText};--item-z:${itemStackLevel};${boothLayout}`;
	}

	function copyHandleStyle(item: ScheduleItem): string {
		const { minuteToY } = context();
		const top = minuteToY(item.startMinute);
		return `top:${top + displayedItemHeight(item) - 16}px;`;
	}

	function laneStyle(lane: Lane): string {
		const color = lane.color ?? '#a8adb5';
		const background =
			lane.backgroundColor ??
			(lane.type === 'tokuten' ? 'var(--surface-tokuten)' : 'var(--surface-lane)');
		return `--lane-color:${color};--lane-background:${background};--lane-icon:${readableTextColor(color)};`;
	}

	function laneDisplayWidth(lane: Lane): number {
		const { preferences } = context();
		return lane.type === 'tokuten' && (lane.booths?.length ?? 0) > 2
			? preferences.laneWidth * 1.5
			: preferences.laneWidth;
	}

	return {
		displayedItemHeight,
		itemHasLimitedContent,
		shouldShowItemBottomLine,
		itemStyle,
		copyHandleStyle,
		laneStyle,
		laneDisplayWidth
	};
}
