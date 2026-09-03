<script lang="ts">
	import { onMount } from 'svelte';
	import {
		computeGridRange,
		cycleFavorite,
		detectConflicts,
		getRelatedItemIds,
		packCompactItems,
		readableTextColor,
		snapMinutes
	} from '$lib/scheduler';
	import { cloneFestival, createBlankFestival, SAMPLE_FESTIVAL } from '$lib/sample-data';
	import { createTransferDocument, parseTransferDocument } from '$lib/transfer';
	import {
		deleteFestival,
		listFestivals,
		loadPreferences,
		saveFestival,
		savePreferences
	} from '$lib/storage';
	import type {
		Festival,
		FestivalDay,
		Lane,
		LaneType,
		ScheduleItem,
		UserPreferences
	} from '$lib/types';

	const copy = {
		timetable: { ja: 'タイムテーブル', en: 'Timetable' },
		edit: { ja: '編集', en: 'Edit' },
		editTools: { ja: '編集ツール', en: 'Editing tools' },
		add: { ja: '項目を追加', en: 'Add item(s)' },
		search: { ja: 'アーティスト検索', en: 'Search artists' },
		favorite: { ja: 'お気に入り', en: 'Favorites' },
		import: { ja: 'インポート', en: 'Import' },
		export: { ja: 'エクスポート', en: 'Export' },
		share: { ja: '共有', en: 'Share' },
		colorMode: { ja: '色分け', en: 'Block colors' },
		settings: { ja: '表示設定', en: 'Display settings' },
		snap: { ja: '時間刻み', en: 'Time step' },
		zoom: { ja: '縦間隔', en: 'Vertical spacing' },
		newFestival: { ja: '新しいフェス', en: 'New timetable' },
		copyTemplate: { ja: 'サンプルをコピー', en: 'Copy bundled sample' },
		saved: { ja: '保存済み', en: 'Saved locally' },
		all: { ja: 'ALL', en: 'ALL' },
		compact: { ja: '詰めて表示', en: 'Compact' },
		full: { ja: 'レーンを維持', en: 'Keep lanes' },
		addDay: { ja: '日を追加', en: 'Add day' },
		addLane: { ja: 'レーンを追加', en: 'Add lane' },
		laneName: { ja: 'レーン名', en: 'Lane name' },
		laneType: { ja: 'レーン種別', en: 'Lane type' },
		stage: { ja: 'ステージ', en: 'Stage' },
		tokuten: { ja: '特典会', en: 'Meet & greet' },
		event: { ja: 'イベント', en: 'Event' },
		venue: { ja: '会場', en: 'Venue' },
		venueUrl: { ja: '会場 URL', en: 'Venue URL' },
		opening: { ja: '開場時刻', en: 'Opening time' },
		color: { ja: '色', en: 'Color' },
		editLane: { ja: 'レーンを編集', en: 'Edit lane' },
		info: { ja: 'レーン情報', en: 'Lane information' },
		related: { ja: '関連するイベント', en: '関連するイベント' },
		theme: { ja: 'ダークモード', en: 'ダークモード' },
		lightTheme: { ja: 'ライトモード', en: 'ライトモード' },
		duplicate: { ja: '複製', en: '複製' },
		relatedLane: { ja: '追加先レーン', en: '追加先レーン' },
		relatedTiming: { ja: '開始タイミング', en: '開始タイミング' },
		afterEnd: { ja: '終演後', en: '終演後' },
		custom: { ja: 'カスタム', en: 'カスタム' },
		close: { ja: '閉じる', en: 'Close' },
		cancel: { ja: 'キャンセル', en: 'Cancel' },
		apply: { ja: '保存', en: 'Save' },
		delete: { ja: '削除', en: 'Delete' },
		fixed: { ja: '固定長で一括入力', en: 'Populate with fixed length' },
		preview: { ja: 'プレビューを作成', en: 'Create preview' },
		create: { ja: '作成', en: 'Create' },
		jumpNow: { ja: '現在時刻へ', en: 'Jump to now' },
		undo: { ja: '元に戻す', en: 'Undo' },
		redo: { ja: 'やり直す', en: 'Redo' }
	} as const;

	type FavoriteFilter = 0 | 1 | 2 | 3;
	type DragState = {
		kind: 'move' | 'resize';
		itemId: string;
		originY: number;
		startMinute: number;
		endMinute: number;
	} | null;
	type CreateState = { laneId: string; startMinute: number; currentMinute: number } | null;
	type BulkRow = { id: string; artist: string; start: number; end: number };
	type FestivalSettingsDraft = {
		title: string;
		timezone: string;
		date: string;
		displayStart: string;
		displayEnd: string;
	};
	const relatedDelayOptions = [0, 5, 10, 15, 20] as const;
	const customRelatedDelayOptions = Array.from({ length: 32 }, (_, index) => (index + 5) * 5);

	const defaults: UserPreferences = {
		language: 'ja',
		theme: 'light',
		snapMinutes: 5,
		timeZoom: 180,
		laneWidth: 152,
		compactFavorites: false,
		blockColorMode: 'full'
	};

	let festival = $state<Festival>(cloneFestival(SAMPLE_FESTIVAL));
	let preferences = $state<UserPreferences>({ ...defaults });
	let selectedDayId = $state(SAMPLE_FESTIVAL.days[0]?.id ?? '');
	let favoriteFilter = $state<FavoriteFilter>(0);
	let searchQuery = $state('');
	let editMode = $state(false);
	let settingsOpen = $state(false);
	let isLoading = $state(true);
	let addMode = $state(false);
	let addLaneId = $state('');
	let dragging = $state<DragState>(null);
	let creating = $state<CreateState>(null);
	let editingItemId = $state<string | null>(null);
	let editDraft = $state<ScheduleItem | null>(null);
	let editingItemIsNew = $state(false);
	let relatedLaneId = $state('');
	let relatedDelay = $state('0');
	let customRelatedDelay = $state(25);
	let laneDraft = $state<Lane | null>(null);
	let laneDraftIsNew = $state(false);
	let infoLaneId = $state<string | null>(null);
	let relatedModalItemId = $state<string | null>(null);
	let importOpen = $state(false);
	let importText = $state('');
	let bulkOpen = $state(false);
	let bulkRowsText = $state('');
	let bulkStartText = $state('10:00');
	let bulkLength = $state(15);
	let bulkPreview = $state<BulkRow[]>([]);
	let festivalSettingsOpen = $state(false);
	let festivalSettingsDraft = $state<FestivalSettingsDraft | null>(null);
	let toast = $state('');
	let nowMinute = $state(0);
	let undoStack = $state<Festival[]>([]);
	let redoStack = $state<Festival[]>([]);
	let longPressTimer: number | undefined;
	let scroller = $state<HTMLDivElement>();

	$effect(() => {
		document.documentElement.dataset.theme = preferences.theme;
		return () => {
			delete document.documentElement.dataset.theme;
		};
	});

	const day = $derived(
		festival.days.find((candidate) => candidate.id === selectedDayId) ?? festival.days[0]
	);
	const lanes = $derived(day?.lanes ?? []);
	const items = $derived(day?.items ?? []);
	const automaticGridRange = $derived(computeGridRange(items, day?.openingMinute));
	const gridRange = $derived({
		startMinute: day?.displayStartMinute ?? automaticGridRange.startMinute,
		endMinute: day?.displayEndMinute ?? automaticGridRange.endMinute
	});
	const searchNormalized = $derived(searchQuery.normalize('NFKC').trim().toLocaleLowerCase());
	const favoriteItems = $derived(
		favoriteFilter === 0 ? items : items.filter((item) => item.favoriteLevel >= favoriteFilter)
	);
	const compactActive = $derived(favoriteFilter > 0 && preferences.compactFavorites);
	const visibleLanes = $derived(
		favoriteFilter === 0
			? lanes
			: lanes.filter((lane) => favoriteItems.some((item) => item.laneId === lane.id))
	);
	const compactPlacements = $derived(packCompactItems(favoriteItems));
	const compactColumnCount = $derived(
		Math.max(
			1,
			compactPlacements.reduce((max, entry) => Math.max(max, entry.column + 1), 0)
		)
	);
	const visibleColumns = $derived(
		compactActive ? compactColumnCount : Math.max(1, visibleLanes.length)
	);
	const gridHeight = $derived(
		Math.max(520, ((gridRange.endMinute - gridRange.startMinute) / 60) * preferences.timeZoom)
	);
	const conflicts = $derived(detectConflicts(items));
	const conflictIds = $derived(
		new Set([...conflicts.sameLane.flat(), ...conflicts.sameArtist.flat()])
	);
	const timeTicks = $derived.by(() => {
		const first = Math.ceil(gridRange.startMinute / 60) * 60;
		return Array.from(
			{ length: Math.max(0, Math.floor((gridRange.endMinute - first) / 60) + 1) },
			(_, index) => first + index * 60
		);
	});
	const infoLane = $derived(lanes.find((lane) => lane.id === infoLaneId));
	const relatedModalIds = $derived.by(() =>
		relatedModalItemId
			? [
					relatedModalItemId,
					...getRelatedItemIds(items, festival.artistDirectory, relatedModalItemId)
				]
			: []
	);
	const compactPreview = $derived.by(() => {
		if (!creating) return null;
		const start = Math.min(creating.startMinute, creating.currentMinute);
		const end = Math.max(creating.startMinute, creating.currentMinute);
		return {
			top: minuteToY(start),
			height: Math.max(22, minuteToY(end) - minuteToY(start)),
			duration: Math.max(preferences.snapMinutes, end - start)
		};
	});

	function t(key: keyof typeof copy): string {
		return copy[key][preferences.language];
	}
	function newId(): string {
		return (
			globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
		);
	}
	function formatMinute(minute: number): string {
		return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
	}
	function parseMinute(value: string): number {
		const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
		return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
	}
	function validDisplayMinute(value: string, maxHour: number): number | null {
		const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
		if (!match) return null;
		const hour = Number(match[1]);
		const minute = Number(match[2]);
		if (hour > maxHour || minute > 59 || (hour === maxHour && minute !== 0)) return null;
		return hour * 60 + minute;
	}
	function openFestivalSettings(): void {
		if (!day) return;
		festivalSettingsDraft = {
			title: festival.title,
			timezone: festival.timezone,
			date: day.date,
			displayStart: formatMinute(day.displayStartMinute ?? automaticGridRange.startMinute),
			displayEnd: formatMinute(day.displayEndMinute ?? automaticGridRange.endMinute)
		};
		festivalSettingsOpen = true;
	}
	function closeFestivalSettings(): void {
		festivalSettingsOpen = false;
		festivalSettingsDraft = null;
	}
	function saveFestivalSettings(): void {
		if (!festivalSettingsDraft) return;
		const startMinute = validDisplayMinute(festivalSettingsDraft.displayStart, 24);
		const endMinute = validDisplayMinute(festivalSettingsDraft.displayEnd, 30);
		const title = festivalSettingsDraft.title.trim();
		const timezone = festivalSettingsDraft.timezone.trim();
		if (!title) {
			flash('フェス名を入力してください');
			return;
		}
		if (!festivalSettingsDraft.date) {
			flash('日付を入力してください');
			return;
		}
		if (startMinute === null || endMinute === null || endMinute <= startMinute) {
			flash('表示終了時刻は開始時刻より後の時刻（最大30:00）にしてください');
			return;
		}
		try {
			new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
		} catch {
			flash('有効なタイムゾーンを入力してください');
			return;
		}
		updateFestival((next) => {
			next.title = title;
			next.timezone = timezone;
			const targetDay = next.days.find((candidate) => candidate.id === selectedDayId);
			if (!targetDay) return;
			targetDay.date = festivalSettingsDraft!.date;
			targetDay.displayStartMinute = startMinute;
			targetDay.displayEndMinute = endMinute;
		});
		closeFestivalSettings();
	}
	function updateLaneOpening(value: string): void {
		if (!laneDraft) return;
		if (!value.trim()) {
			laneDraft.openingMinute = undefined;
			return;
		}
		if (/^\d{1,2}:\d{2}$/.test(value.trim())) laneDraft.openingMinute = parseMinute(value);
	}
	function laneTypeLabel(type: LaneType): string {
		return copy[type].ja;
	}
	function minuteToY(minute: number): number {
		return ((minute - gridRange.startMinute) / 60) * preferences.timeZoom;
	}
	function minuteFromPointer(event: PointerEvent, target: HTMLElement): number {
		const rect = target.getBoundingClientRect();
		return snapMinutes(
			gridRange.startMinute + ((event.clientY - rect.top) / preferences.timeZoom) * 60,
			preferences.snapMinutes
		);
	}
	function displayItem(item: ScheduleItem): boolean {
		return (
			!searchNormalized ||
			item.artistLabel.normalize('NFKC').toLocaleLowerCase().includes(searchNormalized)
		);
	}
	function itemIsFavoriteMatch(item: ScheduleItem): boolean {
		return favoriteFilter === 0 || item.favoriteLevel >= favoriteFilter;
	}
	function itemForLane(laneId: string): ScheduleItem[] {
		return items.filter((item) => item.laneId === laneId && itemIsFavoriteMatch(item));
	}
	function laneForItem(item: ScheduleItem): Lane | undefined {
		return lanes.find((lane) => lane.id === item.laneId);
	}
	function compactItemsForColumn(column: number): ScheduleItem[] {
		return compactPlacements.filter((entry) => entry.column === column).map((entry) => entry.item);
	}
	function itemStyle(item: ScheduleItem): string {
		const top = minuteToY(item.startMinute);
		const height = Math.max(24, minuteToY(item.endMinute) - minuteToY(item.startMinute) - 4);
		const color = laneForItem(item)?.color ?? '#a8adb5';
		return `top:${top}px;height:${height}px;--item-color:${color};--item-text:${readableTextColor(color)};`;
	}
	function copyHandleStyle(item: ScheduleItem): string {
		const top = minuteToY(item.startMinute);
		const height = Math.max(24, minuteToY(item.endMinute) - minuteToY(item.startMinute) - 4);
		return `top:${top + height - 19}px;`;
	}
	function laneStyle(lane: Lane): string {
		const color = lane.color ?? '#a8adb5';
		return `--lane-color:${color};--lane-icon:${readableTextColor(color)};`;
	}

	function updateFestival(mutator: (next: Festival) => void): void {
		undoStack.push(cloneFestival(festival));
		redoStack = [];
		const next = cloneFestival(festival);
		mutator(next);
		next.updatedAt = new Date().toISOString();
		festival = next;
		void saveFestival(next);
		preferences.lastFestivalId = next.id;
		preferences.lastDayId = selectedDayId;
		void savePreferences(preferences);
	}
	function undo(): void {
		const previous = undoStack.pop();
		if (!previous) return;
		redoStack.push(cloneFestival(festival));
		previous.updatedAt = new Date().toISOString();
		festival = previous;
		void saveFestival(previous);
		flash('変更を元に戻しました');
	}
	function redo(): void {
		const next = redoStack.pop();
		if (!next) return;
		undoStack.push(cloneFestival(festival));
		next.updatedAt = new Date().toISOString();
		festival = next;
		void saveFestival(next);
		flash('変更をやり直しました');
	}
	function flash(message: string): void {
		toast = message;
		window.setTimeout(() => {
			if (toast === message) toast = '';
		}, 2600);
	}
	function selectDay(id: string): void {
		selectedDayId = id;
		preferences.lastDayId = id;
		void savePreferences(preferences);
	}
	function isToday(): boolean {
		if (!day) return false;
		return (
			new Intl.DateTimeFormat('en-CA', { timeZone: festival.timezone }).format(new Date()) ===
			day.date
		);
	}
	function jumpToNow(): void {
		if (scroller && isToday())
			scroller.scrollTo({
				top: Math.max(0, minuteToY(nowMinute) - scroller.clientHeight / 2),
				behavior: 'smooth'
			});
	}
	function setFavoriteFilter(level: FavoriteFilter): void {
		favoriteFilter = level;
	}
	function cycleItem(itemId: string): void {
		const current = items.find((item) => item.id === itemId);
		if (editMode && current) {
			openEditor(current);
			return;
		}
		updateFestival((next) => {
			const target = next.days
				.flatMap((candidate) => candidate.items)
				.find((item) => item.id === itemId);
			if (target) target.favoriteLevel = cycleFavorite(target.favoriteLevel);
		});
	}
	function openEditor(item: ScheduleItem, isNew = false): void {
		if (!editMode) return;
		editingItemId = item.id;
		editDraft = JSON.parse(JSON.stringify(item)) as ScheduleItem;
		editingItemIsNew = isNew;
		relatedLaneId = '';
		relatedDelay = '0';
		customRelatedDelay = 25;
	}
	function closeEditor(): void {
		editingItemId = null;
		editDraft = null;
		editingItemIsNew = false;
		relatedLaneId = '';
	}
	function duplicateItem(item: ScheduleItem): void {
		if (!editMode) return;
		const duration = item.endMinute - item.startMinute;
		const duplicate: ScheduleItem = {
			id: newId(),
			laneId: item.laneId,
			startMinute: item.endMinute,
			endMinute: item.endMinute + duration,
			artistLabel: '新しい項目',
			subContent: '',
			artistEntityIds: [],
			favoriteLevel: 0,
			pairedTokutenItemIds: []
		};
		updateFestival((next) =>
			next.days.find((candidate) => candidate.id === selectedDayId)?.items.push(duplicate)
		);
		openEditor(duplicate, true);
	}
	function openRelated(item: ScheduleItem): void {
		relatedModalItemId = item.id;
	}

	function beginItemPointer(
		event: PointerEvent,
		item: ScheduleItem,
		kind: 'move' | 'resize'
	): void {
		if (!editMode) {
			longPressTimer = window.setTimeout(() => openRelated(item), 520);
			return;
		}
		if (compactActive) return;
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
		if (!editMode || !addMode || compactActive || event.button !== 0) return;
		const startMinute = minuteFromPointer(event, event.currentTarget as HTMLElement);
		creating = { laneId, startMinute, currentMinute: startMinute + 15 };
	}
	function handlePointerMove(event: PointerEvent): void {
		const target = event.currentTarget as HTMLElement;
		if (creating) {
			creating.currentMinute = minuteFromPointer(event, target);
			return;
		}
		if (!dragging) return;
		const delta = snapMinutes(
			((event.clientY - dragging.originY) / preferences.timeZoom) * 60,
			preferences.snapMinutes
		);
		const nextStart = Math.max(0, dragging.startMinute + delta);
		const nextEnd = Math.max(nextStart + preferences.snapMinutes, dragging.endMinute + delta);
		updateFestival((next) => {
			const targetItem = next.days
				.flatMap((candidate) => candidate.items)
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
		if (creating) {
			const startMinute = Math.min(creating.startMinute, creating.currentMinute);
			const endMinute = Math.max(
				startMinute + preferences.snapMinutes,
				Math.max(creating.startMinute, creating.currentMinute)
			);
			const item: ScheduleItem = {
				id: newId(),
				laneId: creating.laneId,
				startMinute,
				endMinute,
				artistLabel: '新しい項目',
				subContent: '',
				artistEntityIds: [],
				favoriteLevel: 0,
				pairedTokutenItemIds: []
			};
			updateFestival((next) =>
				next.days.find((candidate) => candidate.id === selectedDayId)?.items.push(item)
			);
			creating = null;
			addMode = false;
			openEditor(item, true);
			return;
		}
		dragging = null;
	}
	function startAdd(): void {
		if (!editMode) editMode = true;
		addMode = true;
		addLaneId = lanes[0]?.id ?? '';
		flash('レーンを選んで、空いている時間をドラッグしてください');
	}

	function saveEditor(): void {
		if (!editDraft || editDraft.endMinute <= editDraft.startMinute) {
			flash('終了時刻は開始時刻より後にしてください');
			return;
		}
		const draft = JSON.parse(JSON.stringify(editDraft)) as ScheduleItem;
		const originalPairIds = items.find((item) => item.id === draft.id)?.pairedTokutenItemIds ?? [];
		const relatedDelayMinutes =
			relatedDelay === 'custom' ? customRelatedDelay : Number.parseInt(relatedDelay, 10);
		const hasRelatedLane = editingItemIsNew && lanes.some((lane) => lane.id === relatedLaneId);
		const relatedItem: ScheduleItem | null = hasRelatedLane
			? {
					id: newId(),
					laneId: relatedLaneId,
					startMinute: draft.endMinute + relatedDelayMinutes,
					endMinute:
						draft.endMinute + relatedDelayMinutes + (draft.endMinute - draft.startMinute),
					artistLabel: draft.artistLabel || '新しい項目',
					subContent: '',
					artistEntityIds: [...draft.artistEntityIds],
					favoriteLevel: 0,
					pairedTokutenItemIds: [draft.id]
				}
			: null;
		if (relatedItem && !draft.pairedTokutenItemIds.includes(relatedItem.id))
			draft.pairedTokutenItemIds = [...draft.pairedTokutenItemIds, relatedItem.id];
		updateFestival((next) => {
			const targetDay = next.days.find((candidate) => candidate.id === selectedDayId);
			const target = targetDay?.items.find((item) => item.id === draft.id);
			if (target) Object.assign(target, draft);
			if (targetDay) {
				for (const candidate of targetDay.items) {
					if (candidate.id === draft.id) continue;
					if (draft.pairedTokutenItemIds.includes(candidate.id)) {
						if (!candidate.pairedTokutenItemIds.includes(draft.id))
							candidate.pairedTokutenItemIds.push(draft.id);
					} else if (originalPairIds.includes(candidate.id)) {
						candidate.pairedTokutenItemIds = candidate.pairedTokutenItemIds.filter(
							(id) => id !== draft.id
						);
					}
				}
			}
			if (relatedItem && targetDay) targetDay.items.push(relatedItem);
		});
		closeEditor();
	}
	function deleteItem(): void {
		if (!editingItemId || !window.confirm('この項目を削除しますか？')) return;
		const id = editingItemId;
		updateFestival((next) => {
			for (const candidate of next.days)
				candidate.items = candidate.items.filter((item) => item.id !== id);
		});
		closeEditor();
	}
	function addLane(): void {
		if (!editMode || !day) return;
		laneDraftIsNew = true;
		laneDraft = {
			id: newId(),
			name: `新しいレーン ${lanes.length + 1}`,
			type: 'event',
			color: ['#ffad0a', '#ef6a56', '#5c9ed6', '#65a989'][lanes.length % 4]
		};
	}
	function openLaneEditor(lane: Lane): void {
		if (!editMode) return;
		laneDraftIsNew = false;
		laneDraft = { ...lane };
		infoLaneId = null;
	}
	function closeLaneEditor(): void {
		laneDraft = null;
		laneDraftIsNew = false;
	}
	function saveLaneDraft(): void {
		if (!editMode || !laneDraft) return;
		const draft = {
			...laneDraft,
			name: laneDraft.name.trim(),
			venueName: laneDraft.venueName?.trim() || undefined,
			venueUrl: laneDraft.venueUrl?.trim() || undefined,
			openingMinute: laneDraft.openingMinute,
			color: laneDraft.color || '#a8adb5'
		};
		if (!draft.name) {
			flash('レーン名を入力してください');
			return;
		}
		updateFestival((next) => {
			const targetDay = next.days.find((candidate) => candidate.id === selectedDayId);
			if (!targetDay) return;
			if (laneDraftIsNew) targetDay.lanes.push(draft);
			else {
				const target = targetDay.lanes.find((lane) => lane.id === draft.id);
				if (target) Object.assign(target, draft);
			}
		});
		closeLaneEditor();
	}
	function addDay(): void {
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
		selectedDayId = newDay.id;
	}
	function newFestival(): void {
		const next = createBlankFestival();
		festival = next;
		selectedDayId = next.days[0]?.id ?? '';
		favoriteFilter = 0;
		void saveFestival(next);
		void savePreferences({ ...preferences, lastFestivalId: next.id, lastDayId: selectedDayId });
	}
	function copyTemplate(): void {
		const next = cloneFestival(SAMPLE_FESTIVAL);
		next.id = newId();
		next.title = `${next.title}（コピー）`;
		next.updatedAt = new Date().toISOString();
		festival = next;
		selectedDayId = next.days[0]?.id ?? '';
		void saveFestival(next);
		flash('サンプル timetable をコピーしました');
	}
	async function removeFestival(): Promise<void> {
		if (!window.confirm('このローカル timetable を削除しますか？')) return;
		await deleteFestival(festival.id);
		newFestival();
		flash('ローカル timetable を削除しました');
	}

	function downloadExport(): void {
		const url = URL.createObjectURL(
			new Blob([createTransferDocument(festival)], { type: 'application/json' })
		);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${festival.title.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'live-fes'}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
		flash('JSON を書き出しました');
	}
	async function copyExport(): Promise<void> {
		await navigator.clipboard?.writeText(createTransferDocument(festival));
		flash('JSON をクリップボードにコピーしました');
	}
	async function shareExport(): Promise<void> {
		if (!navigator.share) return copyExport();
		await navigator.share({ title: festival.title, text: createTransferDocument(festival) });
	}
	function importFestival(text: string): void {
		const result = parseTransferDocument(text);
		if (!result.ok) {
			flash(result.error);
			return;
		}
		const next = cloneFestival(result.festival);
		next.id = newId();
		next.title = `${next.title}（インポート）`;
		next.updatedAt = new Date().toISOString();
		festival = next;
		selectedDayId = next.days[0]?.id ?? '';
		void saveFestival(next);
		importOpen = false;
		importText = '';
		flash('新しいローカルコピーを作成しました');
	}
	async function handleFileInput(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) importFestival(await file.text());
		input.value = '';
	}
	function generateBulkPreview(): void {
		const start = parseMinute(bulkStartText);
		bulkPreview = bulkRowsText
			.split(/\r?\n/)
			.map((artist) => artist.trim())
			.filter(Boolean)
			.map((artist, index) => ({
				id: newId(),
				artist,
				start: start + index * bulkLength,
				end: start + (index + 1) * bulkLength
			}));
	}
	function commitBulk(): void {
		if (!bulkPreview.length) return;
		const targetLaneId = addLaneId || lanes[0]?.id;
		if (!targetLaneId) return;
		const additions = bulkPreview.map((row) => ({
			id: row.id,
			laneId: targetLaneId,
			startMinute: row.start,
			endMinute: row.end,
			artistLabel: row.artist,
			subContent: '',
			artistEntityIds: [],
			favoriteLevel: 0 as const,
			pairedTokutenItemIds: []
		}));
		updateFestival((next) =>
			next.days.find((candidate) => candidate.id === selectedDayId)?.items.push(...additions)
		);
		bulkOpen = false;
		bulkPreview = [];
		flash(`${additions.length} 件を追加しました`);
	}
	function togglePair(itemId: string): void {
		if (!editDraft) return;
		const current = editDraft.pairedTokutenItemIds;
		editDraft.pairedTokutenItemIds = current.includes(itemId)
			? current.filter((id) => id !== itemId)
			: [...current, itemId];
	}
	function relatedEventItems(lane: Lane): ScheduleItem[] {
		const ids: string[] = [];
		for (const item of items.filter((candidate) => candidate.laneId === lane.id)) {
			for (const relatedId of getRelatedItemIds(items, festival.artistDirectory, item.id))
				if (!ids.includes(relatedId)) ids.push(relatedId);
			for (const pairedId of item.pairedTokutenItemIds)
				if (!ids.includes(pairedId)) ids.push(pairedId);
		}
		return items.filter((item) => ids.includes(item.id));
	}

	onMount(() => {
		let timer: number | undefined;
		void (async () => {
			const storedPreferences = await loadPreferences();
			if (storedPreferences) {
				preferences = { ...defaults, ...storedPreferences };
				if (storedPreferences.timeZoom === 54) preferences.timeZoom = defaults.timeZoom;
			}
			const stored = await listFestivals();
			const storedLast = stored.find((candidate) => candidate.id === preferences.lastFestivalId);
			if (storedLast) festival = storedLast;
			else if (stored[0]) festival = stored[0];
			selectedDayId =
				preferences.lastDayId &&
				festival.days.some((candidate) => candidate.id === preferences.lastDayId)
					? preferences.lastDayId
					: (festival.days[0]?.id ?? '');
			if (!stored.length) await saveFestival(festival);
			const updateNow = () => {
				const parts = new Intl.DateTimeFormat('en-GB', {
					timeZone: festival.timezone,
					hour: '2-digit',
					minute: '2-digit',
					hourCycle: 'h23'
				}).formatToParts(new Date());
				nowMinute =
					Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * 60 +
					Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
			};
			updateNow();
			timer = window.setInterval(updateNow, 30_000);
			isLoading = false;
		})();
		return () => {
			if (timer) window.clearInterval(timer);
		};
	});
</script>

<svelte:head><title>{festival.title} · Live-Fes</title></svelte:head>

{#if isLoading}
	<div class="loading-screen">Loading timetable…</div>
{:else}
	<div class="app-shell">
		<header class="app-header">
			<div class="brand-lockup">
				<div class="brand-mark">L/F</div>
				<div>
					<p class="eyebrow">LIVE-FES</p>
					<h1>{t('timetable')}</h1>
				</div>
			</div>
			<div class="header-actions">
				<span class="save-state"><span class="save-dot"></span>{t('saved')}</span>
				<button
					class="icon-button theme-toggle"
					class:active={preferences.theme === 'dark'}
					aria-pressed={preferences.theme === 'dark'}
					aria-label={preferences.theme === 'dark' ? t('lightTheme') : t('theme')}
					title={preferences.theme === 'dark' ? t('lightTheme') : t('theme')}
					onclick={() => {
						preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark';
						void savePreferences(preferences);
					}}
				>
					{preferences.theme === 'dark' ? '☀' : '◐'}
					<span>{preferences.theme === 'dark' ? t('lightTheme') : t('theme')}</span>
				</button>
				<button
					class="icon-button"
					aria-label="日本語 / English"
					onclick={() => {
						preferences.language = preferences.language === 'ja' ? 'en' : 'ja';
						void savePreferences(preferences);
					}}>文 / EN</button
				><button class="outline-button" onclick={copyTemplate}>＋ {t('copyTemplate')}</button>
			</div>
		</header>
		<main class="app-main">
			<section class="festival-strip">
				<div>
					<p class="eyebrow">LOCAL TIMETABLE · {festival.timezone}</p>
					<h2>{festival.title}</h2>
				</div>
				<div class="festival-actions">
					<button class="quiet-button" onclick={newFestival}>＋ {t('newFestival')}</button><button
						class="quiet-button danger-text"
						onclick={removeFestival}>削除</button
					>
				</div>
			</section>
			<nav class="day-tabs" aria-label="Festival days">
				{#each festival.days as festivalDay (festivalDay.id)}<button
						class:active={festivalDay.id === selectedDayId}
						onclick={() => selectDay(festivalDay.id)}
						><span
							>{new Intl.DateTimeFormat(preferences.language === 'ja' ? 'ja-JP' : 'en-US', {
								month: 'short',
								day: 'numeric',
								weekday: 'short',
								timeZone: festival.timezone
							}).format(new Date(`${festivalDay.date}T12:00:00`))}</span
						></button
					>{/each}<button class="add-day" onclick={addDay}>＋ {t('addDay')}</button>
			</nav>
			<section class="toolbar" aria-label="Timetable controls">
				<div class="browse-controls">
					<div class="favorite-control" aria-label={t('favorite')}>
						<span class="filter-label">♥ <span class="toolbar-label">{t('favorite')}</span></span>
						<div class="filter-buttons">
							<button class:active={favoriteFilter === 0} onclick={() => setFavoriteFilter(0)}
								>{t('all')}</button
							><button class:active={favoriteFilter === 1} onclick={() => setFavoriteFilter(1)}
								>♥1+</button
							><button class:active={favoriteFilter === 2} onclick={() => setFavoriteFilter(2)}
								>♥2+</button
							><button class:active={favoriteFilter === 3} onclick={() => setFavoriteFilter(3)}
								>♥3</button
							>
						</div>
						{#if favoriteFilter > 0}<div class="layout-buttons">
								<button
									class:active={!preferences.compactFavorites}
									onclick={() => {
										preferences.compactFavorites = false;
										void savePreferences(preferences);
									}}>{t('full')}</button
								><button
									class:active={preferences.compactFavorites}
									onclick={() => {
										preferences.compactFavorites = true;
										void savePreferences(preferences);
									}}>{t('compact')}</button
								>
							</div>{/if}
					</div>
					<label class="search-field"
						><span aria-hidden="true">⌕</span><input
							aria-label={t('search')}
							placeholder={t('search')}
							value={searchQuery}
							oninput={(event) => (searchQuery = (event.currentTarget as HTMLInputElement).value)}
						/><kbd>/</kbd></label
					><div class="settings-menu">
						<button
							class="settings-button"
							class:active={settingsOpen}
							aria-expanded={settingsOpen}
							aria-label={t('settings')}
							title={t('settings')}
							onclick={() => (settingsOpen = !settingsOpen)}>⚙ <span class="toolbar-label">{t('settings')}</span></button
						>{#if settingsOpen}<div class="settings-panel">
							<label class="settings-row"
								><span>{t('snap')}</span><select
									aria-label={t('snap')}
									bind:value={preferences.snapMinutes}
									onchange={() => void savePreferences(preferences)}
									><option value={5}>{preferences.language === 'ja' ? '5分' : '5min'}</option><option
										value={10}>{preferences.language === 'ja' ? '10分' : '10min'}</option><option
										value={15}>{preferences.language === 'ja' ? '15分' : '15min'}</option
									></select
								></label
							><label class="settings-row"
								><span>{t('zoom')}</span><div class="settings-range"
									><span aria-hidden="true">↕</span><input
										type="range"
										min="72"
										max="240"
										step="12"
										aria-label={t('zoom')}
										bind:value={preferences.timeZoom}
										onchange={() => void savePreferences(preferences)}
									/><output>{preferences.timeZoom}</output></div
								></label
							><button
								class="settings-choice"
								class:active={preferences.blockColorMode === 'partial'}
								aria-pressed={preferences.blockColorMode === 'partial'}
								onclick={() => {
									preferences.blockColorMode =
										preferences.blockColorMode === 'full' ? 'partial' : 'full';
									void savePreferences(preferences);
								}}>◐ <span>{t('colorMode')}</span><strong
									>{preferences.blockColorMode === 'partial' ? '部分' : '全体'}</strong
								></button
						></div>{/if}
					</div>
					<div class="transfer-actions">
						<button class="quiet-button" onclick={() => (importOpen = true)}>{t('import')}</button
						><button class="quiet-button" onclick={downloadExport}>{t('export')}</button><button
							class="quiet-button share-button"
							onclick={shareExport}>{t('share')}</button
						>
					</div>
				</div>
				<div class="edit-workspace">
					<button
						class="edit-toggle"
						class:active={editMode}
						aria-pressed={editMode}
						aria-label="タイムテーブルを編集"
						title="タイムテーブルを編集"
						onclick={() => {
							editMode = !editMode;
							addMode = false;
							if (!editMode) closeLaneEditor();
						}}
					>
						<span class="toolbar-label">{t('edit')}</span>
						<span class="edit-toggle-icon" aria-hidden="true">✎</span>
						<span class="edit-toggle-track" aria-hidden="true"><span></span></span>
					</button>
				</div>
				{#if editMode}
					<div class="edit-commands" aria-label={t('editTools')}>
						<span class="edit-workspace-label">{t('editTools')}</span>
						<button class="outline-button" onclick={openFestivalSettings}>フェス設定</button>
						<button
							class="quiet-button history-button"
							aria-label={t('undo')}
							title={t('undo')}
							disabled={!undoStack.length}
							onclick={undo}
						>
							↶
						</button>
						<button
							class="quiet-button history-button"
							aria-label={t('redo')}
							title={t('redo')}
							disabled={!redoStack.length}
							onclick={redo}
						>
							↷
						</button>
						<button class="primary-button" onclick={startAdd}>＋ {t('add')}</button>
						<button class="primary-button" onclick={addLane}>＋ {t('addLane')}</button>
					</div>
				{/if}
			</section>
			{#if conflicts.sameLane.length || conflicts.sameArtist.length}<section
					class="warning-bar"
					aria-live="polite"
				>
					<strong>!</strong><span
						>{conflicts.sameLane.length} lane overlap{conflicts.sameLane.length === 1 ? '' : 's'} · {conflicts
							.sameArtist.length} artist conflict{conflicts.sameArtist.length === 1
							? ''
							: 's'}</span
					><span class="warning-hint">Items remain visible; edit mode can resolve them.</span>
				</section>{/if}
			<div class="grid-meta">
				<span
					>{day?.date ?? ''} · {formatMinute(gridRange.startMinute)}–{formatMinute(
						gridRange.endMinute
					)}</span
				><span>{favoriteFilter ? `${favoriteItems.length} items` : `${items.length} items`}</span>
			</div>
			<div class="timetable-scroller" bind:this={scroller}>
				<div
					class:compact-grid={compactActive}
					class="schedule-grid"
					style={`--grid-columns:${visibleColumns};--grid-height:${gridHeight}px;--lane-width:${preferences.laneWidth}px;--header-height:${compactActive ? 0 : 74}px;`}
				>
					<div class="schedule-corner">TIME</div>
					{#if !compactActive}{#each visibleLanes as lane (lane.id)}<div
								class="lane-header"
								style={laneStyle(lane)}
							>
								<strong>{lane.name}</strong>
								{#if editMode}
									<button
										class="lane-edit-button"
										aria-label={`${t('edit')} ${lane.name}`}
										onclick={() => openLaneEditor(lane)}
									>
										✎
									</button>
								{/if}
								<button
									class="lane-info-button"
									aria-label={`${lane.name} ${t('info')}`}
									onclick={() => (infoLaneId = lane.id)}
								>
									ⓘ
								</button>
								{#if lane.openingMinute !== undefined}
									<small>OPEN {formatMinute(lane.openingMinute)}</small>
								{/if}
							</div>{/each}{/if}
					<div class="time-axis" style={`height:${gridHeight}px`}>
						{#each timeTicks as tick (tick)}<span style={`top:${minuteToY(tick)}px`}
								>{formatMinute(tick)}</span
							>{/each}{#if isToday() && nowMinute >= gridRange.startMinute && nowMinute <= gridRange.endMinute}<i
								class="now-axis-label"
								style={`top:${minuteToY(nowMinute)}px`}>NOW</i
							>{/if}
					</div>
					<div
						class="lanes-body"
						role="application"
						aria-label={t('timetable')}
						style={`grid-template-columns:repeat(${visibleColumns},var(--lane-width));min-height:${gridHeight}px;`}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
					>
						{#if compactActive}{#each Array.from( { length: compactColumnCount } ) as column (column)}<div
									class="lane-column"
									role="application"
									aria-label={`Compact column ${Number(column) + 1}`}
									onpointerdown={(event) => beginCreate(event, addLaneId)}
								>
									<div class="grid-lines"></div>
									{#each compactItemsForColumn(Number(column)) as item (item.id)}
										<button
											class:dimmed={!displayItem(item)}
											class:conflict={conflictIds.has(item.id)}
											class:partial-color={preferences.blockColorMode === 'partial'}
											class="schedule-block"
											style={itemStyle(item)}
											aria-label={`${item.artistLabel} ${formatMinute(item.startMinute)}–${formatMinute(item.endMinute)}`}
											onclick={() => cycleItem(item.id)}
											oncontextmenu={(event) => {
												event.preventDefault();
												openRelated(item);
											}}
											onpointerdown={(event) => beginItemPointer(event, item, 'move')}
											ondblclick={() => openEditor(item)}
										>
											<span class="item-time">{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
											{#if item.favoriteLevel > 0}
												<span class="item-favorite">♥{item.favoriteLevel}</span>
											{/if}
											<strong>{item.artistLabel}</strong>
											{#if item.subContent}
												<small>{item.subContent}</small>
											{/if}
											<em>{laneForItem(item)?.venueName ?? ''}</em>
											{#if editMode}
												<span class="item-edit-cue" aria-hidden="true">✎</span>
												<span
													class="resize-handle"
													role="separator"
													aria-label="項目の長さを変更"
													onpointerdown={(event) => {
														event.stopPropagation();
														beginItemPointer(event, item, 'resize');
													}}
												></span>
											{/if}
										</button>
										{#if editMode}
											<button
												class="copy-item-button"
												style={copyHandleStyle(item)}
												aria-label={`${item.artistLabel}を${t('duplicate')}`}
												onpointerdown={(event) => event.stopPropagation()}
												onclick={(event) => {
													event.stopPropagation();
													duplicateItem(item);
												}}
											>
												⧉
											</button>
										{/if}
									{/each}
									{#if creating?.laneId === addLaneId && compactPreview}<div
											class="creation-preview"
											style={`top:${compactPreview.top}px;height:${compactPreview.height}px`}
										>
											新規 · {compactPreview.duration}分
										</div>{/if}
								</div>{/each}
						{:else}{#each visibleLanes as lane (lane.id)}<div
									class="lane-column"
									role="application"
									aria-label={lane.name}
									style={laneStyle(lane)}
									onpointerdown={(event) => beginCreate(event, lane.id)}
								>
									<div class="grid-lines"></div>
									{#if lane.openingMinute !== undefined}<div
											class="opening-marker"
											style={`top:${minuteToY(lane.openingMinute)}px`}
										>
											<span>{formatMinute(lane.openingMinute)}</span>
										</div>{/if}{#if isToday() && nowMinute >= gridRange.startMinute && nowMinute <= gridRange.endMinute}<div
											class="now-line"
											style={`top:${minuteToY(nowMinute)}px`}
										></div>{/if}
										{#each itemForLane(lane.id) as item (item.id)}
											<button
												class:dimmed={!displayItem(item)}
												class:conflict={conflictIds.has(item.id)}
												class:partial-color={preferences.blockColorMode === 'partial'}
												class="schedule-block"
												style={itemStyle(item)}
												aria-label={`${item.artistLabel} ${formatMinute(item.startMinute)}–${formatMinute(item.endMinute)}`}
												onclick={() => cycleItem(item.id)}
												oncontextmenu={(event) => {
													event.preventDefault();
													openRelated(item);
												}}
												onpointerdown={(event) => beginItemPointer(event, item, 'move')}
												ondblclick={() => openEditor(item)}
											>
												<span class="item-time">{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
												{#if item.favoriteLevel > 0}
													<span class="item-favorite">♥{item.favoriteLevel}</span>
												{/if}
												<strong>{item.artistLabel}</strong>
												{#if item.subContent}
													<small>{item.subContent}</small>
												{/if}
											<em>{lane.venueName ?? ''}</em>
											{#if editMode}
												<span class="item-edit-cue" aria-hidden="true">✎</span>
												<span
														class="resize-handle"
														role="separator"
														aria-label="項目の長さを変更"
														onpointerdown={(event) => {
															event.stopPropagation();
															beginItemPointer(event, item, 'resize');
														}}
													></span>
												{/if}
											</button>
											{#if editMode}
												<button
													class="copy-item-button"
													style={copyHandleStyle(item)}
													aria-label={`${item.artistLabel}を${t('duplicate')}`}
													onpointerdown={(event) => event.stopPropagation()}
													onclick={(event) => {
														event.stopPropagation();
														duplicateItem(item);
													}}
												>
													⧉
												</button>
											{/if}
										{/each}
										{#if creating?.laneId === lane.id && compactPreview}<div
											class="creation-preview"
											style={`top:${compactPreview.top}px;height:${compactPreview.height}px`}
										>
											新規 · {compactPreview.duration}分
										</div>{/if}
								</div>{/each}{/if}
					</div>
				</div>
			</div>
			{#if isToday()}<button class="now-button" onclick={jumpToNow}>◉ {t('jumpNow')}</button>{/if}
		</main>
		<footer class="mobile-dock">
			<button class="dock-active">▦<span>{t('timetable')}</span></button><button
				>☷<span>ライブ</span></button
			><button>♡<span>ブックマーク</span></button><button>ⓘ<span>使い方</span></button><button
				>⋮<span>その他</span></button
			>
		</footer>
		{#if toast}<div class="toast" role="status">{toast}</div>{/if}
	</div>
{/if}

{#if festivalSettingsOpen && festivalSettingsDraft}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeFestivalSettings();
		}}
	>
		<div class="modal festival-settings-modal" role="dialog" aria-modal="true" aria-labelledby="festival-settings-title">
			<div class="modal-heading">
				<div>
					<p class="eyebrow">フェス基本設定</p>
					<h2 id="festival-settings-title">フェス設定</h2>
				</div>
				<button class="icon-button" aria-label={t('close')} onclick={closeFestivalSettings}>×</button>
			</div>
			<div class="form-grid">
				<label class="festival-settings-title-field">
					フェス名
					<input bind:value={festivalSettingsDraft.title} />
				</label>
				<label>
					タイムゾーン
					<input list="timezone-options" bind:value={festivalSettingsDraft.timezone} />
				</label>
				<label>
					日付
					<input type="date" bind:value={festivalSettingsDraft.date} />
				</label>
				<label>
					表示開始時刻
					<input inputmode="numeric" placeholder="09:00" bind:value={festivalSettingsDraft.displayStart} />
				</label>
				<label>
					表示終了時刻
					<input inputmode="numeric" placeholder="30:00" bind:value={festivalSettingsDraft.displayEnd} />
				</label>
			</div>
			<datalist id="timezone-options">
				<option value="Asia/Tokyo"></option>
				<option value="Asia/Seoul"></option>
				<option value="Asia/Shanghai"></option>
				<option value="Asia/Singapore"></option>
				<option value="Asia/Bangkok"></option>
				<option value="Australia/Sydney"></option>
				<option value="Europe/London"></option>
				<option value="America/Los_Angeles"></option>
				<option value="America/New_York"></option>
			</datalist>
			<p class="field-note">表示範囲はタイムテーブルの見える時間だけを変更します。終了時刻は翌朝06:00を表す30:00まで指定でき、項目の時刻は変更されません。</p>
			<div class="modal-actions">
				<button class="quiet-button" onclick={closeFestivalSettings}>{t('cancel')}</button>
				<span></span>
				<button class="primary-button" onclick={saveFestivalSettings}>{t('apply')}</button>
			</div>
		</div>
	</div>
{/if}

{#if editingItemId && editDraft}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeEditor();
		}}
	>
		<div class="modal editor-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
			<div class="modal-heading">
				<div>
					<p class="eyebrow">{editingItemIsNew ? '新規項目' : '項目を編集'}</p>
					<h2 id="edit-title">{editDraft.artistLabel || '新しい項目'}</h2>
				</div>
				<button class="icon-button" aria-label={t('close')} onclick={closeEditor}>×</button>
			</div>
			<div class="form-grid">
				<label>
					アーティスト
					<input bind:value={editDraft.artistLabel} />
				</label>
				<label>
					サブコンテンツ
					<input bind:value={editDraft.subContent} />
				</label>
				<label>
					開始時刻
					<input
						value={formatMinute(editDraft.startMinute)}
						oninput={(event) =>
							(editDraft!.startMinute = parseMinute(
								(event.currentTarget as HTMLInputElement).value
							))}
					/>
				</label>
				<label>
					終了時刻
					<input
						value={formatMinute(editDraft.endMinute)}
						oninput={(event) =>
							(editDraft!.endMinute = parseMinute((event.currentTarget as HTMLInputElement).value))}
					/>
				</label>
			</div>
			<div class="favorite-editor">
				<span>お気に入り</span>
				{#each [0, 1, 2, 3] as level (level)}
					<button
						class:active={editDraft.favoriteLevel === level}
						onclick={() => (editDraft!.favoriteLevel = level as 0 | 1 | 2 | 3)}
					>
						♥{level}
					</button>
				{/each}
			</div>
			<fieldset class="pairing-field related-event-field">
				<legend>{t('related')}</legend>
				{#if editingItemIsNew}
					<p class="field-note">保存時に、指定したレーンへ同じ長さの関連イベントを追加します。</p>
					<div class="form-grid related-event-create">
						<label>
							{t('relatedLane')}
							<select bind:value={relatedLaneId}>
								<option value="">追加しない</option>
								{#each lanes as lane (lane.id)}
									<option value={lane.id}>{lane.name}（{laneTypeLabel(lane.type)}）</option>
								{/each}
							</select>
						</label>
						<label>
							{t('relatedTiming')}
							<select bind:value={relatedDelay} disabled={!relatedLaneId}>
								{#each relatedDelayOptions as minutes (minutes)}
									<option value={minutes}>{minutes === 0 ? t('afterEnd') : `${minutes}分後`}</option>
								{/each}
								<option value="custom">{t('custom')}</option>
							</select>
						</label>
						{#if relatedDelay === 'custom'}
							<label>
								カスタム時間
								<select bind:value={customRelatedDelay} disabled={!relatedLaneId}>
									{#each customRelatedDelayOptions as minutes (minutes)}
										<option value={minutes}>{minutes}分後</option>
									{/each}
								</select>
							</label>
						{/if}
					</div>
				{/if}
				<details class="existing-event-picker">
					<summary>既存のイベントを関連付ける</summary>
					<div class="pairing-list">
						{#each items.filter((item) => item.id !== editDraft!.id) as relatedItem (relatedItem.id)}
							<label>
								<input
									type="checkbox"
									checked={editDraft.pairedTokutenItemIds.includes(relatedItem.id)}
									onchange={() => togglePair(relatedItem.id)}
								/>
								<span>{formatMinute(relatedItem.startMinute)}–{formatMinute(relatedItem.endMinute)}</span>
								<strong>{relatedItem.artistLabel}</strong>
								<small>{laneForItem(relatedItem)?.name}</small>
							</label>
						{/each}
					</div>
				</details>
			</fieldset>
			<div class="modal-actions">
				<button class="danger-button" onclick={deleteItem}>{t('delete')}</button>
				<span></span>
				<button class="quiet-button" onclick={closeEditor}>{t('cancel')}</button>
				<button class="primary-button" onclick={saveEditor}>{t('apply')}</button>
			</div>
		</div>
	</div>
{/if}

{#if laneDraft}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeLaneEditor();
		}}
	>
		<div
			class="modal lane-editor-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="lane-editor-title"
		>
			<div class="modal-heading">
				<div>
					<p class="eyebrow">{laneDraftIsNew ? 'ADD LANE' : 'EDIT LANE'}</p>
					<h2 id="lane-editor-title">{laneDraft.name || t('editLane')}</h2>
				</div>
				<button class="icon-button" aria-label={t('close')} onclick={closeLaneEditor}>×</button>
			</div>
			<div class="form-grid lane-form-grid">
				<label>
					{t('laneName')}
					<input bind:value={laneDraft.name} />
				</label>
				<label>
					{t('laneType')}
					<select
						value={laneDraft.type}
						onchange={(event) =>
							(laneDraft!.type = (event.currentTarget as HTMLSelectElement).value as LaneType)}
					>
						<option value="stage">{laneTypeLabel('stage')}</option>
						<option value="tokuten">{laneTypeLabel('tokuten')}</option>
						<option value="event">{laneTypeLabel('event')}</option>
					</select>
				</label>
				<label>
					{t('venue')}
					<input bind:value={laneDraft.venueName} />
				</label>
				<label>
					{t('opening')}
					<input
						value={laneDraft.openingMinute === undefined ? '' : formatMinute(laneDraft.openingMinute)}
						placeholder="10:00"
						oninput={(event) =>
							updateLaneOpening((event.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					{t('venueUrl')}
					<input type="url" bind:value={laneDraft.venueUrl} />
				</label>
				<label class="color-field">
					{t('color')}
					<span>
						<input
							class="lane-color-input"
							type="color"
							value={laneDraft.color ?? '#a8adb5'}
							onchange={(event) =>
								(laneDraft!.color = (event.currentTarget as HTMLInputElement).value)}
						/>
						<code>{laneDraft.color ?? '#a8adb5'}</code>
					</span>
				</label>
			</div>
			{#if !laneDraftIsNew}
				<div class="related-section">
					<h3>{t('related')}</h3>
					{#if relatedEventItems(laneDraft).length}
						{#each relatedEventItems(laneDraft) as item (item.id)}
							<div class="related-row related-row-static">
								<span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
								<strong>{item.artistLabel}</strong>
								<small>{laneForItem(item)?.name}</small>
							</div>
						{/each}
					{:else}
						<p class="empty-copy">関連するイベントはありません。</p>
					{/if}
				</div>
			{/if}
			<div class="modal-actions">
				<span></span>
				<button class="quiet-button" onclick={closeLaneEditor}>{t('cancel')}</button>
				<button class="primary-button" onclick={saveLaneDraft}>{t('apply')}</button>
			</div>
		</div>
	</div>
{/if}

{#if infoLane}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) infoLaneId = null;
		}}
	>
		<div class="modal info-modal" role="dialog" aria-modal="true" aria-labelledby="lane-info-title">
			<div class="modal-heading">
				<div>
					<p class="eyebrow">レーン情報 · {laneTypeLabel(infoLane.type)}</p>
					<h2 id="lane-info-title">{infoLane.name}</h2>
				</div>
				<button class="icon-button" aria-label={t('close')} onclick={() => (infoLaneId = null)}>×</button>
			</div>
			<div class="lane-info-grid">
				<div>
					<span>{t('venue')}</span>
					<strong>{infoLane.venueName || '—'}</strong>
				</div>
				<div>
					<span>{t('opening')}</span>
					<strong>{infoLane.openingMinute !== undefined ? formatMinute(infoLane.openingMinute) : '—'}</strong>
				</div>
				{#if infoLane.venueUrl}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={infoLane.venueUrl} target="_blank" rel="noreferrer">会場を開く ↗</a>
				{/if}
			</div>
			<div class="related-section">
				<h3>{t('related')}</h3>
				{#if relatedEventItems(infoLane).length}
					{#each relatedEventItems(infoLane) as item (item.id)}
						<button
							class="related-row"
							onclick={() => {
								relatedModalItemId = item.id;
								infoLaneId = null;
							}}
						>
							<span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
							<strong>{item.artistLabel}</strong>
							<small>{laneForItem(item)?.name}</small>
						</button>
					{/each}
				{:else}
					<p class="empty-copy">関連するイベントはありません。</p>
				{/if}
			</div>
			<div class="modal-actions">
				<span></span>
				<button class="primary-button" onclick={() => (infoLaneId = null)}>{t('close')}</button>
			</div>
		</div>
	</div>
{/if}

{#if relatedModalItemId}<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) relatedModalItemId = null;
		}}
	>
		<div
			class="modal related-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="related-title"
		>
			<div class="modal-heading">
				<div>
					<p class="eyebrow">FAVORITE QUICK EDIT</p>
					<h2 id="related-title">関連する項目</h2>
				</div>
				<button
					class="icon-button"
					aria-label={t('close')}
					onclick={() => (relatedModalItemId = null)}>×</button
				>
			</div>
			<p class="modal-note">項目をタップするとお気に入りレベルが切り替わります。</p>
			<div class="related-list">
				{#each relatedModalIds as itemId (itemId)}{@const item = items.find(
						(candidate) => candidate.id === itemId
					)}{#if item}<button class="related-row favorite-row" onclick={() => cycleItem(item.id)}
							><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong
								>{item.artistLabel}</strong
							><span class="heart-level">{item.favoriteLevel ? `♥${item.favoriteLevel}` : '♡'}</span
							><small>{laneForItem(item)?.name}</small></button
						>{/if}{/each}
			</div>
		</div>
	</div>{/if}

{#if importOpen}<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) importOpen = false;
		}}
	>
		<div
			class="modal transfer-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="import-title"
		>
			<div class="modal-heading">
				<div>
					<p class="eyebrow">TRANSFER</p>
					<h2 id="import-title">{t('import')}</h2>
				</div>
				<button class="icon-button" aria-label={t('close')} onclick={() => (importOpen = false)}
					>×</button
				>
			</div>
			<p class="modal-note">
				JSONファイルを選択するか、テキストを貼り付けてください。既存データは上書きされません。
			</p>
			<textarea bind:value={importText} placeholder="ここに JSON を貼り付け"></textarea>
			<div class="modal-actions">
				<label class="file-button"
					>ファイルを選択<input
						type="file"
						accept="application/json,.json"
						onchange={handleFileInput}
					/></label
				><span></span><button class="quiet-button" onclick={() => (importOpen = false)}
					>{t('cancel')}</button
				><button
					class="primary-button"
					onclick={() => importFestival(importText)}
					disabled={!importText.trim()}>{t('import')}</button
				>
			</div>
		</div>
	</div>{/if}

{#if bulkOpen}<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) bulkOpen = false;
		}}
	>
		<div class="modal bulk-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
			<div class="modal-heading">
				<div>
					<p class="eyebrow">BULK ENTRY · {lanes.find((lane) => lane.id === addLaneId)?.name}</p>
					<h2 id="bulk-title">{t('fixed')}</h2>
				</div>
				<button class="icon-button" aria-label={t('close')} onclick={() => (bulkOpen = false)}
					>×</button
				>
			</div>
			{#if !bulkPreview.length}<div class="form-grid">
					<label>開始時刻<input bind:value={bulkStartText} /></label><label
						>1件の長さ（分）<input type="number" min="5" step="5" bind:value={bulkLength} /></label
					>
				</div>
				<label class="bulk-list-label"
					>アーティスト名（1行に1組）<textarea
						bind:value={bulkRowsText}
						placeholder="青空クラブ&#10;月曜日の秘密&#10;Sweet Alley"></textarea></label
				>
				<div class="modal-actions">
					<span></span><button class="quiet-button" onclick={() => (bulkOpen = false)}
						>{t('cancel')}</button
					><button class="primary-button" onclick={generateBulkPreview}>{t('preview')}</button>
				</div>{:else}<div class="preview-table">
					<div class="preview-head"><span>ARTIST</span><span>START</span><span>END</span></div>
					{#each bulkPreview as row (row.id)}<div class="preview-row">
							<input bind:value={row.artist} /><input
								value={formatMinute(row.start)}
								oninput={(event) =>
									(row.start = parseMinute((event.currentTarget as HTMLInputElement).value))}
							/><input
								value={formatMinute(row.end)}
								oninput={(event) =>
									(row.end = parseMinute((event.currentTarget as HTMLInputElement).value))}
							/>
						</div>{/each}
				</div>
				<div class="modal-actions">
					<button class="quiet-button" onclick={() => (bulkPreview = [])}>← 戻る</button><span
					></span><button class="primary-button" onclick={commitBulk}>{t('create')}</button>
				</div>{/if}
		</div>
	</div>{/if}

<style>
	:global(:root) {
		--ink: #1e293b;
		--muted: #64748b;
		--paper: #f5f3ef;
		--panel: #fffefa;
		--line: #d8d8d2;
		--teal: #226b72;
		--teal-strong: #174f55;
		--surface-muted: #ebe9e4;
		--surface-soft: #f2f1ed;
		--surface-selected: #e3f0ed;
		--surface-grid: #e7e7e4;
		--surface-lane: #e4e5e2;
		--surface-axis: #eeefec;
		--surface-corner: #d5d6d2;
		--surface-lane-header: #ffffff;
		--surface-item-neutral: #f4f3ee;
		--ink-item-neutral: #263436;
		--text-grid: #4e5755;
		--text-lane: #1c2b30;
		--text-lane-control: #42545a;
		--text-lane-meta: #53676b;
		--text-corner: #6d726f;
		--line-grid: #c1c2be;
		--line-grid-strong: #8f9693;
		--line-lane: rgba(112, 120, 117, 0.32);
		--grid-major: rgba(86, 95, 92, 0.23);
		--grid-medium: rgba(86, 95, 92, 0.12);
		--grid-minor: rgba(86, 95, 92, 0.06);
		--opening: #2f3635;
		--opening-surface: #252d2d;
		--now: #d34d4d;
		--danger: #b44a43;
		--danger-border: #e8b7b3;
		--danger-surface: #fff4f2;
		--warning: #ffe7a1;
		--warning-ink: #714d00;
		--warning-muted: #8e6d20;
		--warning-accent: #d49b0b;
		--favorite: #c53e41;
		--favorite-surface: #fff1ef;
		--favorite-border: #c94d4e;
		--on-accent: #ffffff;
		--saved: #5ea67e;
		--saved-halo: rgba(94, 166, 126, 0.12);
		--hover-surface: #ebe9e4;
		--active-line: #b5d0cc;
		--toggle-off: #c8ceca;
		--modal-border: #d0d0c9;
		--toast: #233436;
		--item-text-fallback: #13262b;
		--partial-item-border: #737a79;
		--copy-surface: rgba(255, 255, 255, 0.88);
		--copy-border: rgba(20, 38, 43, 0.42);
		--copy-ink: #1d4e54;
		--shadow-soft: rgba(20, 30, 30, 0.08);
		--shadow-control: rgba(20, 30, 30, 0.18);
		--shadow-block: rgba(25, 35, 35, 0.16);
		--shadow-block-hover: rgba(25, 35, 35, 0.25);
		--shadow-modal: rgba(16, 25, 25, 0.26);
		--shadow-toast: rgba(16, 28, 28, 0.25);
		--backdrop: rgba(20, 28, 28, 0.38);
		--scrollbar: #b4b6b4;
		--mobile-dock: rgba(255, 254, 250, 0.96);
	}
	:global(html[data-theme='dark']) {
		--ink: #e7edf1;
		--muted: #a6b2bd;
		--paper: #11181d;
		--panel: #1b252c;
		--line: #3a4852;
		--teal: #67b8be;
		--teal-strong: #8bd6da;
		--surface-muted: #27333a;
		--surface-soft: #253238;
		--surface-selected: #223b3f;
		--surface-grid: #151c21;
		--surface-lane: #263037;
		--surface-axis: #202a30;
		--surface-corner: #273239;
		--surface-lane-header: #ffffff;
		--text-grid: #c1cbd2;
		--text-lane-control: #d1dce2;
		--text-lane-meta: #d1dce2;
		--text-corner: #c1cbd2;
		--line-grid: #45545e;
		--line-grid-strong: #596975;
		--line-lane: rgba(162, 180, 190, 0.34);
		--grid-major: rgba(180, 198, 207, 0.25);
		--grid-medium: rgba(180, 198, 207, 0.13);
		--grid-minor: rgba(180, 198, 207, 0.07);
		--warning: #4e4017;
		--warning-ink: #ffe6a3;
		--warning-muted: #ead18c;
		--copy-surface: rgba(38, 52, 59, 0.94);
		--copy-border: rgba(139, 214, 218, 0.62);
		--copy-ink: #8bd6da;
		--shadow-soft: rgba(2, 7, 10, 0.16);
		--shadow-control: rgba(2, 7, 10, 0.32);
		--shadow-block: rgba(2, 7, 10, 0.35);
		--shadow-block-hover: rgba(2, 7, 10, 0.5);
		--shadow-modal: rgba(2, 7, 10, 0.58);
		--shadow-toast: rgba(2, 7, 10, 0.5);
		--backdrop: rgba(2, 7, 10, 0.66);
		--scrollbar: #61717c;
		--mobile-dock: rgba(27, 37, 44, 0.96);
		--hover-surface: color-mix(in srgb, var(--panel) 82%, var(--ink));
		--active-line: color-mix(in srgb, var(--teal) 45%, var(--line));
		--toggle-off: #52626d;
		--modal-border: var(--line);
		--toast: #102025;
	}
	.app-shell {
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
	}
	.loading-screen {
		display: grid;
		min-height: 100vh;
		place-items: center;
		color: var(--muted);
	}
	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 18px clamp(18px, 4vw, 56px);
		border-bottom: 1px solid var(--line);
		background: var(--panel);
	}
	.brand-lockup,
	.header-actions,
	.browse-controls,
	.edit-workspace,
	.edit-commands,
	.festival-strip,
	.festival-actions,
	.favorite-control,
	.filter-buttons,
	.layout-buttons,
	.modal-actions,
	.save-state,
	.search-field,
	.transfer-actions {
		display: flex;
		align-items: center;
	}
	.brand-lockup {
		gap: 12px;
	}
	.brand-mark {
		display: grid;
		width: 38px;
		height: 38px;
		place-items: center;
		border-radius: 12px 4px 12px 4px;
		background: var(--teal);
		color: var(--on-accent);
		font:
			700 12px/1 Georgia,
			serif;
		letter-spacing: -0.06em;
	}
	.eyebrow {
		margin: 0;
		color: var(--muted);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}
	h1 {
		margin: 2px 0 0;
		font:
			700 19px/1.1 Georgia,
			serif;
	}
	h2 {
		margin: 4px 0 0;
		font:
			700 clamp(24px, 4vw, 40px)/1 Georgia,
			serif;
		letter-spacing: -0.035em;
	}
	.header-actions {
		gap: 8px;
	}
	.theme-toggle {
		white-space: nowrap;
	}
	.theme-toggle.active {
		border-color: var(--teal);
		background: color-mix(in srgb, var(--teal) 16%, var(--panel));
		color: var(--teal);
	}
	.save-state {
		gap: 6px;
		color: var(--muted);
		font-size: 12px;
	}
	.save-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--saved);
		box-shadow: 0 0 0 4px var(--saved-halo);
	}
	.app-main {
		max-width: 1600px;
		margin: 0 auto;
		padding: 28px clamp(14px, 4vw, 56px) 88px;
	}
	.festival-strip {
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 22px;
	}
	.festival-actions {
		gap: 6px;
	}
	.day-tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 16px;
		border-bottom: 1px solid var(--line);
		overflow-x: auto;
	}
	.day-tabs button {
		padding: 10px 16px 12px;
		border: 0;
		border-bottom: 3px solid transparent;
		background: transparent;
		color: var(--muted);
		font-size: 13px;
		white-space: nowrap;
	}
	.day-tabs button.active {
		border-color: var(--teal);
		color: var(--ink);
		font-weight: 800;
	}
	.day-tabs .add-day {
		margin-left: auto;
		color: var(--teal);
	}
	.toolbar {
		display: grid;
		align-items: flex-start;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 12px;
		padding: 11px 0;
		flex-wrap: wrap;
	}
	.browse-controls {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
		min-width: 0;
	}
	.edit-workspace {
		margin-left: auto;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
	}
	.edit-commands {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 6px;
		padding: 6px;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: var(--surface-muted);
	}
	.edit-workspace-label {
		padding: 0 4px;
		color: var(--muted);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}
	.search-field {
		min-width: min(270px, 100%);
		gap: 7px;
		padding: 8px 10px;
		border: 1px solid var(--line);
		border-radius: 4px;
		background: var(--panel);
		color: var(--muted);
	}
	.search-field input {
		min-width: 0;
		width: 180px;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--ink);
	}
	kbd {
		padding: 1px 4px;
		border: 1px solid var(--line);
		border-radius: 3px;
		color: var(--muted);
		font-size: 10px;
	}
	select,
	.icon-button,
	.outline-button,
	.quiet-button,
	.edit-toggle,
	.settings-button,
	.primary-button,
	.danger-button,
	.file-button {
		min-height: 36px;
		border-radius: 4px;
		font-size: 12px;
	}
	select {
		padding: 0 8px;
		border: 1px solid var(--line);
		background: var(--panel);
		color: var(--ink);
	}
	.toolbar-label {
		color: var(--muted);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.01em;
		white-space: nowrap;
	}
	.settings-menu {
		position: relative;
	}
	.settings-button {
		padding: 0 11px;
		border: 1px solid var(--line);
		border-radius: 4px;
		background: var(--panel);
		color: var(--muted);
	}
	.settings-button:hover,
	.settings-button.active {
		border-color: var(--teal);
		background: var(--surface-selected);
		color: var(--teal);
	}
	.settings-panel {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 25;
		display: grid;
		width: 238px;
		gap: 13px;
		padding: 14px;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: var(--panel);
		box-shadow: 0 12px 28px var(--shadow-control);
	}
	.settings-row {
		display: grid;
		gap: 6px;
		color: var(--muted);
		font-size: 11px;
		font-weight: 800;
	}
	.settings-row select {
		width: 100%;
		min-height: 32px;
	}
	.settings-range {
		display: grid;
		grid-template-columns: 16px 1fr auto;
		gap: 7px;
		align-items: center;
		color: var(--muted);
	}
	.settings-range input {
		width: 100%;
		accent-color: var(--teal);
	}
	.settings-range output {
		min-width: 28px;
		color: var(--ink);
		font:
			10px ui-monospace,
			monospace;
		text-align: right;
	}
	.settings-choice {
		display: flex;
		align-items: center;
		gap: 7px;
		width: 100%;
		padding: 9px 10px;
		border: 1px solid var(--line);
		border-radius: 4px;
		background: var(--surface-soft);
		color: var(--muted);
		font-size: 12px;
		text-align: left;
	}
	.settings-choice strong {
		margin-left: auto;
		color: var(--ink);
		font-size: 10px;
	}
	.settings-choice.active {
		border-color: var(--active-line);
		background: var(--surface-selected);
		color: var(--teal);
	}
	.icon-button,
	.quiet-button,
	.outline-button {
		padding: 0 11px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--muted);
	}
	.icon-button:hover,
	.quiet-button:hover,
	.outline-button:hover,
	.icon-button.active,
	.edit-toggle:hover {
		border-color: var(--line);
		background: var(--hover-surface);
		color: var(--ink);
	}
	.outline-button {
		border-color: var(--line);
		background: var(--panel);
		color: var(--ink);
	}
	.edit-toggle {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 0 9px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--panel);
		color: var(--muted);
	}
	.edit-toggle.active {
		border-color: var(--teal);
		background: var(--surface-selected);
		color: var(--teal);
	}
	.edit-toggle-icon {
		font-size: 14px;
		line-height: 1;
	}
	.edit-toggle-track {
		position: relative;
		width: 30px;
		height: 18px;
		border-radius: 999px;
		background: var(--toggle-off);
		transition: background 140ms ease;
	}
	.edit-toggle-track span {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--on-accent);
		box-shadow: 0 1px 3px var(--shadow-control);
		transition: transform 140ms ease;
	}
	.edit-toggle.active .edit-toggle-track {
		background: var(--teal);
	}
	.edit-toggle.active .edit-toggle-track span {
		transform: translateX(12px);
	}
	.primary-button {
		padding: 0 15px;
		border: 1px solid var(--teal);
		background: var(--teal);
		color: var(--on-accent);
		font-weight: 800;
		box-shadow: 0 4px 9px color-mix(in srgb, var(--teal) 13%, transparent);
	}
	.primary-button:hover {
		background: var(--teal-strong);
	}
	.primary-button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.quiet-button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.danger-text {
		color: var(--danger);
	}
	.danger-button {
		padding: 0 12px;
		border: 1px solid var(--danger-border);
		background: var(--danger-surface);
		color: var(--danger);
	}
	.warning-bar {
		display: flex;
		align-items: center;
		gap: 9px;
		margin: 5px 0 11px;
		padding: 9px 12px;
		border-left: 3px solid var(--warning-accent);
		background: var(--warning);
		color: var(--warning-ink);
		font-size: 12px;
	}
	.warning-bar strong {
		display: grid;
		width: 20px;
		height: 20px;
		place-items: center;
		border-radius: 50%;
		background: var(--warning-accent);
		color: var(--on-accent);
	}
	.warning-hint {
		margin-left: auto;
		color: var(--warning-muted);
		font-size: 11px;
	}
	.favorite-control {
		gap: 5px;
		min-height: 36px;
		padding: 3px 5px;
		border: 1px solid var(--line);
		border-radius: 4px;
		background: var(--surface-muted);
	}
	.filter-label {
		padding: 0 4px;
		color: var(--favorite);
		font-size: 12px;
		font-weight: 900;
	}
	.filter-buttons,
	.layout-buttons {
		gap: 3px;
	}
	.filter-buttons button,
	.layout-buttons button {
		min-width: 48px;
		padding: 7px 11px;
		border: 0;
		border-radius: 3px;
		background: transparent;
		color: var(--muted);
		font-size: 12px;
	}
	.filter-buttons button.active,
	.layout-buttons button.active {
		background: var(--panel);
		color: var(--ink);
		font-weight: 800;
		box-shadow: 0 1px 4px var(--shadow-soft);
	}
	.layout-buttons {
		margin-left: 4px;
		border-left: 1px solid var(--line);
		padding-left: 4px;
	}
	.grid-meta {
		display: flex;
		justify-content: space-between;
		margin: 8px 0;
		color: var(--muted);
		font-size: 11px;
	}
	.timetable-scroller {
		position: relative;
		max-height: min(72vh, 540px);
		overflow: auto;
		border: 1px solid var(--line);
		background: var(--surface-grid);
		scrollbar-color: var(--scrollbar) transparent;
	}
	.schedule-grid {
		display: grid;
		grid-template-columns: 64px repeat(var(--grid-columns), var(--lane-width));
		grid-template-rows: var(--header-height) var(--grid-height);
		width: max-content;
		min-width: 100%;
	}
	.schedule-corner,
	.lane-header {
		position: sticky;
		top: 0;
		z-index: 5;
		height: var(--header-height);
		border-right: 1px solid var(--line-grid);
		border-bottom: 1px solid var(--line-grid);
		background: var(--surface-corner);
	}
	.schedule-corner {
		left: 0;
		z-index: 8;
		display: grid;
		place-items: end center;
		padding-bottom: 10px;
		color: var(--text-corner);
		font-size: 10px;
		font-weight: 800;
	}
	.lane-header {
		display: flex;
		align-items: flex-end;
		gap: 6px;
		min-width: var(--lane-width);
		padding: 10px 9px 9px;
		background: color-mix(in srgb, var(--lane-color) 70%, var(--surface-lane-header));
		color: var(--text-lane);
		font-size: 12px;
		line-height: 1.1;
	}
	.lane-header::after {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: var(--lane-color);
		content: '';
		opacity: 0.12;
	}
	.lane-header strong {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.lane-header strong {
		min-width: 0;
		flex: 1;
	}
	.lane-header button {
		flex: 0 0 auto;
		margin-left: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--lane-icon, var(--text-lane-control));
		font-size: 15px;
	}
	.lane-header .lane-edit-button {
		margin-left: auto;
		font-size: 13px;
	}
	.lane-header button:hover {
		color: var(--lane-icon, var(--teal));
		filter: brightness(0.82);
	}
	.lane-header button:disabled {
		cursor: not-allowed;
		opacity: 0.38;
	}
	.lane-header small {
		position: absolute;
		left: 9px;
		top: 9px;
		color: var(--text-lane-meta);
		font-size: 9px;
		font-weight: 800;
	}
	.time-axis {
		position: sticky;
		left: 0;
		z-index: 4;
		grid-column: 1;
		grid-row: 2;
		background: var(--surface-axis);
		border-right: 2px solid var(--line-grid-strong);
	}
	.time-axis span {
		position: absolute;
		right: 8px;
		transform: translateY(-50%);
		color: var(--text-grid);
		font:
			11px/1 'IBM Plex Mono',
			ui-monospace,
			monospace;
	}
	.now-axis-label {
		position: absolute;
		right: 5px;
		z-index: 2;
		transform: translateY(-50%);
		padding: 2px 3px;
		border-radius: 2px;
		background: var(--now);
		color: var(--on-accent);
		font:
			700 8px/1 ui-monospace,
			monospace;
	}
	.lanes-body {
		position: relative;
		display: grid;
		grid-column: 2 / -1;
		grid-row: 2;
		min-width: 0;
	}
	.lane-column {
		position: relative;
		min-width: var(--lane-width);
		overflow: visible;
		border-right: 1px solid var(--line-lane);
		background: var(--surface-lane);
	}
	.grid-lines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(to bottom, var(--grid-major) 1px, transparent 1px),
			linear-gradient(to bottom, var(--grid-medium) 1px, transparent 1px),
			linear-gradient(to bottom, var(--grid-minor) 1px, transparent 1px);
		background-size:
			100% 54px,
			100% 27px,
			100% 13.5px;
	}
	.opening-marker {
		position: absolute;
		right: 0;
		left: 0;
		z-index: 2;
		border-top: 3px solid var(--opening);
		pointer-events: none;
	}
	.opening-marker span {
		position: absolute;
		top: -13px;
		left: 5px;
		padding: 2px 4px;
		background: var(--opening-surface);
		color: var(--on-accent);
		font:
			8px/1 ui-monospace,
			monospace;
	}
	.now-line {
		position: absolute;
		right: -1px;
		left: -1px;
		z-index: 3;
		border-top: 2px solid var(--now);
		pointer-events: none;
	}
	.now-line::after {
		position: absolute;
		top: -5px;
		left: -3px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--now);
		content: '';
	}
	.schedule-block {
		position: absolute;
		right: 4px;
		left: 4px;
		z-index: 4;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		overflow: hidden;
		padding: 5px 6px 4px;
		border: 0;
		border-left: 3px solid var(--item-color);
		border-radius: 5px;
		background: var(--item-color);
		color: var(--item-text, var(--item-text-fallback));
		text-align: left;
		box-shadow: 0 1px 4px var(--shadow-block);
		transition:
			filter 0.12s ease,
			opacity 0.12s ease,
			box-shadow 0.12s ease;
	}
	.schedule-block:hover,
	.schedule-block:focus-visible {
		z-index: 7;
		filter: saturate(1.1) brightness(1.03);
		box-shadow: 0 4px 11px var(--shadow-block-hover);
	}
	.schedule-block.partial-color {
		border: 1px solid color-mix(in srgb, var(--item-color) 55%, var(--partial-item-border));
		border-left: 8px solid var(--item-color);
		background: var(--surface-item-neutral);
		color: var(--ink-item-neutral);
	}
	.schedule-block.dimmed {
		opacity: 0.2;
	}
	.schedule-block.conflict {
		outline: 2px dashed var(--danger);
		outline-offset: -2px;
	}
	.item-time {
		color: inherit;
		font:
			9px/1 ui-monospace,
			monospace;
		opacity: 0.86;
	}
	.item-favorite {
		position: absolute;
		top: 4px;
		right: 5px;
		color: var(--favorite);
		font:
			700 11px/1 ui-monospace,
			monospace;
	}
	.schedule-block strong {
		display: -webkit-box;
		margin-top: 3px;
		overflow: hidden;
		font-size: clamp(12px, 1.2vw, 17px);
		line-height: 1.08;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}
	.schedule-block small {
		display: -webkit-box;
		margin-top: 3px;
		overflow: hidden;
		font-size: 10px;
		line-height: 1.05;
		opacity: 0.8;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.schedule-block em {
		margin-top: auto;
		overflow: hidden;
		color: inherit;
		font-size: 9px;
		font-style: normal;
		line-height: 1;
		opacity: 0.72;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.resize-handle {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 7px;
		cursor: ns-resize;
	}
	.item-edit-cue {
		position: absolute;
		bottom: 4px;
		left: 6px;
		font-size: 12px;
		font-weight: 800;
		line-height: 1;
		opacity: 0.78;
		pointer-events: none;
	}
	.copy-item-button {
		position: absolute;
		right: 7px;
		left: auto;
		z-index: 9;
		width: 22px;
		height: 17px;
		padding: 0;
		border: 1px solid var(--copy-border);
		border-radius: 3px;
		background: var(--copy-surface);
		color: var(--copy-ink);
		font-size: 12px;
		line-height: 1;
		box-shadow: 0 1px 3px var(--shadow-control);
	}
	.copy-item-button:hover,
	.copy-item-button:focus-visible {
		border-color: var(--copy-ink);
		background: var(--panel);
		outline: 0;
	}
	.creation-preview {
		position: absolute;
		right: 5px;
		left: 5px;
		z-index: 8;
		display: grid;
		place-items: center;
		border: 2px dashed var(--teal);
		background: color-mix(in srgb, var(--teal) 18%, transparent);
		color: var(--teal);
		font-size: 10px;
		font-weight: 800;
		pointer-events: none;
	}
	.now-button {
		position: sticky;
		right: 18px;
		float: right;
		bottom: 18px;
		z-index: 12;
		margin-top: -52px;
		padding: 11px 15px;
		border: 0;
		border-radius: 999px;
		background: var(--now);
		color: var(--on-accent);
		font-size: 12px;
		font-weight: 800;
		box-shadow: 0 6px 18px color-mix(in srgb, var(--now) 25%, transparent);
	}
	.mobile-dock {
		display: none;
	}
	.toast {
		position: fixed;
		right: 22px;
		bottom: 22px;
		z-index: 30;
		max-width: min(360px, calc(100vw - 44px));
		padding: 12px 15px;
		border-radius: 4px;
		background: var(--toast);
		color: var(--on-accent);
		font-size: 12px;
		box-shadow: 0 8px 22px var(--shadow-toast);
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
		padding: 16px;
		background: var(--backdrop);
	}
	.modal {
		width: min(560px, 100%);
		max-height: min(760px, calc(100vh - 32px));
		overflow: auto;
		padding: 22px;
		border: 1px solid var(--modal-border);
		border-radius: 7px;
		background: var(--panel);
		box-shadow: 0 24px 60px var(--shadow-modal);
	}
	.modal-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 18px;
	}
	.modal-heading h2 {
		font-size: 28px;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.form-grid label,
	.bulk-list-label {
		display: grid;
		gap: 6px;
		color: var(--muted);
		font-size: 11px;
		font-weight: 800;
	}
	.form-grid input,
	.form-grid select,
	.bulk-list-label textarea,
	.transfer-modal textarea {
		width: 100%;
		padding: 10px;
		border: 1px solid var(--line);
		border-radius: 4px;
		background: var(--panel);
		color: var(--ink);
		font-size: 13px;
	}
	.lane-form-grid {
		grid-template-columns: 1fr 1fr;
	}
	.color-field > span {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.lane-color-input {
		width: 42px !important;
		height: 36px;
		padding: 3px !important;
		cursor: pointer;
	}
	.color-field code {
		color: var(--muted);
		font:
			11px ui-monospace,
			monospace;
	}
	.favorite-editor {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 18px 0;
		color: var(--muted);
		font-size: 12px;
	}
	.favorite-editor span {
		margin-right: 8px;
	}
	.favorite-editor button {
		padding: 6px 9px;
		border: 1px solid var(--line);
		border-radius: 3px;
		background: var(--panel);
		color: var(--favorite);
	}
	.favorite-editor button.active {
		border-color: var(--favorite-border);
		background: var(--favorite-surface);
		font-weight: 800;
	}
	.pairing-field {
		display: grid;
		gap: 7px;
		max-height: 150px;
		overflow: auto;
		margin: 14px 0;
		padding: 12px;
		border: 1px solid var(--line);
		color: var(--muted);
		font-size: 11px;
	}
	.pairing-field label {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.related-event-field {
		gap: 12px;
		margin: 18px 0;
		border-radius: 5px;
	}
	.field-note {
		margin: 0;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.5;
	}
	.related-event-create {
		width: 100%;
	}
	.related-event-create label {
		display: grid;
		align-items: initial;
		gap: 6px;
	}
	.related-event-create select {
		width: 100%;
	}
	.existing-event-picker {
		border-top: 1px solid var(--line);
		padding-top: 10px;
	}
	.existing-event-picker summary {
		cursor: pointer;
		color: var(--ink);
		font-size: 12px;
		font-weight: 800;
	}
	.festival-settings-title-field {
		grid-column: 1 / -1;
	}
	.pairing-list {
		display: grid;
		gap: 4px;
		max-height: 160px;
		overflow: auto;
		margin-top: 9px;
	}
	.pairing-list label {
		display: grid;
		grid-template-columns: auto 80px 1fr auto;
		gap: 7px;
		align-items: center;
		padding: 7px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--panel) 84%, var(--ink));
	}
	.pairing-list span,
	.pairing-list small {
		color: var(--muted);
		font-size: 10px;
	}
	.pairing-list strong {
		overflow: hidden;
		font-size: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.modal-actions {
		gap: 8px;
		margin-top: 20px;
	}
	.modal-actions > span {
		flex: 1;
	}
	.lane-info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.lane-info-grid > div {
		display: grid;
		gap: 4px;
		padding: 11px;
		background: var(--surface-soft);
	}
	.lane-info-grid span {
		color: var(--muted);
		font:
			9px ui-monospace,
			monospace;
	}
	.lane-info-grid strong {
		font-size: 13px;
	}
	.lane-info-grid a {
		grid-column: 1 / -1;
		color: var(--teal);
		font-size: 12px;
	}
	.related-section {
		margin-top: 20px;
	}
	.related-section h3 {
		margin-bottom: 9px;
		font:
			700 17px Georgia,
			serif;
	}
	.related-list {
		display: grid;
		gap: 4px;
	}
	.related-row {
		position: relative;
		display: grid;
		grid-template-columns: 82px 1fr auto;
		gap: 9px;
		align-items: center;
		width: 100%;
		padding: 10px;
		border: 1px solid transparent;
		border-bottom-color: var(--line);
		background: transparent;
		color: var(--ink);
		text-align: left;
	}
	.related-row:hover {
		border-color: var(--line);
		background: var(--surface-soft);
	}
	.related-row-static {
		cursor: default;
	}
	.related-row-static:hover {
		border-color: transparent;
		background: transparent;
	}
	.related-row span,
	.related-row small {
		color: var(--muted);
		font-size: 10px;
	}
	.related-row strong {
		font-size: 13px;
	}
	.related-row small {
		grid-column: 2 / -1;
	}
	.heart-level {
		color: var(--favorite) !important;
		font-weight: 800;
	}
	.modal-note,
	.empty-copy {
		color: var(--muted);
		font-size: 12px;
	}
	.transfer-modal textarea {
		min-height: 180px;
		resize: vertical;
		font:
			11px/1.5 ui-monospace,
			monospace;
	}
	.file-button {
		display: grid;
		place-items: center;
		padding: 0 12px;
		border: 1px solid var(--line);
		background: white;
		color: var(--ink);
	}
	.file-button input {
		display: none;
	}
	.bulk-list-label textarea {
		min-height: 140px;
		resize: vertical;
	}
	.preview-table {
		display: grid;
		gap: 5px;
	}
	.preview-head,
	.preview-row {
		display: grid;
		grid-template-columns: 1fr 92px 92px;
		gap: 6px;
		align-items: center;
	}
	.preview-head {
		padding: 0 5px;
		color: var(--muted);
		font:
			9px ui-monospace,
			monospace;
	}
	.preview-row input {
		width: 100%;
		padding: 8px;
		border: 1px solid var(--line);
		border-radius: 3px;
		font-size: 12px;
	}
	@media (min-width: 781px) {
		.brand-mark {
			font-size: 14px;
		}
		.brand-lockup h1 {
			font-size: 21px;
		}
		.eyebrow,
		.schedule-corner,
		.preview-head,
		.lane-info-grid span {
			font-size: 12px;
		}
		.save-state,
		.day-tabs button,
		.warning-bar,
		.filter-label,
		.filter-buttons button,
		.layout-buttons button,
		.grid-meta,
		.lane-header,
		.toast,
		.now-button,
		.modal-note,
		.empty-copy,
		.field-note,
		.favorite-editor,
		.existing-event-picker summary,
		.lane-info-grid a,
		.related-row strong {
			font-size: 14px;
		}
		select,
		.icon-button,
		.outline-button,
		.quiet-button,
		.edit-toggle,
		.settings-button,
		.primary-button,
		.danger-button,
		.file-button,
		.settings-choice,
		.form-grid input,
		.form-grid select,
		.bulk-list-label textarea,
		.transfer-modal textarea,
		.preview-row input {
			font-size: 14px;
		}
		.toolbar-label,
		.settings-row,
		.warning-hint,
		.form-grid label,
		.bulk-list-label,
		.pairing-field,
		.pairing-list span,
		.pairing-list small,
		.related-row span,
		.related-row small {
			font-size: 13px;
		}
		.settings-range output,
		.settings-choice strong,
		.lane-header small,
		.item-time,
		.schedule-block em,
		.opening-marker span,
		.now-axis-label {
			font-size: 11px;
		}
		.time-axis span {
			font-size: 13px;
		}
		.item-favorite,
		.copy-item-button,
		.creation-preview {
			font-size: 12px;
		}
		.schedule-block small {
			font-size: 12px;
		}
		.lane-info-grid strong,
		.pairing-list strong {
			font-size: 14px;
		}
	}
	@media (max-width: 780px) {
		.app-header {
			align-items: flex-start;
			padding: 14px 14px 12px;
		}
		.header-actions {
			flex-wrap: wrap;
			justify-content: flex-end;
			gap: 3px;
		}
		.header-actions .save-state,
		.header-actions .outline-button {
			display: none;
		}
		.app-main {
			padding: 20px 10px 84px;
		}
		.festival-strip {
			align-items: flex-end;
			margin-bottom: 14px;
		}
		.festival-actions .quiet-button {
			padding: 0 6px;
		}
		.toolbar {
			align-items: stretch;
			grid-template-columns: 1fr;
		}
		.browse-controls,
		.edit-workspace {
			width: 100%;
		}
		.edit-workspace {
			margin-left: 0;
			align-items: flex-end;
		}
		.edit-commands {
			width: 100%;
			justify-content: flex-start;
			flex-wrap: wrap;
		}
		.search-field {
			flex: 1;
		}
		.search-field input {
			width: auto;
			flex: 1;
		}
		.browse-controls select {
			flex: 1;
		}
		.toolbar-label {
			display: none;
		}
		.settings-panel {
			position: fixed;
			top: auto;
			right: 10px;
			bottom: 74px;
			left: 10px;
			width: auto;
		}
		.transfer-actions {
			margin-left: auto;
		}
		.warning-hint {
			display: none;
		}
		.favorite-control {
			overflow-x: auto;
		}
		.filter-label {
			white-space: nowrap;
		}
		.layout-buttons {
			margin-left: 0;
		}
		.grid-meta {
			padding: 0 2px;
		}
		.timetable-scroller {
			max-height: min(calc(100vh - 300px), 540px);
		}
		.schedule-grid {
			grid-template-columns: 54px repeat(var(--grid-columns), var(--lane-width));
		}
		.schedule-corner {
			font-size: 9px;
		}
		.mobile-dock {
			position: fixed;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 20;
			display: flex;
			justify-content: space-around;
			padding: 8px 7px max(8px, env(safe-area-inset-bottom));
			border-top: 1px solid var(--line);
			background: var(--mobile-dock);
		}
		.mobile-dock button {
			display: grid;
			gap: 3px;
			place-items: center;
			border: 0;
			background: transparent;
			color: var(--muted);
			font-size: 20px;
		}
		.mobile-dock button span {
			font-size: 9px;
		}
		.mobile-dock .dock-active {
			color: var(--teal);
		}
		.now-button {
			right: 12px;
			bottom: 70px;
		}
		.form-grid {
			grid-template-columns: 1fr;
		}
		.modal {
			padding: 18px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		* {
			scroll-behavior: auto !important;
			transition: none !important;
		}
	}
</style>
