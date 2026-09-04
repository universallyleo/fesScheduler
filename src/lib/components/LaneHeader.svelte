<script lang="ts">
	import type { Lane } from '$lib/types';

	let {
		lane,
		style,
		editing,
		editLabel,
		infoLabel,
		formatMinute,
		onEdit,
		onInfo
	}: {
		lane: Lane;
		style: string;
		editing: boolean;
		editLabel: string;
		infoLabel: string;
		formatMinute: (minute: number) => string;
		onEdit: () => void;
		onInfo: () => void;
	} = $props();
</script>

<div class="lane-header" {style}>
	<strong>{lane.name}</strong>
	{#if lane.booths?.length}<small>{lane.booths.join(' · ')}</small>{/if}
	{#if editing}
		<button class="lane-edit-button" aria-label={`${editLabel} ${lane.name}`} onclick={onEdit}>✎</button>
	{/if}
	<button class="lane-info-button" aria-label={`${lane.name} ${infoLabel}`} onclick={onInfo}>ⓘ</button>
	{#if lane.openingMinute !== undefined}<small>OPEN {formatMinute(lane.openingMinute)}</small>{/if}
</div>
