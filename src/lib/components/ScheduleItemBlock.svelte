<script lang="ts">
	import type { ScheduleItem } from '$lib/types';

	let {
		item,
		displayStartMinute = item.startMinute,
		displayEndMinute = item.endMinute,
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
		tightMultiBooth,
		onCycleFavorite,
		onOpenRelated,
		onPointer,
		onEdit,
		onDelete,
		onBoothChange
	}: {
		item: ScheduleItem;
		displayStartMinute?: number;
		displayEndMinute?: number;
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
		tightMultiBooth: boolean;
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
	class:multi-booth-dense={item.itemType === 'tokuten' && booths.length > 2}
	class:multi-booth-tight={tightMultiBooth}
	class:editing
	class:selected
	class="schedule-block"
	{style}
	title={compactContent && item.subContent ? item.subContent : undefined}
	aria-label={`${item.artistLabel} ${formatMinute(displayStartMinute)}–${formatMinute(displayEndMinute)}`}
	onclick={() => (editing ? onEdit() : onOpenRelated())}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			editing ? onEdit() : onOpenRelated();
		}
	}}
	oncontextmenu={(event) => {
		event.preventDefault();
		onOpenRelated();
	}}
	onpointerdown={(event) => onPointer(event, 'move')}
	ondblclick={onEdit}
>
	<span class="item-time">{formatMinute(displayStartMinute)}</span>
	<button
		class="item-favorite-toggle"
		class:active={item.favoriteLevel > 0}
		aria-label="お気に入りレベルを変更"
		aria-pressed={item.favoriteLevel > 0}
		onclick={(event) => {
			event.stopPropagation();
			onCycleFavorite();
		}}
		onpointerdown={(event) => event.stopPropagation()}
		ondblclick={(event) => {
			event.preventDefault();
			event.stopPropagation();
		}}
	><span aria-hidden="true">{item.favoriteLevel > 0 ? `${item.favoriteLevel}♥` : '♡'}</span></button>
	<strong class="item-main-content">{item.artistLabel}</strong>
	{#if item.subContent && !compactContent}<small>{item.subContent}</small>{/if}
	<footer class="item-footer">
		<span class="item-time item-end-time">{formatMinute(displayEndMinute)}</span>
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
