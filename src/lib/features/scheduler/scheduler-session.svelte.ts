import {
	BUNDLED_FESTIVALS,
	cloneFestival,
	createBlankFestival
} from '$lib/sample-data';
import { parseTransferDocument } from '$lib/transfer';
import { deleteFestival, listFestivals, loadPreferences, saveFestival, savePreferences } from '$lib/storage';
import type { Festival, FestivalDay, UserPreferences } from '$lib/types';
import type { FestivalSettingsDraft } from '$lib/ui-types';
import { createFestivalHistory } from './festival-history.svelte';
import { formatMinute, normalizeToFiveMinuteTime, parseMinute } from './timetable-layout';

type SessionOptions = {
	defaults: UserPreferences;
	initialFestival: Festival;
	newId: () => string;
	notify: (message: string) => void;
};

export function createSchedulerSession({ defaults, initialFestival, newId, notify }: SessionOptions) {
	const history = createFestivalHistory(cloneFestival(initialFestival));
	let preferences = $state<UserPreferences>({ ...defaults });
	let selectedDayId = $state(initialFestival.days[0]?.id ?? '');
	let selectedSampleId = $state(initialFestival.id);
	let isLoading = $state(true);

	function persistPreferences(): void {
		void savePreferences(preferences);
	}

	function persistFestival(): void {
		void saveFestival(history.festival);
		preferences.lastFestivalId = history.festival.id;
		preferences.lastDayId = selectedDayId;
		persistPreferences();
	}

	function updateFestival(mutator: (next: Festival) => void): void {
		history.update(mutator);
		persistFestival();
	}

	function replaceFestival(next: Festival): void {
		history.replace(next);
		persistFestival();
	}

	function selectDay(id: string): void {
		selectedDayId = id;
		preferences.lastDayId = id;
		persistPreferences();
	}

	function toggleTheme(): void {
		preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark';
		persistPreferences();
	}

	function toggleLanguage(): void {
		preferences.language = preferences.language === 'ja' ? 'en' : 'ja';
		persistPreferences();
	}

	function undo(): void {
		if (!history.undoStack.length) return;
		history.undo();
		persistFestival();
		notify('変更を元に戻しました');
	}

	function redo(): void {
		if (!history.redoStack.length) return;
		history.redo();
		persistFestival();
		notify('変更をやり直しました');
	}

	function addDay(): void {
		const day = history.festival.days.find((candidate) => candidate.id === selectedDayId);
		if (!day) return;
		const [year, month, dayOfMonth] = day.date.split('-').map(Number);
		const nextDate = new Date(Date.UTC(year, month - 1, dayOfMonth + 1));
		const newDay: FestivalDay = {
			id: newId(),
			date: nextDate.toISOString().slice(0, 10),
			openingMinute: day.openingMinute,
			displayStartMinute: day.displayStartMinute,
			displayEndMinute: day.displayEndMinute,
			lanes: day.lanes.map((lane) => ({ ...lane, id: newId() })),
			items: []
		};
		updateFestival((next) => next.days.push(newDay));
		selectDay(newDay.id);
	}

	function newFestival(): void {
		const next = createBlankFestival();
		history.replace(next);
		selectedDayId = next.days[0]?.id ?? '';
		persistFestival();
	}

	function copyTemplate(templateId: string): void {
		const template = BUNDLED_FESTIVALS.find((candidate) => candidate.id === templateId);
		if (!template) return;
		selectedSampleId = templateId;
		const next = cloneFestival(template);
		next.id = newId();
		next.title = `${next.title}（コピー）`;
		next.updatedAt = new Date().toISOString();
		history.replace(next);
		selectedDayId = next.days[0]?.id ?? '';
		persistFestival();
		notify('サンプルをローカルコピーとして開きました');
	}

	async function removeFestival(): Promise<void> {
		await deleteFestival(history.festival.id);
		newFestival();
		notify('ローカル timetable を削除しました');
	}

	function importFestival(text: string): boolean {
		const result = parseTransferDocument(text);
		if (!result.ok) {
			notify(result.error);
			return false;
		}
		const next = cloneFestival(result.festival);
		next.id = newId();
		next.title = `${next.title}（インポート）`;
		next.updatedAt = new Date().toISOString();
		history.replace(next);
		selectedDayId = next.days[0]?.id ?? '';
		persistFestival();
		notify('新しいローカルコピーを作成しました');
		return true;
	}

	function saveFestivalSettings(draft: FestivalSettingsDraft): boolean {
		const startText = normalizeToFiveMinuteTime(draft.displayStart, 30);
		const endText = normalizeToFiveMinuteTime(draft.displayEnd, 30);
		const startMinute = startText ? parseMinute(startText) : null;
		const endMinute = endText ? parseMinute(endText) : null;
		const title = draft.title.trim();
		const timezone = draft.timezone.trim();
		if (!title) {
			notify('フェス名を入力してください');
			return false;
		}
		if (!draft.date) {
			notify('日付を入力してください');
			return false;
		}
		if (startMinute === null || endMinute === null || endMinute <= startMinute) {
			notify('表示終了時刻は開始時刻より後の時刻（最大30:00）にしてください');
			return false;
		}
		try {
			new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
		} catch {
			notify('有効なタイムゾーンを入力してください');
			return false;
		}
		updateFestival((next) => {
			next.title = title;
			next.timezone = timezone;
			const targetDay = next.days.find((candidate) => candidate.id === selectedDayId);
			if (!targetDay) return;
			targetDay.date = draft.date;
			targetDay.displayStartMinute = startMinute;
			targetDay.displayEndMinute = endMinute;
		});
		return true;
	}

	async function load(): Promise<void> {
		const storedPreferences = await loadPreferences();
		if (storedPreferences) {
			preferences = { ...defaults, ...storedPreferences };
			const legacyPreferences = storedPreferences as UserPreferences & { laneWidth?: number };
			const legacyWidth = legacyPreferences.laneWidth;
			if (!storedPreferences.laneWidths) {
				preferences.laneWidths = {
					stage: legacyWidth ?? defaults.laneWidths.stage,
					tokuten: legacyWidth ?? defaults.laneWidths.tokuten,
					event: legacyWidth ?? defaults.laneWidths.event
				};
			}
			preferences.laneWidthMode ??= 'type';
			preferences.itemOverlapPolicy ??= 'allow';
			preferences.snapMinutes = 5;
			if (
				storedPreferences.timeZoom === 54 ||
				storedPreferences.timeZoom === 180 ||
				storedPreferences.timeZoom === 300
			) {
				preferences.timeZoom = defaults.timeZoom;
			} else {
				preferences.timeZoom = Math.max(120, Math.min(360, storedPreferences.timeZoom));
			}
		}
		const stored = await listFestivals();
		const storedLast = stored.find((candidate) => candidate.id === preferences.lastFestivalId);
		if (storedLast) history.replace(storedLast);
		else if (stored[0]) history.replace(stored[0]);
		selectedDayId =
			preferences.lastDayId && history.festival.days.some((candidate) => candidate.id === preferences.lastDayId)
				? preferences.lastDayId
				: (history.festival.days[0]?.id ?? '');
		if (!stored.length) await saveFestival(history.festival);
		isLoading = false;
	}

	return {
		get festival() {
			return history.festival;
		},
		get preferences() {
			return preferences;
		},
		get selectedDayId() {
			return selectedDayId;
		},
		get selectedSampleId() {
			return selectedSampleId;
		},
		get isLoading() {
			return isLoading;
		},
		get undoStack() {
			return history.undoStack;
		},
		get redoStack() {
			return history.redoStack;
		},
		persistPreferences,
		updateFestival,
		replaceFestival,
		selectDay,
		toggleTheme,
		toggleLanguage,
		undo,
		redo,
		addDay,
		newFestival,
		copyTemplate,
		removeFestival,
		importFestival,
		saveFestivalSettings,
		load
	};
}
