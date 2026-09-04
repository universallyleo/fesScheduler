import { snapMinutes } from '$lib/scheduler';
import type { Festival, Lane, ScheduleItem, UserPreferences } from '$lib/types';
import type { CreateState, DragState } from '$lib/ui-types';

type GridInteractionOptions = {
	getEditMode: () => boolean;
	getCompactActive: () => boolean;
	getLanes: () => Lane[];
	getPreferences: () => UserPreferences;
	getSelectedDayId: () => string;
	minuteFromPointer: (event: PointerEvent, target: HTMLElement) => number;
	updateFestival: (mutator: (next: Festival) => void) => void;
	newId: () => string;
	openItem: (item: ScheduleItem, isNew: boolean) => void;
	openRelated: (item: ScheduleItem) => void;
	notify: (message: string) => void;
};

export function createGridInteractionController(options: GridInteractionOptions) {
	let addMode = $state(false);
	let addLaneId = $state('');
	let dragging = $state<DragState>(null);
	let creating = $state<CreateState>(null);
	let longPressTimer: number | undefined;

	function clearAddMode(): void {
		addMode = false;
		creating = null;
	}

	function beginItemPointer(
		event: PointerEvent,
		item: ScheduleItem,
		kind: 'move' | 'resize'
	): void {
		if (!options.getEditMode()) {
			longPressTimer = window.setTimeout(() => options.openRelated(item), 520);
			return;
		}
		if (options.getCompactActive()) return;
		event.stopPropagation();
		dragging = {
			kind,
			itemId: item.id,
			originY: event.clientY,
			startMinute: item.startMinute,
			endMinute: item.endMinute
		};
	}

	function beginCreate(event: PointerEvent, laneId: string): void {
		if (!options.getEditMode() || !addMode || options.getCompactActive() || event.button !== 0) return;
		const startMinute = options.minuteFromPointer(event, event.currentTarget as HTMLElement);
		creating = { laneId, startMinute, currentMinute: startMinute + 15 };
	}

	function handlePointerMove(event: PointerEvent): void {
		const target = event.currentTarget as HTMLElement;
		if (creating) {
			creating.currentMinute = options.minuteFromPointer(event, target);
			return;
		}
		if (!dragging) return;
		const preferences = options.getPreferences();
		const delta = snapMinutes(
			((event.clientY - dragging.originY) / preferences.timeZoom) * 60,
			preferences.snapMinutes
		);
		const nextStart = Math.max(0, dragging.startMinute + delta);
		const nextEnd = Math.max(nextStart + preferences.snapMinutes, dragging.endMinute + delta);
		options.updateFestival((next) => {
			const targetItem = next.days
				.flatMap((day) => day.items)
				.find((item) => item.id === dragging?.itemId);
			if (!targetItem) return;
			if (dragging?.kind === 'resize') targetItem.endMinute = nextEnd;
			else {
				targetItem.startMinute = nextStart;
				targetItem.endMinute = nextEnd;
			}
		});
		dragging = {
			...dragging,
			originY: event.clientY,
			startMinute: dragging.kind === 'resize' ? dragging.startMinute : nextStart,
			endMinute: dragging.kind === 'resize' ? dragging.endMinute : nextEnd
		};
	}

	function handlePointerUp(): void {
		if (longPressTimer) window.clearTimeout(longPressTimer);
		longPressTimer = undefined;
		const creation = creating;
		if (!creation) {
			dragging = null;
			return;
		}
		const preferences = options.getPreferences();
		const startMinute = Math.min(creation.startMinute, creation.currentMinute);
		const endMinute = Math.max(
			startMinute + preferences.snapMinutes,
			Math.max(creation.startMinute, creation.currentMinute)
		);
		const item: ScheduleItem = {
			id: options.newId(),
			laneId: creation.laneId,
			startMinute,
			endMinute,
			artistLabel: '新しい項目',
			subContent: '',
			artistEntityIds: [],
			favoriteLevel: 0,
			pairedTokutenItemIds: [],
			boothId: options.getLanes().find((lane) => lane.id === creation.laneId)?.booths?.[0]
		};
		options.updateFestival((next) =>
			next.days.find((day) => day.id === options.getSelectedDayId())?.items.push(item)
		);
		clearAddMode();
		options.openItem(item, true);
	}

	function startAdd(): void {
		addMode = true;
		addLaneId = options.getLanes()[0]?.id ?? '';
		options.notify('レーンを選んで、空いている時間をドラッグしてください');
	}

	return {
		get addMode() {
			return addMode;
		},
		get addLaneId() {
			return addLaneId;
		},
		get creating() {
			return creating;
		},
		clearAddMode,
		beginItemPointer,
		beginCreate,
		handlePointerMove,
		handlePointerUp,
		startAdd
	};
}
