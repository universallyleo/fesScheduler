<script lang="ts">
	import { onMount } from 'svelte';
	import {
		computeGridRange,
		cycleFavorite,
		detectConflicts,
		getSharedLaneOpeningMinute,
		packCompactItems,
		snapMinutes
	} from '$lib/scheduler';
	import {
		BUNDLED_FESTIVALS,
		SAMPLE_FESTIVAL
	} from '$lib/sample-data';
	import { createTransferDocument } from '$lib/transfer';
	import ImportModal from '$lib/components/modals/ImportModal.svelte';
	import ItemEditorModal from '$lib/components/modals/ItemEditorModal.svelte';
	import LaneEditorModal from '$lib/components/modals/LaneEditorModal.svelte';
	import BulkEntryModal from '$lib/components/modals/BulkEntryModal.svelte';
	import FestivalSettingsModal from '$lib/components/modals/FestivalSettingsModal.svelte';
	import LaneInfoModal from '$lib/components/modals/LaneInfoModal.svelte';
	import RelatedItemsModal from '$lib/components/modals/RelatedItemsModal.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import FestivalControls from '$lib/components/FestivalControls.svelte';
	import TimetableToolbar from '$lib/features/scheduler/TimetableToolbar.svelte';
	import TimetableGrid from '$lib/features/scheduler/TimetableGrid.svelte';
	import { createSchedulerSession } from '$lib/features/scheduler/scheduler-session.svelte';
	import { createItemEditorController } from '$lib/features/scheduler/item-editor-controller.svelte';
	import { createLaneEditorController } from '$lib/features/scheduler/lane-editor-controller.svelte';
	import { createGridInteractionController } from '$lib/features/scheduler/grid-interaction-controller.svelte';
	import { createBulkEntryController } from '$lib/features/scheduler/bulk-entry-controller.svelte';
	import { reorderLanes } from '$lib/features/scheduler/lane-order';
	import { createTimetableSelectors } from '$lib/features/scheduler/timetable-selectors';
	import { createTimetablePresentation } from '$lib/features/scheduler/timetable-presentation';
	import { schedulerCopy, type SchedulerCopyKey } from '$lib/features/scheduler/scheduler-copy';
	import {
		formatMinute,
		minuteFromPointer as minuteFromPointerAt,
		minuteToY as minuteToYAt,
		normalizeToFiveMinuteTime
	} from '$lib/features/scheduler/timetable-layout';
	import type { FavoriteFilter, FestivalSettingsDraft } from '$lib/ui-types';
	import type {
		Festival,
		LaneType,
		ScheduleItem,
		UserPreferences
	} from '$lib/types';



	const defaults: UserPreferences = {
		language: 'ja',
		theme: 'light',
		snapMinutes: 5,
		timeZoom: 300,
		laneWidth: 152,
		compactFavorites: false,
		blockColorMode: 'full'
	};

	const session = createSchedulerSession({
		defaults,
		initialFestival: SAMPLE_FESTIVAL,
		newId,
		notify: flash
	});
	const festival = $derived(session.festival);
	const preferences = $derived(session.preferences);
	const selectedDayId = $derived(session.selectedDayId);
	let favoriteFilter = $state<FavoriteFilter>(0);
	let searchQuery = $state('');
	let editMode = $state(false);
	let settingsOpen = $state(false);
	const isLoading = $derived(session.isLoading);
	const itemEditor = createItemEditorController({
		getItems: () => items,
		getLanes: () => lanes,
		getSelectedDayId: () => selectedDayId,
		isEditingEnabled: () => editMode,
		updateFestival,
		newId,
		notify: flash,
		laneTypeLabel
	});
	const editingItemId = $derived(itemEditor.itemId);
	const editDraft = $derived(itemEditor.draft);
	const editingItemIsNew = $derived(itemEditor.isNew);
	const relatedLaneId = $derived(itemEditor.relatedLaneId);
	const relatedDelay = $derived(itemEditor.relatedDelay);
	const customRelatedDelay = $derived(itemEditor.customRelatedDelay);
	const repeatEnabled = $derived(itemEditor.repeatEnabled);
	const repeatCount = $derived(itemEditor.repeatCount);
	const repeatRestMinutes = $derived(itemEditor.repeatRestMinutes);
	const repeatItemsBeforeRest = $derived(itemEditor.repeatItemsBeforeRest);
	const repeatNamesText = $derived(itemEditor.repeatNamesText);
	const maximumRepeatCount = $derived(itemEditor.maximumRepeatCount);
	const repeatPreview = $derived(itemEditor.repeatPreview);
	const destinationLocked = $derived(itemEditor.destinationLocked);
	const copyAcrossBooths = $derived(itemEditor.copyAcrossBooths);
	const boothOffsets = $derived(itemEditor.boothOffsets);
	const boothRepeatNames = $derived(itemEditor.boothRepeatNames);
	const multiBoothPreview = $derived(itemEditor.multiBoothPreview);
	const gridInteraction = createGridInteractionController({
		getEditMode: () => editMode,
		getCompactActive: () => compactActive,
		getLanes: () => lanes,
		getPreferences: () => preferences,
		minuteFromPointer,
		updateFestival,
		openNew: itemEditor.openNew,
		openRelated,
		notify: flash,
		reorderLanes: reorderSelectedDayLanes
	});
	const addLaneId = $derived(gridInteraction.addLaneId);
	const creating = $derived(gridInteraction.creating);
	const reorderingLaneId = $derived(gridInteraction.reorderingLaneId);
	const reorderTargetLaneId = $derived(gridInteraction.reorderTargetLaneId);
	const bulkEntry = createBulkEntryController({
		getLanes: () => lanes,
		getSelectedDayId: () => selectedDayId,
		getTargetLaneId: () => gridInteraction.addLaneId,
		updateFestival,
		newId,
		notify: flash
	});
	let infoLaneId = $state<string | null>(null);
	const laneEditor = createLaneEditorController({
		getLanes: () => lanes,
		getSelectedDayId: () => selectedDayId,
		isEditingEnabled: () => editMode,
		updateFestival,
		newId,
		notify: flash,
		closeInfo: () => (infoLaneId = null)
	});
	const laneDraft = $derived(laneEditor.draft);
	const laneDraftIsNew = $derived(laneEditor.isNew);
	let relatedModalItemId = $state<string | null>(null);
	let importOpen = $state(false);
	let importText = $state('');
	const selectedSampleId = $derived(session.selectedSampleId);
	const bulkOpen = $derived(bulkEntry.open);
	const bulkRowsText = $derived(bulkEntry.rowsText);
	const bulkStartText = $derived(bulkEntry.startText);
	const bulkLength = $derived(bulkEntry.length);
	const bulkPreview = $derived(bulkEntry.preview);
	let festivalSettingsOpen = $state(false);
	let festivalSettingsDraft = $state<FestivalSettingsDraft | null>(null);
	let toast = $state('');
	let nowMinute = $state(0);
	const undoStack = $derived(session.undoStack);
	const redoStack = $derived(session.redoStack);

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
	const sharedLaneOpeningMinute = $derived(getSharedLaneOpeningMinute(lanes));
	const automaticGridRange = $derived(computeGridRange(items, sharedLaneOpeningMinute));
	const gridRange = $derived({
		startMinute: sharedLaneOpeningMinute ?? day?.displayStartMinute ?? automaticGridRange.startMinute,
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
	const laneColumnTemplate = $derived(
		compactActive
			? `repeat(${compactColumnCount}, var(--lane-width))`
			: visibleLanes
					.map((lane) => `${laneDisplayWidth(lane)}px`)
					.join(' ')
	);
	const gridHeight = $derived(
		Math.max(520, ((gridRange.endMinute - gridRange.startMinute) / 60) * preferences.timeZoom)
	);
	const conflicts = $derived(detectConflicts(items));
	const conflictIds = $derived(
		new Set([...conflicts.sameLane.flat(), ...conflicts.sameArtist.flat()])
	);
	const timeTicks = $derived.by(() => {
		const first = Math.ceil(gridRange.startMinute / 30) * 30;
		return Array.from(
			{ length: Math.max(0, Math.floor((gridRange.endMinute - first) / 30) + 1) },
			(_, index) => first + index * 30
		);
	});
	const infoLane = $derived(lanes.find((lane) => lane.id === infoLaneId));
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
	const timetableSelectors = createTimetableSelectors(() => ({
		items,
		lanes,
		searchNormalized,
		favoriteFilter,
		editDraft,
		artistDirectory: festival.artistDirectory
	}));
	const {
		displayItem,
		itemForLane,
		laneForItem,
		itemBottomLine,
		relatedItemsForLane,
		relatedItemsForBooth,
		shouldExpandRelatedBranch,
		allRelatedItemIds,
		relatedEventItems
	} = timetableSelectors;
	const relatedModalIds = $derived.by(() =>
		relatedModalItemId ? allRelatedItemIds(relatedModalItemId) : []
	);
	const timetablePresentation = createTimetablePresentation(() => ({
		items,
		preferences,
		compactActive,
		minuteToY,
		laneForItem,
		itemBottomLine
	}));
	const {
		itemHasLimitedContent,
		shouldShowItemBottomLine,
		itemStyle,
		copyHandleStyle,
		laneStyle,
		laneDisplayWidth
	} = timetablePresentation;

	function t(key: SchedulerCopyKey): string {
		return schedulerCopy[key][preferences.language];
	}
	function newId(): string {
		return (
			globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
		);
	}
	function normalizeTimeField(
		event: FocusEvent,
		commit: (normalized: string) => void,
		maxHour = 30
	): void {
		const input = event.currentTarget as HTMLInputElement;
		const normalized = normalizeToFiveMinuteTime(input.value, maxHour);
		if (!normalized) {
			flash(
				`時刻はHHMMまたはHH:MM形式（00:00〜${formatMinute(maxHour * 60)}）で入力してください`
			);
			return;
		}
		input.value = normalized;
		commit(normalized);
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
		if (session.saveFestivalSettings(festivalSettingsDraft)) closeFestivalSettings();
	}
	function laneTypeLabel(type: LaneType): string {
		return schedulerCopy[type].ja;
	}
	function minuteToY(minute: number): number {
		return minuteToYAt(minute, gridRange.startMinute, preferences.timeZoom);
	}
	function minuteFromPointer(event: PointerEvent, target: HTMLElement): number {
		return minuteFromPointerAt(
			event,
			target,
			gridRange.startMinute,
			preferences.timeZoom,
			5,
			snapMinutes
		);
	}
	function compactItemsForColumn(column: number): ScheduleItem[] {
		return compactPlacements.filter((entry) => entry.column === column).map((entry) => entry.item);
	}
	function adjustTimeZoom(deltaY: number): void {
		const direction = Math.sign(deltaY);
		if (!direction) return;
		const next = Math.max(144, Math.min(360, preferences.timeZoom - direction * 12));
		if (next === preferences.timeZoom) return;
		preferences.timeZoom = next;
		session.persistPreferences();
	}

	function updateFestival(mutator: (next: Festival) => void): void {
		session.updateFestival(mutator);
	}
	function reorderSelectedDayLanes(sourceId: string, targetId: string): void {
		updateFestival((next) => {
			const selectedDay = next.days.find((candidate) => candidate.id === selectedDayId);
			if (!selectedDay) return;
			const reordered = reorderLanes(selectedDay.lanes, sourceId, targetId);
			if (reordered !== selectedDay.lanes) selectedDay.lanes = reordered;
		});
	}
	function undo(): void {
		session.undo();
	}
	function redo(): void {
		session.redo();
	}
	function flash(message: string): void {
		toast = message;
		window.setTimeout(() => {
			if (toast === message) toast = '';
		}, 2600);
	}
	function selectDay(id: string): void {
		session.selectDay(id);
	}
	function isToday(): boolean {
		if (!day) return false;
		return (
			new Intl.DateTimeFormat('en-CA', { timeZone: festival.timezone }).format(new Date()) ===
			day.date
		);
	}
	function setFavoriteFilter(level: FavoriteFilter): void {
		favoriteFilter = level;
	}
	function toggleEditMode(): void {
		editMode = !editMode;
		if (!editMode) laneEditor.close();
	}
	function cycleItem(itemId: string): void {
		const current = items.find((item) => item.id === itemId);
		if (editMode && current) {
			itemEditor.open(current);
			return;
		}
		updateFestival((next) => {
			const target = next.days
				.flatMap((candidate) => candidate.items)
				.find((item) => item.id === itemId);
			if (target) target.favoriteLevel = cycleFavorite(target.favoriteLevel);
		});
	}
	function openRelated(item: ScheduleItem): void {
		relatedModalItemId = item.id;
	}

	function newFestival(): void {
		session.newFestival();
		favoriteFilter = 0;
	}
	function copyTemplate(templateId: string): void {
		session.copyTemplate(templateId);
	}
	async function removeFestival(): Promise<void> {
		if (!window.confirm('このローカル timetable を削除しますか？')) return;
		await session.removeFestival();
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
		if (!session.importFestival(text)) return;
		importOpen = false;
		importText = '';
	}
	async function handleFileInput(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) importFestival(await file.text());
		input.value = '';
	}

	onMount(() => {
		let timer: number | undefined;
		void (async () => {
			await session.load();
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
		<AppHeader
			bundledFestivals={BUNDLED_FESTIVALS}
			{selectedSampleId}
			timetableLabel={t('timetable')}
			savedLabel={t('saved')}
			themeLabel={t('theme')}
			lightThemeLabel={t('lightTheme')}
			openSampleLabel={t('openSample')}
			{preferences}
			onToggleTheme={session.toggleTheme}
			onToggleLanguage={session.toggleLanguage}
			onSelectSample={copyTemplate}
		/>
		<main class="app-main">
			<FestivalControls
				title={festival.title}
				timezone={festival.timezone}
				days={festival.days}
				{selectedDayId}
				newFestivalLabel={t('newFestival')}
				addDayLabel={t('addDay')}
				formatDay={(festivalDay) =>
					new Intl.DateTimeFormat(preferences.language === 'ja' ? 'ja-JP' : 'en-US', {
						month: 'short',
						day: 'numeric',
						weekday: 'short',
						timeZone: festival.timezone
					}).format(new Date(`${festivalDay.date}T12:00:00`))}
				onNewFestival={newFestival}
				onRemoveFestival={removeFestival}
				onSelectDay={selectDay}
				onAddDay={session.addDay}
			/>
			<TimetableToolbar
				bind:favoriteFilter bind:searchQuery bind:settingsOpen bind:importOpen
				{preferences} {t} savePreferences={session.persistPreferences} {setFavoriteFilter} {adjustTimeZoom} {downloadExport} {shareExport}
			/>
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
			<TimetableGrid
				{day} {favoriteFilter} {favoriteItems} {items} {compactActive} {visibleColumns} {laneColumnTemplate} {gridHeight} {preferences} {gridRange} {visibleLanes} {t} {timeTicks} {minuteToY} {isToday} {nowMinute} handlePointerMove={gridInteraction.handlePointerMove} handlePointerUp={gridInteraction.handlePointerUp} {compactColumnCount} {addLaneId} beginCreate={gridInteraction.beginCreate} beginLaneReorder={gridInteraction.beginLaneReorder} setLaneReorderTarget={gridInteraction.setLaneReorderTarget} finishLaneReorder={gridInteraction.finishLaneReorder} moveLaneBy={gridInteraction.moveLaneBy} {reorderingLaneId} {reorderTargetLaneId} {compactItemsForColumn} {displayItem} {conflictIds} {itemStyle} {copyHandleStyle} {itemHasLimitedContent} {itemBottomLine} {shouldShowItemBottomLine} {editMode} onToggleEdit={toggleEditMode} {openFestivalSettings} undoCount={undoStack.length} redoCount={redoStack.length} {undo} {redo} startAdd={itemEditor.openNew} addLane={laneEditor.add} {formatMinute} {cycleItem} {openRelated} beginItemPointer={gridInteraction.beginItemPointer} openEditor={itemEditor.open} duplicateItem={itemEditor.duplicate} {creating} {compactPreview} {itemForLane} {laneStyle} {laneDisplayWidth}
				onOpenLaneEditor={laneEditor.open}
				onOpenLaneInfo={(lane) => (infoLaneId = lane.id)}
			/>
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
	<FestivalSettingsModal
		bind:draft={festivalSettingsDraft}
		closeLabel={t('close')}
		cancelLabel={t('cancel')}
		applyLabel={t('apply')}
		onClose={closeFestivalSettings}
		onApply={saveFestivalSettings}
		onNormalizeTime={normalizeTimeField}
	/>
{/if}

{#if editingItemId && editDraft}
	<ItemEditorModal
		draft={editDraft}
		isNew={editingItemIsNew}
		{lanes}
		{relatedLaneId}
		{relatedDelay}
		{customRelatedDelay}
		{repeatEnabled}
		{repeatCount}
		{repeatRestMinutes}
		{repeatItemsBeforeRest}
		{repeatNamesText}
		{maximumRepeatCount}
		{repeatPreview}
		{destinationLocked}
		{copyAcrossBooths}
		{boothOffsets}
		{boothRepeatNames}
		{multiBoothPreview}
		closeLabel={t('close')}
		cancelLabel={t('cancel')}
		applyLabel={t('apply')}
		deleteLabel={t('delete')}
		relatedLabel={t('related')}
		{laneTypeLabel}
		{formatMinute}
		normalizeTime={normalizeTimeField}
		{relatedItemsForLane}
		{relatedItemsForBooth}
		{shouldExpandRelatedBranch}
		onRelatedLaneChange={itemEditor.setRelatedLaneId}
		onRelatedDelayChange={itemEditor.setRelatedDelay}
		onCustomRelatedDelayChange={itemEditor.setCustomRelatedDelay}
		onRepeatEnabledChange={itemEditor.setRepeatEnabled}
		onRepeatCountChange={itemEditor.setRepeatCount}
		onRepeatRestMinutesChange={itemEditor.setRepeatRestMinutes}
		onRepeatItemsBeforeRestChange={itemEditor.setRepeatItemsBeforeRest}
		onRepeatNamesTextChange={itemEditor.setRepeatNamesText}
		onDestinationLaneChange={itemEditor.setDestinationLaneId}
		onCopyAcrossBoothsChange={itemEditor.setCopyAcrossBooths}
		onBoothRepeatNamesChange={itemEditor.setBoothRepeatNames}
		onBoothOffsetsChange={itemEditor.setBoothOffsets}
		onRemoveBoothOffset={itemEditor.removeBoothOffset}
		onTogglePair={itemEditor.togglePair}
		onClose={itemEditor.close}
		onDelete={() => {
			if (window.confirm('この項目を削除しますか？')) itemEditor.remove();
		}}
		onSave={itemEditor.save}
	/>
{/if}
{#if laneDraft}
	<LaneEditorModal
		draft={laneDraft}
		isNew={laneDraftIsNew}
		relatedItems={relatedEventItems(laneDraft)}
		closeLabel={t('close')}
		cancelLabel={t('cancel')}
		applyLabel={t('apply')}
		editLaneLabel={t('editLane')}
		relatedLabel={t('related')}
		{laneTypeLabel}
		{formatMinute}
		laneName={(item) => laneForItem(item)?.name ?? ''}
		onNormalizeOpening={(event) => {
			const input = event.currentTarget as HTMLInputElement;
			if (!input.value.trim()) laneEditor.updateOpening('');
			else normalizeTimeField(event, laneEditor.updateOpening);
		}}
		onClose={laneEditor.close}
		onSave={laneEditor.save}
	/>
{/if}
{#if infoLane}
	<LaneInfoModal
		lane={infoLane}
		relatedItems={relatedEventItems(infoLane)}
		closeLabel={t('close')}
		venueLabel={t('venue')}
		openingLabel={t('opening')}
		relatedLabel={t('related')}
		{laneTypeLabel}
		{formatMinute}
		laneName={(item) => laneForItem(item)?.name ?? ''}
		onClose={() => (infoLaneId = null)}
		onOpenRelated={(itemId) => {
			relatedModalItemId = itemId;
			infoLaneId = null;
		}}
	/>
{/if}

{#if relatedModalItemId}
	<RelatedItemsModal
		itemIds={relatedModalIds}
		{items}
		{lanes}
		closeLabel={t('close')}
		{formatMinute}
		onClose={() => (relatedModalItemId = null)}
		onCycleFavorite={cycleItem}
	/>
{/if}

{#if importOpen}
	<ImportModal
		bind:text={importText}
		closeLabel={t('close')}
		cancelLabel={t('cancel')}
		importLabel={t('import')}
		onClose={() => (importOpen = false)}
		onImport={() => importFestival(importText)}
		onFileInput={handleFileInput}
	/>
{/if}

{#if bulkOpen}
	<BulkEntryModal
		laneName={lanes.find((lane) => lane.id === addLaneId)?.name ?? ''}
		rowsText={bulkRowsText}
		startText={bulkStartText}
		length={bulkLength}
		preview={bulkPreview}
		closeLabel={t('close')}
		cancelLabel={t('cancel')}
		createLabel={t('create')}
		previewLabel={t('preview')}
		{formatMinute}
		normalizeTime={normalizeTimeField}
		onRowsTextChange={bulkEntry.setRowsText}
		onStartTextChange={bulkEntry.setStartText}
		onLengthChange={bulkEntry.setLength}
		onPreviewChange={bulkEntry.setPreview}
		onClose={bulkEntry.close}
		onPreview={bulkEntry.generatePreview}
		onCommit={bulkEntry.commit}
	/>
{/if}
