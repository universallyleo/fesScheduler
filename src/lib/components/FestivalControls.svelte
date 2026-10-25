<script lang="ts">
	import type { FestivalDay } from '$lib/types';
	let { days, selectedDayId, addDayLabel, formatDay, onSelectDay, onAddDay }: { days: FestivalDay[]; selectedDayId: string; addDayLabel: string; formatDay: (day: FestivalDay) => string; onSelectDay: (id: string) => void; onAddDay: () => void; } = $props();
</script>
<nav class="day-tabs" aria-label="Festival days">{#each days as day (day.id)}<button class:active={day.id === selectedDayId} onclick={() => onSelectDay(day.id)}><span>{formatDay(day)}</span></button>{/each}<button class="add-day" onclick={onAddDay}>＋ {addDayLabel}</button></nav>
