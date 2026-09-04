import type { Festival, Lane, ScheduleItem } from '$lib/types';
import type { BulkRow } from '$lib/ui-types';
import { normalizeTimeText, parseMinute } from './timetable-layout';

type BulkEntryOptions = {
	getLanes: () => Lane[];
	getSelectedDayId: () => string;
	getTargetLaneId: () => string;
	updateFestival: (mutator: (next: Festival) => void) => void;
	newId: () => string;
	notify: (message: string) => void;
};

export function createBulkEntryController(options: BulkEntryOptions) {
	let open = $state(false);
	let rowsText = $state('');
	let startText = $state('10:00');
	let length = $state(15);
	let preview = $state<BulkRow[]>([]);

	function close(): void {
		open = false;
		preview = [];
	}

	function generatePreview(): void {
		const normalizedStart = normalizeTimeText(startText);
		if (!normalizedStart) {
			options.notify('開始時刻はHHMMまたはHH:MM形式（00:00〜30:00）で入力してください');
			return;
		}
		startText = normalizedStart;
		const start = parseMinute(normalizedStart);
		preview = rowsText
			.split(/\r?\n/)
			.map((artist) => artist.trim())
			.filter(Boolean)
			.map((artist, index) => ({
				id: options.newId(),
				artist,
				start: start + index * length,
				end: start + (index + 1) * length
			}));
	}

	function commit(): void {
		if (!preview.length) return;
		const targetLaneId = options.getTargetLaneId() || options.getLanes()[0]?.id;
		if (!targetLaneId) return;
		const additions: ScheduleItem[] = preview.map((row) => ({
			id: row.id,
			laneId: targetLaneId,
			startMinute: row.start,
			endMinute: row.end,
			artistLabel: row.artist,
			subContent: '',
			artistEntityIds: [],
			favoriteLevel: 0,
			pairedTokutenItemIds: [],
			boothId: options.getLanes().find((lane) => lane.id === targetLaneId)?.booths?.[0]
		}));
		options.updateFestival((next) =>
			next.days.find((day) => day.id === options.getSelectedDayId())?.items.push(...additions)
		);
		close();
		options.notify(`${additions.length} 件を追加しました`);
	}

	return {
		get open() {
			return open;
		},
		get rowsText() {
			return rowsText;
		},
		get startText() {
			return startText;
		},
		get length() {
			return length;
		},
		get preview() {
			return preview;
		},
		show: () => (open = true),
		close,
		setRowsText: (value: string) => (rowsText = value),
		setStartText: (value: string) => (startText = value),
		setLength: (value: number) => (length = value),
		setPreview: (value: BulkRow[]) => (preview = value),
		generatePreview,
		commit
	};
}
