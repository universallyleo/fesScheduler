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
		onInfo,
		reordering,
		reorderTarget,
		reorderDestination,
		onReorderStart,
		onReorderTarget,
		onReorderEnd,
		onResizeStart,
		onResizeMove,
		onResizeEnd,
		onMoveBy
	}: {
		lane: Lane;
		style: string;
		editing: boolean;
		editLabel: string;
		infoLabel: string;
		formatMinute: (minute: number) => string;
		onEdit: () => void;
		onInfo: () => void;
		reordering: boolean;
		reorderTarget: boolean;
		reorderDestination: string | null;
		onReorderStart: (event: PointerEvent) => void;
		onReorderTarget: () => void;
		onReorderEnd: () => void;
		onResizeStart: (event: PointerEvent) => void;
		onResizeMove: (event: PointerEvent) => void;
		onResizeEnd: () => void;
		onMoveBy: (direction: -1 | 1) => void;
	} = $props();

	function handleKeydown(event: KeyboardEvent): void {
		if (!editing || !event.altKey) return;
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		onMoveBy(event.key === 'ArrowLeft' ? -1 : 1);
	}
</script>

<div
	class:lane-reorder-source={reordering}
	class:lane-reorder-target={reorderTarget}
	class="lane-header"
	{style}
	role="toolbar"
	aria-label={`${lane.name}のレーン操作`}
	tabindex={editing ? 0 : undefined}
	onpointerenter={onReorderTarget}
	onpointerup={onReorderEnd}
	onkeydown={handleKeydown}
>
	{#if editing}
		<button
			class="lane-move-grip"
			aria-label={`レーンを移動: ${lane.name}`}
			title="レーンを移動"
			onpointerdown={onReorderStart}>⠿</button>
	{/if}
	<strong>{lane.name}</strong>
	{#if lane.booths?.length}<small>{lane.booths.join(' · ')}</small>{/if}
	{#if editing}
		<button class="lane-edit-button" aria-label={`${editLabel} ${lane.name}`} onclick={onEdit}>✎</button>
	{/if}
	<button class="lane-info-button" aria-label={`${lane.name} ${infoLabel}`} onclick={onInfo}>ⓘ</button>
	{#if lane.openingMinute !== undefined}<small>OPEN {formatMinute(lane.openingMinute)}</small>{/if}
	{#if reorderTarget && reorderDestination}<span class="lane-reorder-destination">{reorderDestination}</span>{/if}
	{#if editing}
		<button
			class="lane-resize-handle"
			aria-label={`レーン幅を変更: ${lane.name}`}
			title="レーン幅を変更"
			onpointerdown={onResizeStart}
			onpointermove={onResizeMove}
			onpointerup={onResizeEnd}
			onpointercancel={onResizeEnd}
		></button>
	{/if}
</div>
