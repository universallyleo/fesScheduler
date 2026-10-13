import type { Festival, Lane, LaneType, ScheduleItem } from '$lib/types';
import { buildRepeatPreview, buildRepeatedItemSpecs, maximumRepeatCount, reconcileRepeatCount } from './repeat-items';
import {
	buildMultiBoothRepeat,
	maximumMultiBoothRepeatCount,
	type MultiBoothRepeatInput
} from './multi-booth-repeat';

type ItemEditorOptions = {
	getItems: () => ScheduleItem[];
	getLanes: () => Lane[];
	getSelectedDayId: () => string;
	isEditingEnabled: () => boolean;
	updateFestival: (mutator: (next: Festival) => void) => void;
	newId: () => string;
	notify: (message: string) => void;
	laneTypeLabel: (type: LaneType) => string;
	getLaneEndMinute: (laneId: string) => number;
};

const laneTypes: LaneType[] = ['stage', 'tokuten', 'event'];
const laneColors = ['#ffad0a', '#ef6a56', '#5c9ed6', '#65a989'];

export function createItemEditorController(options: ItemEditorOptions) {
	let itemId = $state<string | null>(null);
	let draft = $state<ScheduleItem | null>(null);
	let isNew = $state(false);
	let relatedLaneId = $state('');
	let relatedDelay = $state('0');
	let customRelatedDelay = $state(25);
	let repeatEnabled = $state(false);
	let repeatCount = $state(1);
	let repeatRestMinutes = $state(5);
	let repeatItemsBeforeRest = $state(1);
	let repeatNamesText = $state('');
	let destinationLocked = $state(false);
	let copyAcrossBooths = $state(false);
	let boothOffsets = $state<number[]>([5]);
	let boothRepeatNames = $state<Record<string, string>>({});

	function repeatInput(namesText = repeatNamesText) {
		return {
			startMinute: draft?.startMinute ?? 0,
			endMinute: draft?.endMinute ?? 0,
			fallbackName: draft?.artistLabel ?? '新しい項目',
			namesText,
			repeatCount,
			restMinutes: repeatRestMinutes,
			itemsBeforeRest: repeatItemsBeforeRest,
			endLimitMinute: options.getLaneEndMinute(draft?.laneId ?? '')
		};
	}

	function selectedLane(): Lane | undefined {
		return options.getLanes().find((lane) => lane.id === draft?.laneId);
	}

	function multiBoothInput(): MultiBoothRepeatInput | null {
		const lane = selectedLane();
		if (!lane || lane.type !== 'tokuten' || (lane.booths?.length ?? 0) < 2) return null;
		return {
			repeat: repeatInput(),
			repeatByBooth: Object.fromEntries(
				(lane.booths ?? []).map((booth) => [booth, repeatInput(boothRepeatNames[booth] ?? repeatNamesText)])
			),
			booths: lane.booths ?? [],
			enteredOffsets: boothOffsets,
			copyAcrossBooths
		};
	}

	function clampRepeatCount(): void {
		const multi = multiBoothInput();
		const maximum = multi ? maximumMultiBoothRepeatCount(multi) : maximumRepeatCount(repeatInput());
		repeatCount = Math.max(1, Math.min(repeatCount, Math.max(1, maximum)));
	}

	function reconcileRepeatCountAtSave(): void {
		const multi = multiBoothInput();
		const maximum = multi ? maximumMultiBoothRepeatCount(multi) : maximumRepeatCount(repeatInput());
		const names = multi?.copyAcrossBooths
			? Object.values(boothRepeatNames).join('/')
			: repeatNamesText;
		repeatCount = reconcileRepeatCount(repeatCount, names, maximum);
	}

	function open(item: ScheduleItem, openingNew = false, lockDestination = false): void {
		if (!options.isEditingEnabled()) return;
		itemId = item.id;
		draft = JSON.parse(JSON.stringify(item)) as ScheduleItem;
		const lane = options.getLanes().find((candidate) => candidate.id === item.laneId);
		if (openingNew && !draft.itemType) draft.itemType = lane?.type;
		if (lane?.booths?.length && !draft.boothId) draft.boothId = lane.booths[0];
		isNew = openingNew;
		destinationLocked = lockDestination;
		relatedLaneId = '';
		relatedDelay = '0';
		customRelatedDelay = 25;
		repeatEnabled = false;
		repeatCount = 1;
		repeatRestMinutes = 5;
		repeatItemsBeforeRest = 1;
		repeatNamesText = '';
		copyAcrossBooths = false;
		boothOffsets = [5];
		boothRepeatNames = {};
	}

	function openNew({
		laneId = '',
		startMinute = 600,
		endMinute = 615,
		lockDestination = false
	}: {
		laneId?: string;
		startMinute?: number;
		endMinute?: number;
		lockDestination?: boolean;
	} = {}): void {
		if (!options.isEditingEnabled()) return;
		const lane = options.getLanes().find((candidate) => candidate.id === laneId);
		itemId = options.newId();
		draft = {
			id: itemId,
			laneId,
			startMinute,
			endMinute,
			artistLabel: '新しい項目',
			subContent: '',
			artistEntityIds: [],
			favoriteLevel: 0,
			pairedTokutenItemIds: [],
			boothId: lane?.booths?.[0],
			itemType: lane?.type
		};
		isNew = true;
		destinationLocked = lockDestination;
		relatedLaneId = '';
		relatedDelay = '0';
		customRelatedDelay = 25;
		repeatEnabled = false;
		repeatCount = 1;
		repeatRestMinutes = 5;
		repeatItemsBeforeRest = 1;
		repeatNamesText = '';
		copyAcrossBooths = false;
		boothOffsets = [5];
		boothRepeatNames = {};
	}

	function close(): void {
		itemId = null;
		draft = null;
		isNew = false;
		destinationLocked = false;
		relatedLaneId = '';
	}

	function setDestinationLaneId(laneId: string): void {
		if (!draft || destinationLocked) return;
		draft.laneId = laneId;
		const lane = options.getLanes().find((candidate) => candidate.id === laneId);
		if (!lane) return;
		draft.itemType = lane.type;
		draft.boothId = lane.booths?.[0];
		draft.color = undefined;
		boothRepeatNames = {};
	}

	function duplicate(item: ScheduleItem): void {
		if (!options.isEditingEnabled()) return;
		const duration = item.endMinute - item.startMinute;
		const duplicate: ScheduleItem = {
			id: options.newId(),
			laneId: item.laneId,
			startMinute: item.endMinute,
			endMinute: item.endMinute + duration,
			artistLabel: '新しい項目',
			subContent: '',
			artistEntityIds: [],
			favoriteLevel: 0,
			pairedTokutenItemIds: [],
			boothId: item.boothId,
			itemType: item.itemType ?? options.getLanes().find((lane) => lane.id === item.laneId)?.type,
			color: item.color
		};
		options.updateFestival((next) =>
			next.days.find((day) => day.id === options.getSelectedDayId())?.items.push(duplicate)
		);
		open(duplicate, true);
	}

	function togglePair(relatedItemId: string): void {
		if (!draft) return;
		draft.pairedTokutenItemIds = draft.pairedTokutenItemIds.includes(relatedItemId)
			? draft.pairedTokutenItemIds.filter((id) => id !== relatedItemId)
			: [...draft.pairedTokutenItemIds, relatedItemId];
	}

	function save(): void {
		if (!draft || draft.endMinute <= draft.startMinute) {
			options.notify('終了時刻は開始時刻より後にしてください');
			return;
		}
		const lanes = options.getLanes();
		const destinationLaneId = draft.laneId;
		if (isNew && !lanes.some((lane) => lane.id === destinationLaneId)) {
			options.notify('追加先レーンを選択してください');
			return;
		}
		if (isNew && repeatEnabled) reconcileRepeatCountAtSave();
		const multi = isNew && repeatEnabled ? multiBoothInput() : null;
		const repeatedSpecs = isNew && repeatEnabled
			? multi?.copyAcrossBooths
				? buildMultiBoothRepeat(multi).items
				: buildRepeatedItemSpecs(repeatInput())
			: [];
		const savedDraft = JSON.parse(JSON.stringify(draft)) as ScheduleItem;
		const firstSpec = repeatedSpecs[0];
		if (firstSpec) Object.assign(savedDraft, firstSpec);
		const items = options.getItems();
		const originalPairIds = items.find((item) => item.id === savedDraft.id)?.pairedTokutenItemIds ?? [];
		const delayMinutes = relatedDelay === 'custom' ? customRelatedDelay : Number.parseInt(relatedDelay, 10);
		const newRelatedLaneType = laneTypes.find((type) => relatedLaneId === `new:${type}`);
		const newRelatedLane: Lane | null = newRelatedLaneType
			? {
					id: options.newId(),
					name: `新しい${options.laneTypeLabel(newRelatedLaneType)}`,
					type: newRelatedLaneType,
					color: laneColors[lanes.length % laneColors.length]
				}
			: null;
		const relatedItemLaneId = newRelatedLane?.id ?? relatedLaneId;
		const shouldCreateRelatedItem =
			isNew && (Boolean(newRelatedLane) || lanes.some((lane) => lane.id === relatedItemLaneId));
		const relatedLane = newRelatedLane ?? lanes.find((lane) => lane.id === relatedItemLaneId);
		const relatedItem: ScheduleItem | null = shouldCreateRelatedItem
			? {
					id: options.newId(),
					laneId: relatedItemLaneId,
					startMinute: savedDraft.endMinute + delayMinutes,
					endMinute: savedDraft.endMinute + delayMinutes + (savedDraft.endMinute - savedDraft.startMinute),
					artistLabel: savedDraft.artistLabel || '新しい項目',
					subContent: '',
					artistEntityIds: [...savedDraft.artistEntityIds],
					favoriteLevel: 0,
					pairedTokutenItemIds: [savedDraft.id],
					boothId: relatedLane?.booths?.[0],
					itemType: relatedLane?.type
				}
			: null;
		if (relatedItem && !savedDraft.pairedTokutenItemIds.includes(relatedItem.id)) {
			savedDraft.pairedTokutenItemIds = [...savedDraft.pairedTokutenItemIds, relatedItem.id];
		}
		options.updateFestival((next) => {
			const targetDay = next.days.find((day) => day.id === options.getSelectedDayId());
			const target = targetDay?.items.find((item) => item.id === savedDraft.id);
			if (target) Object.assign(target, savedDraft);
			else if (targetDay && isNew) targetDay.items.push(savedDraft);
			if (targetDay && repeatedSpecs.length > 1) {
				for (const spec of repeatedSpecs.slice(1)) {
					targetDay.items.push({
						...savedDraft,
						id: options.newId(),
						...spec,
						pairedTokutenItemIds: []
					});
				}
			}
			if (!targetDay) return;
			if (newRelatedLane) targetDay.lanes.push(newRelatedLane);
			for (const candidate of targetDay.items) {
				if (candidate.id === savedDraft.id) continue;
				if (savedDraft.pairedTokutenItemIds.includes(candidate.id)) {
					if (!candidate.pairedTokutenItemIds.includes(savedDraft.id)) {
						candidate.pairedTokutenItemIds.push(savedDraft.id);
					}
				} else if (originalPairIds.includes(candidate.id)) {
					candidate.pairedTokutenItemIds = candidate.pairedTokutenItemIds.filter(
						(id) => id !== savedDraft.id
					);
				}
			}
			if (relatedItem) targetDay.items.push(relatedItem);
		});
		close();
	}

	function remove(): void {
		if (!itemId) return;
		const id = itemId;
		options.updateFestival((next) => {
			for (const day of next.days) day.items = day.items.filter((item) => item.id !== id);
		});
		close();
	}

	return {
		get itemId() {
			return itemId;
		},
		get draft() {
			return draft;
		},
		get isNew() {
			return isNew;
		},
		get relatedLaneId() {
			return relatedLaneId;
		},
		get relatedDelay() {
			return relatedDelay;
		},
		get customRelatedDelay() {
			return customRelatedDelay;
		},
		get repeatEnabled() {
			return repeatEnabled;
		},
		get repeatCount() {
			return repeatCount;
		},
		get repeatRestMinutes() {
			return repeatRestMinutes;
		},
		get repeatItemsBeforeRest() {
			return repeatItemsBeforeRest;
		},
		get repeatNamesText() {
			return repeatNamesText;
		},
		get destinationLocked() {
			return destinationLocked;
		},
		get copyAcrossBooths() {
			return copyAcrossBooths;
		},
		get boothOffsets() {
			return boothOffsets;
		},
		get boothRepeatNames() {
			const booths = selectedLane()?.booths ?? [];
			return Object.fromEntries(booths.map((booth) => [booth, boothRepeatNames[booth] ?? repeatNamesText]));
		},
		get multiBoothPreview() {
			const multi = multiBoothInput();
			return multi?.copyAcrossBooths ? buildMultiBoothRepeat(multi).preview : [];
		},
		get maximumRepeatCount() {
			const multi = multiBoothInput();
			return Math.max(1, multi ? maximumMultiBoothRepeatCount(multi) : maximumRepeatCount(repeatInput()));
		},
		get repeatPreview() {
			return buildRepeatPreview(repeatInput());
		},
		setRelatedLaneId: (value: string) => (relatedLaneId = value),
		setDestinationLaneId,
		setRelatedDelay: (value: string) => (relatedDelay = value),
		setCustomRelatedDelay: (value: number) => (customRelatedDelay = value),
		setRepeatEnabled: (value: boolean) => (repeatEnabled = value),
		setRepeatCount: (value: number) => {
			repeatCount = value;
			clampRepeatCount();
		},
		setRepeatRestMinutes: (value: number) => {
			repeatRestMinutes = value;
			clampRepeatCount();
		},
		setRepeatItemsBeforeRest: (value: number) => {
			repeatItemsBeforeRest = value;
			clampRepeatCount();
		},
		setRepeatNamesText: (value: string) => {
			repeatNamesText = value;
		},
		setCopyAcrossBooths: (value: boolean) => {
			copyAcrossBooths = value;
			if (value && !boothOffsets.length) boothOffsets = [5];
			if (value) {
				const booths = selectedLane()?.booths ?? [];
				boothRepeatNames = Object.fromEntries(
					booths.map((booth) => [booth, boothRepeatNames[booth] ?? repeatNamesText])
				);
			}
			clampRepeatCount();
		},
		setBoothRepeatNames: (boothId: string, value: string) => {
			boothRepeatNames = { ...boothRepeatNames, [boothId]: value };
		},
		setBoothOffsets: (value: number[]) => {
			boothOffsets = value.map((offset) => Math.max(0, Math.round(offset / 5) * 5));
			clampRepeatCount();
		},
		removeBoothOffset: (index: number) => {
			if (boothOffsets.length <= 1) return;
			boothOffsets = boothOffsets.filter((_, offsetIndex) => offsetIndex !== index);
			clampRepeatCount();
		},
		open,
		openNew,
		close,
		duplicate,
		togglePair,
		save,
		remove
	};
}
