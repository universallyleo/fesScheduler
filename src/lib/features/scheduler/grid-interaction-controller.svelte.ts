import { snapMinutes } from '$lib/scheduler';
import type { Festival, Lane, ScheduleItem, UserPreferences } from '$lib/types';
import type { CreateState, DragState } from '$lib/ui-types';
import { resolveItemDrop } from './item-drop-resolution';

type GridInteractionOptions = {
	getEditMode: () => boolean;
	getCompactActive: () => boolean;
	getLanes: () => Lane[];
	getItems: () => ScheduleItem[];
	getPreferences: () => UserPreferences;
	minuteFromPointer: (event: PointerEvent, target: HTMLElement) => number;
	updateFestival: (mutator: (next: Festival) => void) => void;
	updatePreferences: (mutator: (preferences: UserPreferences) => void) => void;
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

const DAY_END_MINUTE = 30 * 60;

export function createGridInteractionController(options: GridInteractionOptions) {
	let dragging = $state<DragState>(null);
	let creating = $state<CreateState>(null);
	let laneReorder = $state<{ sourceLaneId: string; targetLaneId: string } | null>(null);
	let selectedItemIds = $state<string[]>([]);
	let selectedLaneId = $state<string | null>(null);
	let multiSelectEnabled = $state(false);
	let suppressedCardClickId = $state<string | null>(null);
	let longPressTimer: number | undefined;
	let laneHoldTimer: number | undefined;

	function clearTimers(): void {
		if (longPressTimer) window.clearTimeout(longPressTimer);
		if (laneHoldTimer) window.clearTimeout(laneHoldTimer);
		longPressTimer = undefined;
		laneHoldTimer = undefined;
	}

	function beginItemPointer(event: PointerEvent, item: ScheduleItem, kind: 'move' | 'resize'): void {
		if (!options.getEditMode()) {
			longPressTimer = window.setTimeout(() => options.openRelated(item), 520);
			return;
		}
		if (options.getCompactActive()) return;
		event.preventDefault();
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
		const selected = multiSelectEnabled && selectedItemIds.includes(item.id) ? selectedItemIds : [item.id];
		const lane = options.getLanes().find((candidate) => candidate.id === item.laneId);
		dragging = {
			kind,
			itemId: item.id,
			originY: event.clientY,
			startMinute: item.startMinute,
			endMinute: item.endMinute,
			pointerId: event.pointerId,
			direction: 'down',
			selectedItemIds: selected,
			resolution: null
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
		if (!dragging || event.pointerId !== dragging.pointerId) return;
		const item = options.getItems().find((candidate) => candidate.id === dragging?.itemId);
		const lane = item && options.getLanes().find((candidate) => candidate.id === item.laneId);
		if (!item || !lane) return;
		const delta = snapMinutes(
			((event.clientY - dragging.originY) / options.getPreferences().timeZoom) * 60,
			5
		);
		const duration = dragging.endMinute - dragging.startMinute;
		const proposedStartMinute =
			dragging.kind === 'resize'
				? dragging.startMinute
				: Math.max(0, Math.min(DAY_END_MINUTE - duration, dragging.startMinute + delta));
		const proposedEndMinute =
			dragging.kind === 'resize'
				? Math.max(dragging.startMinute + 5, Math.min(DAY_END_MINUTE, dragging.endMinute + delta))
				: proposedStartMinute + duration;
		const direction = delta < 0 ? 'up' : 'down';
		dragging = {
			...dragging,
			direction,
			resolution: resolveItemDrop({
				item,
				items: options.getItems(),
				lane,
				proposedStartMinute,
				proposedEndMinute,
				direction,
				policy: options.getPreferences().itemOverlapPolicy,
				selectedItemIds: dragging.kind === 'move' ? dragging.selectedItemIds : undefined,
				endMinute: DAY_END_MINUTE
			})
		};
	}

	function commitItemDrag(): void {
		const activeDrag = dragging;
		if (!activeDrag?.resolution) return;
		const patches = activeDrag.resolution.patches;
		options.updateFestival((next) => {
			for (const day of next.days) {
				for (const item of day.items) {
					const patch = patches.find((candidate) => candidate.id === item.id);
					if (patch) Object.assign(item, patch);
				}
			}
		});
	}

	function handlePointerUp(): void {
		clearTimers();
		if (dragging) {
			const activeDrag = dragging;
			const movedItemId = activeDrag.itemId;
			const didDrag = Boolean(activeDrag.resolution && activeDrag.resolution.patches.some((patch) => patch.id === movedItemId && (patch.startMinute !== activeDrag.startMinute || patch.endMinute !== activeDrag.endMinute)));
			commitItemDrag();
			dragging = null;
			if (didDrag) suppressedCardClickId = movedItemId;
			return;
		}
		const creation = creating;
		if (!creation) return;
		const startMinute = Math.min(creation.startMinute, creation.currentMinute);
		const endMinute = Math.max(startMinute + 5, Math.max(creation.startMinute, creation.currentMinute));
		options.openNew({ laneId: creation.laneId, startMinute, endMinute, lockDestination: true });
		creating = null;
	}

	function beginLaneReorder(event: PointerEvent, laneId: string): void {
		if (!options.getEditMode() || options.getCompactActive() || event.button !== 0) return;
		event.preventDefault();
		const start = () => (laneReorder = { sourceLaneId: laneId, targetLaneId: laneId });
		if (event.pointerType === 'touch') {
			laneHoldTimer = window.setTimeout(start, 340);
			return;
		}
		start();
	}

	function setLaneReorderTarget(laneId: string): void {
		if (!laneReorder) return;
		laneReorder.targetLaneId = laneId;
	}

	function finishLaneReorder(): void {
		if (laneHoldTimer) window.clearTimeout(laneHoldTimer);
		laneHoldTimer = undefined;
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

	function setMultiSelectEnabled(value: boolean): void {
		multiSelectEnabled = value;
		if (!value) clearSelection();
	}

	function clearSelection(): void {
		selectedItemIds = [];
		selectedLaneId = null;
	}

	function toggleItemSelection(item: ScheduleItem): void {
		if (!multiSelectEnabled || !options.getEditMode()) return;
		if (selectedLaneId && selectedLaneId !== item.laneId) return;
		if (selectedItemIds.includes(item.id)) {
			selectedItemIds = selectedItemIds.filter((id) => id !== item.id);
			if (!selectedItemIds.length) selectedLaneId = null;
			return;
		}
		selectedLaneId = item.laneId;
		selectedItemIds = [...selectedItemIds, item.id];
	}

	function consumeSuppressedCardClick(itemId: string): boolean {
		if (suppressedCardClickId !== itemId) return false;
		suppressedCardClickId = null;
		return true;
	}

	return {
		get addLaneId() {
			return options.getLanes()[0]?.id ?? '';
		},
		get creating() {
			return creating;
		},
		get itemDragPreview() {
			return dragging?.resolution ?? null;
		},
		get draggingItemId() {
			return dragging?.itemId ?? null;
		},
		get selectedItemIds() {
			return selectedItemIds;
		},
		get selectedLaneId() {
			return selectedLaneId;
		},
		get multiSelectEnabled() {
			return multiSelectEnabled;
		},
		setMultiSelectEnabled,
		toggleItemSelection,
		clearSelection,
		consumeSuppressedCardClick,
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
