import { readableTextColor } from '$lib/scheduler';
import type { Lane, ScheduleItem, UserPreferences } from '$lib/types';

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
		const color = lane?.type === 'tokuten' ? 'var(--tokuten-item)' : (lane?.color ?? '#a8adb5');
		const itemText =
			lane?.type === 'tokuten'
				? 'var(--tokuten-item-text)'
				: readableTextColor(lane?.color ?? '#a8adb5');
		const duration = item.endMinute - item.startMinute;
		const mainSize =
			itemHasLimitedContent(item) && duration >= 20
				? Math.max(7, Math.min(17, Math.floor(height - 13)))
				: null;
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
		const boothLayout = booths.length
			? `left:calc(4px + (100% - 8px) * ${boothLeft});right:auto;width:calc((100% - 8px) * ${boothWidth});--item-z:${item.startMinute};`
			: '';
		return `top:${top + 3}px;height:${height}px;--item-color:${color};--item-text:${itemText};${mainSize ? `--item-main-size:${mainSize}px;` : ''}${boothLayout}`;
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
