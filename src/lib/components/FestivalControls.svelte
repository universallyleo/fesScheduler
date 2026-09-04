<script lang="ts">
	import type { FestivalDay } from '$lib/types';

	let {
		title,
		timezone,
		days,
		selectedDayId,
		newFestivalLabel,
		addDayLabel,
		formatDay,
		onNewFestival,
		onRemoveFestival,
		onSelectDay,
		onAddDay
	}: {
		title: string;
		timezone: string;
		days: FestivalDay[];
		selectedDayId: string;
		newFestivalLabel: string;
		addDayLabel: string;
		formatDay: (day: FestivalDay) => string;
		onNewFestival: () => void;
		onRemoveFestival: () => void;
		onSelectDay: (id: string) => void;
		onAddDay: () => void;
	} = $props();
</script>

<section class="festival-strip">
	<div><p class="eyebrow">LOCAL TIMETABLE · {timezone}</p><h2>{title}</h2></div>
	<div class="festival-actions">
		<button class="quiet-button" onclick={onNewFestival}>＋ {newFestivalLabel}</button>
		<button class="quiet-button danger-text" onclick={onRemoveFestival}>削除</button>
	</div>
</section>
<nav class="day-tabs" aria-label="Festival days">
	{#each days as day (day.id)}
		<button class:active={day.id === selectedDayId} onclick={() => onSelectDay(day.id)}><span>{formatDay(day)}</span></button>
	{/each}
	<button class="add-day" onclick={onAddDay}>＋ {addDayLabel}</button>
</nav>
