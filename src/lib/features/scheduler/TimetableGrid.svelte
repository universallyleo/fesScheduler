<script lang="ts">
	import { onMount } from 'svelte';
	import LaneHeader from '$lib/components/LaneHeader.svelte';
	import ScheduleItemBlock from '$lib/components/ScheduleItemBlock.svelte';
	import type { FestivalDay, Lane, ScheduleItem, UserPreferences } from '$lib/types';
	import type { CreateState, FavoriteFilter } from '$lib/ui-types';
	import type { SchedulerCopyKey } from './scheduler-copy';

	type GridProps = {
		day?: FestivalDay;
		favoriteFilter: FavoriteFilter;
		favoriteItems: ScheduleItem[];
		items: ScheduleItem[];
		compactActive: boolean;
		visibleColumns: number;
		laneColumnTemplate: string;
		gridHeight: number;
		preferences: UserPreferences;
		gridRange: { startMinute: number; endMinute: number };
		visibleLanes: Lane[];
		t: (key: SchedulerCopyKey) => string;
		timeTicks: number[];
		minuteToY: (minute: number) => number;
		isToday: () => boolean;
		nowMinute: number;
		handlePointerMove: (event: PointerEvent) => void;
		handlePointerUp: () => void;
		compactColumnCount: number;
		addLaneId: string;
		beginCreate: (event: PointerEvent, laneId: string) => void;
		compactItemsForColumn: (column: number) => ScheduleItem[];
		displayItem: (item: ScheduleItem) => boolean;
		conflictIds: Set<string>;
		itemStyle: (item: ScheduleItem) => string;
		copyHandleStyle: (item: ScheduleItem) => string;
		itemHasLimitedContent: (item: ScheduleItem) => boolean;
		itemBottomLine: (item: ScheduleItem) => string;
		shouldShowItemBottomLine: (item: ScheduleItem) => boolean;
		editMode: boolean;
		formatMinute: (minute: number) => string;
		cycleItem: (itemId: string) => void;
		openRelated: (item: ScheduleItem) => void;
		beginItemPointer: (event: PointerEvent, item: ScheduleItem, kind: 'move' | 'resize') => void;
		openEditor: (item: ScheduleItem, isNew?: boolean) => void;
		duplicateItem: (item: ScheduleItem) => void;
		creating: CreateState;
		compactPreview: { top: number; height: number; duration: number } | null;
		itemForLane: (laneId: string) => ScheduleItem[];
		laneStyle: (lane: Lane) => string;
		laneDisplayWidth: (lane: Lane) => number;
		onOpenLaneEditor: (lane: Lane) => void;
		onOpenLaneInfo: (lane: Lane) => void;
	};

	let {
		day,
		favoriteFilter,
		favoriteItems,
		items,
		compactActive,
		visibleColumns,
		laneColumnTemplate,
		gridHeight,
		preferences,
		gridRange,
		visibleLanes,
		t,
		timeTicks,
		minuteToY,
		isToday,
		nowMinute,
		handlePointerMove,
		handlePointerUp,
		compactColumnCount,
		addLaneId,
		beginCreate,
		compactItemsForColumn,
		displayItem,
		conflictIds,
		itemStyle,
		copyHandleStyle,
		itemHasLimitedContent,
		itemBottomLine,
		shouldShowItemBottomLine,
		editMode,
		formatMinute,
		cycleItem,
		openRelated,
		beginItemPointer,
		openEditor,
		duplicateItem,
		creating,
		compactPreview,
		itemForLane,
		laneStyle,
		laneDisplayWidth,
		onOpenLaneEditor,
		onOpenLaneInfo,
	}: GridProps = $props();

	let scroller = $state<HTMLDivElement>();
	let horizontalScrollControls = $state({ visible: false, top: 0, left: 0, right: 0 });

	function updateHorizontalScrollControls(): void {
		if (!scroller || typeof window === 'undefined') return;
		const rect = scroller.getBoundingClientRect();
		const displayedTop = Math.max(0, rect.top);
		const displayedBottom = Math.min(window.innerHeight, rect.bottom);
		horizontalScrollControls = {
			visible:
				scroller.scrollWidth > scroller.clientWidth + 1 &&
				rect.bottom > window.innerHeight &&
				displayedBottom - displayedTop > 96,
			top: Math.round((displayedTop + displayedBottom) / 2),
			left: Math.max(8, Math.round(rect.left + 72)),
			right: Math.max(8, Math.round(window.innerWidth - rect.right + 10))
		};
	}

	function scrollTimetableHorizontally(direction: -1 | 1): void {
		if (!scroller) return;
		scroller.scrollBy({ left: direction * Math.max(180, scroller.clientWidth * 0.65), behavior: 'smooth' });
	}

	function jumpToNow(): void {
		if (!scroller || !isToday()) return;
		scroller.scrollTo({
			top: Math.max(0, minuteToY(nowMinute) - scroller.clientHeight / 2),
			behavior: 'smooth'
		});
	}

	$effect(() => {
		gridHeight;
		laneColumnTemplate;
		const frame = window.requestAnimationFrame(updateHorizontalScrollControls);
		return () => window.cancelAnimationFrame(frame);
	});

	onMount(() => {
		const update = () => updateHorizontalScrollControls();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, { passive: true });
		scroller?.addEventListener('scroll', update, { passive: true });
		const observer = new ResizeObserver(update);
		if (scroller) observer.observe(scroller);
		window.requestAnimationFrame(update);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update);
			scroller?.removeEventListener('scroll', update);
			observer.disconnect();
		};
	});
</script>
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
					style={`--grid-columns:${visibleColumns};--lane-columns:${laneColumnTemplate};--grid-height:${gridHeight}px;--hour-height:${preferences.timeZoom}px;--hour-offset:${-((gridRange.startMinute % 60) / 60) * preferences.timeZoom}px;--half-hour-height:${preferences.timeZoom / 2}px;--half-hour-offset:${-((gridRange.startMinute % 30) / 60) * preferences.timeZoom}px;--grid-step-height:${(preferences.timeZoom * preferences.snapMinutes) / 60}px;--grid-step-offset:${-((gridRange.startMinute % preferences.snapMinutes) / 60) * preferences.timeZoom}px;--lane-width:${preferences.laneWidth}px;--header-height:${compactActive ? 0 : 74}px;`}
				>
					<div class="schedule-corner">TIME</div>
					{#if !compactActive}
						{#each visibleLanes as lane (lane.id)}
							<LaneHeader
								{lane}
								style={laneStyle(lane)}
								editing={editMode}
								editLabel={t('edit')}
								infoLabel={t('info')}
								{formatMinute}
								onEdit={() => onOpenLaneEditor(lane)}
								onInfo={() => onOpenLaneInfo(lane)}
							/>
						{/each}
					{/if}
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
					style={`grid-template-columns:var(--lane-columns);min-height:${gridHeight}px;`}
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
										<ScheduleItemBlock
											{item}
											style={itemStyle(item)}
											copyStyle={copyHandleStyle(item)}
											visible={displayItem(item)}
											conflict={conflictIds.has(item.id)}
											partialColor={preferences.blockColorMode === 'partial'}
											compactContent={itemHasLimitedContent(item)}
											editing={editMode}
											{formatMinute}
											bottomLine={itemBottomLine(item)}
											showBottomLine={shouldShowItemBottomLine(item)}
											editLabel={t('edit')}
											duplicateLabel={t('duplicate')}
											onCycleFavorite={() => cycleItem(item.id)}
											onOpenRelated={() => openRelated(item)}
											onPointer={(event, kind) => beginItemPointer(event, item, kind)}
											onEdit={() => openEditor(item)}
											onDuplicate={() => duplicateItem(item)}
										/>
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
											<ScheduleItemBlock
												{item}
												style={itemStyle(item)}
												copyStyle={copyHandleStyle(item)}
												visible={displayItem(item)}
												conflict={conflictIds.has(item.id)}
												partialColor={preferences.blockColorMode === 'partial'}
												compactContent={itemHasLimitedContent(item)}
												editing={editMode}
												{formatMinute}
												bottomLine={itemBottomLine(item)}
												showBottomLine={shouldShowItemBottomLine(item)}
												editLabel={t('edit')}
												duplicateLabel={t('duplicate')}
												onCycleFavorite={() => cycleItem(item.id)}
												onOpenRelated={() => openRelated(item)}
												onPointer={(event, kind) => beginItemPointer(event, item, kind)}
												onEdit={() => openEditor(item)}
												onDuplicate={() => duplicateItem(item)}
											/>
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
			{#if horizontalScrollControls.visible}
				<button
					class="timetable-scroll-control timetable-scroll-left"
					style={`top:${horizontalScrollControls.top}px;left:${horizontalScrollControls.left}px`}
					aria-label="左へスクロール"
					title="左へスクロール"
					onclick={() => scrollTimetableHorizontally(-1)}
				>‹</button>
				<button
					class="timetable-scroll-control timetable-scroll-right"
					style={`top:${horizontalScrollControls.top}px;right:${horizontalScrollControls.right}px`}
					aria-label="右へスクロール"
					title="右へスクロール"
					onclick={() => scrollTimetableHorizontally(1)}
				>›</button>
			{/if}
			{#if isToday()}<button class="now-button" onclick={jumpToNow}>◉ {t('jumpNow')}</button>{/if}
