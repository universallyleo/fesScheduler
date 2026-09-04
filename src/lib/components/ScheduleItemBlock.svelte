<script lang="ts">
	import type { ScheduleItem } from '$lib/types';

	let {
		item,
		style,
		copyStyle,
		visible,
		conflict,
		partialColor,
		compactContent,
		editing,
		formatMinute,
		bottomLine,
		showBottomLine,
		editLabel,
		duplicateLabel,
		onCycleFavorite,
		onOpenRelated,
		onPointer,
		onEdit,
		onDuplicate
	}: {
		item: ScheduleItem;
		style: string;
		copyStyle: string;
		visible: boolean;
		conflict: boolean;
		partialColor: boolean;
		compactContent: boolean;
		editing: boolean;
		formatMinute: (minute: number) => string;
		bottomLine: string;
		showBottomLine: boolean;
		editLabel: string;
		duplicateLabel: string;
		onCycleFavorite: () => void;
		onOpenRelated: () => void;
		onPointer: (event: PointerEvent, kind: 'move' | 'resize') => void;
		onEdit: () => void;
		onDuplicate: () => void;
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
	onclick={onCycleFavorite}
	oncontextmenu={(event) => {
		event.preventDefault();
		onOpenRelated();
	}}
	onpointerdown={(event) => onPointer(event, 'move')}
	ondblclick={onEdit}
>
	<span class="item-time">{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span>
	{#if item.favoriteLevel > 0}<span class="item-favorite"><span class="favorite-heart">♥</span><span class="favorite-level">{item.favoriteLevel}</span></span>{/if}
	<strong>{item.artistLabel}</strong>
	{#if item.subContent && !compactContent}<small>{item.subContent}</small>{/if}
	{#if showBottomLine}<em>{bottomLine}</em>{/if}
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
{#if editing}
	<button
		class="item-edit-button"
		style={copyStyle}
		aria-label={`${item.artistLabel}を${editLabel}`}
		onpointerdown={(event) => event.stopPropagation()}
		onclick={(event) => {
			event.stopPropagation();
			onEdit();
		}}
	>✎</button>
	<button
		class="copy-item-button"
		style={copyStyle}
		aria-label={`${item.artistLabel}を${duplicateLabel}`}
		onpointerdown={(event) => event.stopPropagation()}
		onclick={(event) => {
			event.stopPropagation();
			onDuplicate();
		}}
	>⧉</button>
{/if}
