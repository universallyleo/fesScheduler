<script lang="ts">
	import type { Lane, ScheduleItem } from '$lib/types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

	let {
		lane,
		relatedItems,
		closeLabel,
		venueLabel,
		openingLabel,
		relatedLabel,
		laneTypeLabel,
		laneName,
		formatMinute,
		onClose,
		onOpenRelated
	}: {
		lane: Lane;
		relatedItems: ScheduleItem[];
		closeLabel: string;
		venueLabel: string;
		openingLabel: string;
		relatedLabel: string;
		laneTypeLabel: (type: Lane['type']) => string;
		laneName: (item: ScheduleItem) => string;
		formatMinute: (minute: number) => string;
		onClose: () => void;
		onOpenRelated: (itemId: string) => void;
	} = $props();
</script>

<ModalShell className="info-modal" labelledBy="lane-info-title" {onClose}>
	<ModalHeader
		eyebrow={`レーン情報 · ${laneTypeLabel(lane.type)}`}
		title={lane.name}
		titleId="lane-info-title"
		closeLabel={closeLabel}
		{onClose}
	/>
	<div class="lane-info-grid">
		<div><span>{venueLabel}</span><strong>{lane.venueName || '—'}</strong></div>
		<div><span>{openingLabel}</span><strong>{lane.openingMinute === undefined ? '—' : formatMinute(lane.openingMinute)}</strong></div>
		{#if lane.venueUrl}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={lane.venueUrl} target="_blank" rel="noreferrer">会場を開く ↗</a>
		{/if}
	</div>
	<div class="related-section">
		<h3>{relatedLabel}</h3>
		{#if relatedItems.length}
			{#each relatedItems as item (item.id)}
				<button class="related-row" onclick={() => onOpenRelated(item.id)}>
					<span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
					<strong>{item.artistLabel}</strong><small>{laneName(item)}</small>
				</button>
			{/each}
		{:else}
			<p class="empty-copy">関連するイベントはありません。</p>
		{/if}
	</div>
	<div class="modal-actions"><span></span><button class="primary-button" onclick={onClose}>{closeLabel}</button></div>
</ModalShell>
