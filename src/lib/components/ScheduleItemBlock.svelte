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
		selected,
		formatMinute,
		bottomLine,
		showBottomLine,
		booths,
		onCycleFavorite,
		onOpenRelated,
		onPointer,
		onEdit,
		onDelete,
		onBoothChange
	}: {
		item: ScheduleItem;
		style: string;
		visible: boolean;
		conflict: boolean;
		partialColor: boolean;
		compactContent: boolean;
		editing: boolean;
		selected: boolean;
		formatMinute: (minute: number) => string;
		bottomLine: string;
		showBottomLine: boolean;
		booths: string[];
		onCycleFavorite: () => void;
		onOpenRelated: () => void;
		onPointer: (event: PointerEvent, kind: 'move' | 'resize') => void;
		onEdit: () => void;
		onDelete: () => void;
		onBoothChange: (boothId: string) => void;
	} = $props();
</script>

<div
	role="button"
	tabindex="0"
	class:dimmed={!visible}
	class:conflict
	class:partial-color={partialColor}
	class:compact-content={compactContent}
	class:editing
	class:selected
	class="schedule-block"
	{style}
	title={compactContent && item.subContent ? item.subContent : undefined}
	aria-label={`${item.artistLabel} ${formatMinute(item.startMinute)}–${formatMinute(item.endMinute)}`}
	onclick={() => (editing ? onEdit() : onCycleFavorite())}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			editing ? onEdit() : onCycleFavorite();
		}
	}}
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
		{#if showBottomLine && !(editing && booths.length > 1)}<em>{bottomLine}</em>{/if}
	</footer>
	{#if editing}
		<button class="item-delete-button" aria-label={`${item.artistLabel}を削除`} title="項目を削除" onclick={(event) => { event.stopPropagation(); onDelete(); }} onpointerdown={(event) => event.stopPropagation()}>×</button>
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
</div>
