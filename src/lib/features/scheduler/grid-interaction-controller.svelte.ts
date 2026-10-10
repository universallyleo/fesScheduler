import { snapMinutes } from '$lib/scheduler';
import type { Festival, Lane, ScheduleItem, UserPreferences } from '$lib/types';
import type { CreateState, DragState } from '$lib/ui-types';

type GridInteractionOptions = {
	getEditMode: () => boolean;
	getCompactActive: () => boolean;
	getLanes: () => Lane[];
	getPreferences: () => UserPreferences;
	minuteFromPointer: (event: PointerEvent, target: HTMLElement) => number;
	updateFestival: (mutator: (next: Festival) => void) => void;
	openNew: (options: {
		laneId: string;
		startMinute: number;
		endMinute: number;
		lockDestination: boolean;
	}) => void;
	openRelated: (item: ScheduleItem) => void;
	notify: (message: string) => void;
	reorderLanes: (sourceId: string, targetId: string) => void;
};

export function createGridInteractionController(options: GridInteractionOptions) {
	let dragging = $state<DragState>(null);
	let creating = $state<CreateState>(null);
	let laneReorder = $state<{ sourceLaneId: string; targetLaneId: string } | null>(null);
	let longPressTimer: number | undefined;

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
		event.preventDefault();
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
		dragging = {
			kind,
			itemId: item.id,
			originY: event.clientY,
			startMinute: item.startMinute,
			endMinute: item.endMinute
		};
	}

	function beginCreate(event: PointerEvent, laneId: string): void {
		if (!options.getEditMode() || options.getCompactActive() || event.button !== 0) return;
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
		const delta = snapMinutes(
			((event.clientY - dragging.originY) / options.getPreferences().timeZoom) * 60,
			5
		);
		const nextStart = Math.max(0, snapMinutes(dragging.startMinute + delta, 5));
		const nextEnd = Math.max(nextStart + 5, snapMinutes(dragging.endMinute + delta, 5));
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
		const startMinute = Math.min(creation.startMinute, creation.currentMinute);
		const endMinute = Math.max(
			startMinute + 5,
			Math.max(creation.startMinute, creation.currentMinute)
		);
		options.openNew({
			laneId: creation.laneId,
			startMinute,
			endMinute,
			lockDestination: true
		});
		creating = null;
	}

	function beginLaneReorder(event: PointerEvent, laneId: string): void {
		if (!options.getEditMode() || options.getCompactActive() || event.button !== 0) return;
		if ((event.target as HTMLElement | null)?.closest('button')) return;
		event.preventDefault();
		laneReorder = { sourceLaneId: laneId, targetLaneId: laneId };
	}

	function setLaneReorderTarget(laneId: string): void {
		if (!laneReorder) return;
		laneReorder.targetLaneId = laneId;
	}

	function finishLaneReorder(): void {
		const reorder = laneReorder;
		laneReorder = null;
		if (!reorder || reorder.sourceLaneId === reorder.targetLaneId) return;
		options.reorderLanes(reorder.sourceLaneId, reorder.targetLaneId);
	}

	function moveLaneBy(laneId: string, direction: -1 | 1): void {
		if (!options.getEditMode() || options.getCompactActive()) return;
		const lanes = options.getLanes();
		const sourceIndex = lanes.findIndex((lane) => lane.id === laneId);
		const target = lanes[sourceIndex + direction];
		if (!target) return;
		options.reorderLanes(laneId, target.id);
	}

	return {
		get addLaneId() {
			return options.getLanes()[0]?.id ?? '';
		},
		get creating() {
			return creating;
		},
		beginItemPointer,
		beginCreate,
		handlePointerMove,
		handlePointerUp,
		beginLaneReorder,
		setLaneReorderTarget,
		finishLaneReorder,
		moveLaneBy,
		get reorderingLaneId() {
			return laneReorder?.sourceLaneId ?? null;
		},
		get reorderTargetLaneId() {
			return laneReorder?.targetLaneId ?? null;
		}
	};
}
