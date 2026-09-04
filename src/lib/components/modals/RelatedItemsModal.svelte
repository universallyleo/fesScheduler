<script lang="ts">
	import type { Lane, ScheduleItem } from '$lib/types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

	let {
		itemIds,
		items,
		lanes,
		closeLabel,
		formatMinute,
		onClose,
		onCycleFavorite
	}: {
		itemIds: string[];
		items: ScheduleItem[];
		lanes: Lane[];
		closeLabel: string;
		formatMinute: (minute: number) => string;
		onClose: () => void;
		onCycleFavorite: (itemId: string) => void;
	} = $props();

	function laneName(item: ScheduleItem): string {
		return lanes.find((lane) => lane.id === item.laneId)?.name ?? '';
	}
</script>

<ModalShell className="related-modal" labelledBy="related-title" {onClose}>
	<ModalHeader
		eyebrow="FAVORITE QUICK EDIT"
		title="関連する項目"
		titleId="related-title"
		closeLabel={closeLabel}
		{onClose}
	/>
	<p class="modal-note">項目をタップするとお気に入りレベルが切り替わります。</p>
	<div class="related-list">
		{#each itemIds as itemId (itemId)}
			{@const item = items.find((candidate) => candidate.id === itemId)}
			{#if item}
				<button class="related-row favorite-row" onclick={() => onCycleFavorite(item.id)}>
					<span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
					<strong>{item.artistLabel}</strong>
					<span class="heart-level">{item.favoriteLevel ? `♥${item.favoriteLevel}` : '♡'}</span>
					<small>{laneName(item)}</small>
				</button>
			{/if}
		{/each}
	</div>
</ModalShell>
