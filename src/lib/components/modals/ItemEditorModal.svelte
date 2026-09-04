<script lang="ts">
	import type { Lane, LaneType, ScheduleItem } from '$lib/types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

	let {
		draft = $bindable<ScheduleItem>(),
		isNew,
		lanes,
		relatedLaneId,
		relatedDelay,
		customRelatedDelay,
		closeLabel,
		cancelLabel,
		applyLabel,
		deleteLabel,
		relatedLabel,
		laneTypeLabel,
		formatMinute,
		normalizeTime,
		relatedItemsForLane,
		relatedItemsForBooth,
		shouldExpandRelatedBranch,
		onRelatedLaneChange,
		onRelatedDelayChange,
		onCustomRelatedDelayChange,
		onTogglePair,
		onClose,
		onDelete,
		onSave
	}: {
		draft?: ScheduleItem;
		isNew: boolean;
		lanes: Lane[];
		relatedLaneId: string;
		relatedDelay: string;
		customRelatedDelay: number;
		closeLabel: string;
		cancelLabel: string;
		applyLabel: string;
		deleteLabel: string;
		relatedLabel: string;
		laneTypeLabel: (type: LaneType) => string;
		formatMinute: (minute: number) => string;
		normalizeTime: (event: FocusEvent, commit: (value: string) => void) => void;
		relatedItemsForLane: (lane: Lane) => ScheduleItem[];
		relatedItemsForBooth: (lane: Lane, booth: string) => ScheduleItem[];
		shouldExpandRelatedBranch: (items: ScheduleItem[]) => boolean;
		onRelatedLaneChange: (value: string) => void;
		onRelatedDelayChange: (value: string) => void;
		onCustomRelatedDelayChange: (value: number) => void;
		onTogglePair: (id: string) => void;
		onClose: () => void;
		onDelete: () => void;
		onSave: () => void;
	} = $props();

	const laneTypes: LaneType[] = ['stage', 'tokuten', 'event'];
	const delays = [0, 5, 10, 15, 20];
	const customDelays = Array.from({ length: 32 }, (_, index) => (index + 5) * 5);
	function currentLane(): Lane | undefined { return lanes.find((lane) => lane.id === draft.laneId); }
</script>

<ModalShell className="editor-modal" labelledBy="edit-title" {onClose}>
	<ModalHeader eyebrow={isNew ? '新規項目' : '項目を編集'} title={draft.artistLabel || '新しい項目'} titleId="edit-title" closeLabel={closeLabel} {onClose} />
	<div class="form-grid">
		<label>アーティスト<input bind:value={draft.artistLabel} /></label><label>サブコンテンツ<input bind:value={draft.subContent} /></label>
		{#if currentLane()?.booths?.length}<label>ブース<select bind:value={draft.boothId}>{#each currentLane()?.booths ?? [] as booth (booth)}<option value={booth}>{booth}</option>{/each}</select></label>{/if}
		<label>開始時刻<input value={formatMinute(draft.startMinute)} onblur={(event) => normalizeTime(event, (value) => (draft.startMinute = Number(value.slice(0, 2)) * 60 + Number(value.slice(3))))} /></label>
		<label>終了時刻<input value={formatMinute(draft.endMinute)} onblur={(event) => normalizeTime(event, (value) => (draft.endMinute = Number(value.slice(0, 2)) * 60 + Number(value.slice(3))))} /></label>
	</div>
	<div class="favorite-editor"><span>お気に入り</span>{#each [0, 1, 2, 3] as level (level)}<button class:active={draft.favoriteLevel === level} onclick={() => (draft.favoriteLevel = level as 0 | 1 | 2 | 3)}>♥{level}</button>{/each}</div>
	<fieldset class="pairing-field related-event-field"><legend>{relatedLabel}</legend>
		{#if isNew}<p class="field-note">保存時に、指定したレーンへ同じ長さの関連イベントを追加します。</p><div class="form-grid related-event-create"><label>追加先レーン<select value={relatedLaneId} onchange={(event) => onRelatedLaneChange((event.currentTarget as HTMLSelectElement).value)}><option value="">追加しない</option>{#each lanes as lane (lane.id)}<option value={lane.id}>{lane.name}（{laneTypeLabel(lane.type)}）</option>{/each}<optgroup label="新しいレーンを追加">{#each laneTypes as type}<option value={`new:${type}`}>＋ 新しい{laneTypeLabel(type)}</option>{/each}</optgroup></select></label><label>開始タイミング<select value={relatedDelay} disabled={!relatedLaneId} onchange={(event) => onRelatedDelayChange((event.currentTarget as HTMLSelectElement).value)}>{#each delays as minutes (minutes)}<option value={minutes}>{minutes === 0 ? '終演後' : `${minutes}分後`}</option>{/each}<option value="custom">カスタム</option></select></label>{#if relatedDelay === 'custom'}<label>カスタム時間<select value={customRelatedDelay} disabled={!relatedLaneId} onchange={(event) => onCustomRelatedDelayChange(Number((event.currentTarget as HTMLSelectElement).value))}>{#each customDelays as minutes (minutes)}<option value={minutes}>{minutes}分後</option>{/each}</select></label>{/if}</div>{/if}
		<details class="existing-event-picker" open><summary>既存のイベントを関連付ける</summary><div class="pairing-list">{#each lanes as lane (lane.id)}{@const laneItems = relatedItemsForLane(lane)}{#if laneItems.length}<details class="related-lane-group" open={shouldExpandRelatedBranch(laneItems)}><summary><span>{lane.name}</span><small>{laneItems.length}件</small></summary><div class="related-lane-items">{#if lane.booths?.length}{#each lane.booths as booth (booth)}{@const boothItems = relatedItemsForBooth(lane, booth)}{#if boothItems.length}<details class="related-booth-group" open={shouldExpandRelatedBranch(boothItems)}><summary>{booth}</summary><div class="related-booth-items">{#each boothItems as item (item.id)}<label><input type="checkbox" checked={draft.pairedTokutenItemIds.includes(item.id)} onchange={() => onTogglePair(item.id)} /><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong></label>{/each}</div></details>{/if}{/each}{:else}{#each laneItems as item (item.id)}<label><input type="checkbox" checked={draft.pairedTokutenItemIds.includes(item.id)} onchange={() => onTogglePair(item.id)} /><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong></label>{/each}{/if}</div></details>{/if}{/each}</div></details>
	</fieldset>
	<div class="modal-actions"><button class="danger-button" onclick={onDelete}>{deleteLabel}</button><span></span><button class="quiet-button" onclick={onClose}>{cancelLabel}</button><button class="primary-button" onclick={onSave}>{applyLabel}</button></div>
</ModalShell>
