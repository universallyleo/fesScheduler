<script lang="ts">
	import type { ScheduleItem } from '$lib/types';

	let {
		item,
		style,
		visible,
		conflict,
		partialColor,
		compactContent,
		editing,
		formatMinute,
		bottomLine,
		showBottomLine,
		booths,
		onCycleFavorite,
		onOpenRelated,
		onPointer,
		onEdit,
		onBoothChange
	}: {
		item: ScheduleItem;
		style: string;
		visible: boolean;
		conflict: boolean;
		partialColor: boolean;
		compactContent: boolean;
		editing: boolean;
		formatMinute: (minute: number) => string;
		bottomLine: string;
		showBottomLine: boolean;
		booths: string[];
		onCycleFavorite: () => void;
		onOpenRelated: () => void;
		onPointer: (event: PointerEvent, kind: 'move' | 'resize') => void;
		onEdit: () => void;
		onBoothChange: (boothId: string) => void;
	} = $props();
</script>

<button
	class:dimmed={!visible}
	class:conflict
	class:partial-color={partialColor}
	class:compact-content={compactContent}
	class:editing
	class="schedule-block"
	{style}
	title={compactContent && item.subContent ? item.subContent : undefined}
	aria-label={`${item.artistLabel} ${formatMinute(item.startMinute)}–${formatMinute(item.endMinute)}`}
	onclick={() => (editing ? onEdit() : onCycleFavorite())}
	oncontextmenu={(event) => {
		event.preventDefault();
		onOpenRelated();
	}}
	onpointerdown={(event) => onPointer(event, 'move')}
	ondblclick={onEdit}
>
	<span class="item-time">{formatMinute(item.startMinute)}</span>
	{#if item.favoriteLevel > 0}<span class="item-favorite"><span class="favorite-heart">♥</span><span class="favorite-level">{item.favoriteLevel}</span></span>{/if}
	<strong>{item.artistLabel}</strong>
	{#if item.subContent && !compactContent}<small>{item.subContent}</small>{/if}
	<footer class="item-footer">
		<span class="item-end-time">{formatMinute(item.endMinute)}</span>
		{#if editing && booths.length > 1}
			<select
				class="item-booth-select"
				aria-label={`${item.artistLabel}のブース`}
				value={item.boothId ?? booths[0]}
				onpointerdown={(event) => event.stopPropagation()}
				onchange={(event) => onBoothChange((event.currentTarget as HTMLSelectElement).value)}
			>
				{#each booths as booth (booth)}<option value={booth}>{booth}</option>{/each}
			</select>
		{/if}
		{#if showBottomLine}<em>{bottomLine}</em>{/if}
	</footer>
	{#if editing}
		<span
			class="resize-handle"
			role="separator"
			aria-label="項目の長さを変更"
			onpointerdown={(event) => {
				event.stopPropagation();
				onPointer(event, 'resize');
			}}
		></span>
	{/if}
</button>
