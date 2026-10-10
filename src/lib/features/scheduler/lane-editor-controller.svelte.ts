import type { Festival, Lane, LaneType } from '$lib/types';
import { getSharedLaneOpeningMinute } from '$lib/scheduler';
import { normalizeToFiveMinuteTime, parseMinute } from './timetable-layout';

type LaneEditorOptions = {
	getLanes: () => Lane[];
	getSelectedDayId: () => string;
	isEditingEnabled: () => boolean;
	updateFestival: (mutator: (next: Festival) => void) => void;
	newId: () => string;
	notify: (message: string) => void;
	closeInfo: () => void;
};

const laneColors = ['#ffad0a', '#ef6a56', '#5c9ed6', '#65a989'];

export function createLaneEditorController(options: LaneEditorOptions) {
	let draft = $state<Lane | null>(null);
	let isNew = $state(false);

	function add(type: LaneType = 'stage'): void {
		if (!options.isEditingEnabled()) return;
		const lanes = options.getLanes();
		isNew = true;
		draft = {
			id: options.newId(),
			name: `新しいレーン ${lanes.length + 1}`,
			type,
			color: laneColors[lanes.length % laneColors.length]
		};
	}

	function open(lane: Lane): void {
		if (!options.isEditingEnabled()) return;
		isNew = false;
		draft = { ...lane };
		options.closeInfo();
	}

	function close(): void {
		draft = null;
		isNew = false;
	}

	function updateOpening(value: string): void {
		if (!draft) return;
		if (!value.trim()) {
			draft.openingMinute = undefined;
			return;
		}
		const normalized = normalizeToFiveMinuteTime(value);
		if (normalized) draft.openingMinute = parseMinute(normalized);
	}

	function save(): void {
		if (!options.isEditingEnabled() || !draft) return;
		const savedDraft: Lane = {
			...draft,
			name: draft.name.trim(),
			venueName: draft.venueName?.trim() || undefined,
			venueUrl: draft.venueUrl?.trim() || undefined,
			openingMinute: draft.openingMinute,
			color: draft.color || '#a8adb5',
			backgroundColor: draft.backgroundColor,
			booths: draft.type === 'tokuten' ? draft.booths?.filter(Boolean) : undefined
		};
		if (!savedDraft.name) {
			options.notify('レーン名を入力してください');
			return;
		}
		options.updateFestival((next) => {
			const targetDay = next.days.find((day) => day.id === options.getSelectedDayId());
			if (!targetDay) return;
			if (isNew) targetDay.lanes.push(savedDraft);
			else {
				const target = targetDay.lanes.find((lane) => lane.id === savedDraft.id);
				if (target) Object.assign(target, savedDraft);
			}
			targetDay.openingMinute = getSharedLaneOpeningMinute(targetDay.lanes);
		});
		close();
	}

	return {
		get draft() {
			return draft;
		},
		get isNew() {
			return isNew;
		},
		add,
		open,
		close,
		updateOpening,
		save
	};
}
