<script lang="ts">
	import type { Lane, LaneType, ScheduleItem } from '$lib/types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

	let {
		draft = $bindable<Lane>(), isNew, relatedItems, closeLabel, cancelLabel, applyLabel,
		editLaneLabel, relatedLabel, laneTypeLabel, formatMinute, laneName, onNormalizeOpening, onClose, onSave
	}: {
		draft?: Lane; isNew: boolean; relatedItems: ScheduleItem[]; closeLabel: string; cancelLabel: string; applyLabel: string;
		editLaneLabel: string; relatedLabel: string; laneTypeLabel: (type: LaneType) => string; formatMinute: (minute: number) => string;
		laneName: (item: ScheduleItem) => string; onNormalizeOpening: (event: FocusEvent) => void; onClose: () => void; onSave: () => void;
	} = $props();
	const laneTypes: LaneType[] = ['stage', 'tokuten', 'event'];
</script>

<ModalShell className="lane-editor-modal" labelledBy="lane-editor-title" {onClose}>
	<ModalHeader eyebrow={isNew ? 'ADD LANE' : 'EDIT LANE'} title={draft.name || editLaneLabel} titleId="lane-editor-title" closeLabel={closeLabel} {onClose} />
	<div class="form-grid lane-form-grid">
		<label>レーン名<input bind:value={draft.name} /></label>
		<fieldset class="lane-type-field"><legend>レーン種別</legend><div class="lane-type-options" aria-label="レーン種別">{#each laneTypes as type}<label class="lane-type-option" class:active={draft.type === type}><input type="radio" name="lane-type" value={type} checked={draft.type === type} onchange={() => (draft.type = type)} /><span>{laneTypeLabel(type)}</span></label>{/each}</div></fieldset>
		{#if draft.type === 'tokuten'}<fieldset class="booth-field"><legend>複数ブース</legend><label class="booth-toggle"><input type="checkbox" checked={(draft.booths?.length ?? 0) > 1} onchange={(event) => (draft.booths = (event.currentTarget as HTMLInputElement).checked ? (draft.booths?.length ? draft.booths : ['A', 'B']) : undefined)} />複数ブースを使う</label>{#if draft.booths?.length}<label class="booth-names">ブース名（カンマ区切り）<input value={draft.booths.join(', ')} oninput={(event) => (draft.booths = (event.currentTarget as HTMLInputElement).value.split(',').map((booth) => booth.trim()).filter(Boolean))} /></label>{/if}</fieldset>{/if}
		<label>会場<input bind:value={draft.venueName} /></label><label>開場時刻<input value={draft.openingMinute === undefined ? '' : formatMinute(draft.openingMinute)} placeholder="10:00" onblur={onNormalizeOpening} /></label>
		<label>会場 URL<input type="url" bind:value={draft.venueUrl} /></label><label class="color-field">色<span><input class="lane-color-input" type="color" value={draft.color ?? '#a8adb5'} onchange={(event) => (draft.color = (event.currentTarget as HTMLInputElement).value)} /><code>{draft.color ?? '#a8adb5'}</code></span></label>
	</div>
	{#if !isNew}<div class="related-section"><h3>{relatedLabel}</h3>{#if relatedItems.length}{#each relatedItems as item (item.id)}<div class="related-row related-row-static"><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong><small>{laneName(item)}</small></div>{/each}{:else}<p class="empty-copy">関連するイベントはありません。</p>{/if}</div>{/if}
	<div class="modal-actions"><span></span><button class="quiet-button" onclick={onClose}>{cancelLabel}</button><button class="primary-button" onclick={onSave}>{applyLabel}</button></div>
</ModalShell>
