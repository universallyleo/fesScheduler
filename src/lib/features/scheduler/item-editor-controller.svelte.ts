import type { Festival, Lane, LaneType, ScheduleItem } from '$lib/types';

type ItemEditorOptions = {
	getItems: () => ScheduleItem[];
	getLanes: () => Lane[];
	getSelectedDayId: () => string;
	isEditingEnabled: () => boolean;
	updateFestival: (mutator: (next: Festival) => void) => void;
	newId: () => string;
	notify: (message: string) => void;
	laneTypeLabel: (type: LaneType) => string;
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

	function open(item: ScheduleItem, openingNew = false): void {
		if (!options.isEditingEnabled()) return;
		itemId = item.id;
		draft = JSON.parse(JSON.stringify(item)) as ScheduleItem;
		const lane = options.getLanes().find((candidate) => candidate.id === item.laneId);
		if (lane?.booths?.length && !draft.boothId) draft.boothId = lane.booths[0];
		isNew = openingNew;
		relatedLaneId = '';
		relatedDelay = '0';
		customRelatedDelay = 25;
	}

	function close(): void {
		itemId = null;
		draft = null;
		isNew = false;
		relatedLaneId = '';
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
			boothId: item.boothId
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
		const savedDraft = JSON.parse(JSON.stringify(draft)) as ScheduleItem;
		const items = options.getItems();
		const lanes = options.getLanes();
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
					boothId: (newRelatedLane ?? lanes.find((lane) => lane.id === relatedItemLaneId))?.booths?.[0]
				}
			: null;
		if (relatedItem && !savedDraft.pairedTokutenItemIds.includes(relatedItem.id)) {
			savedDraft.pairedTokutenItemIds = [...savedDraft.pairedTokutenItemIds, relatedItem.id];
		}
		options.updateFestival((next) => {
			const targetDay = next.days.find((day) => day.id === options.getSelectedDayId());
			const target = targetDay?.items.find((item) => item.id === savedDraft.id);
			if (target) Object.assign(target, savedDraft);
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
		setRelatedLaneId: (value: string) => (relatedLaneId = value),
		setRelatedDelay: (value: string) => (relatedDelay = value),
		setCustomRelatedDelay: (value: number) => (customRelatedDelay = value),
		open,
		close,
		duplicate,
		togglePair,
		save,
		remove
	};
}
