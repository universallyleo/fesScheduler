<script lang="ts">
	import type { Lane, LaneType, ScheduleItem } from '$lib/types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';
	import IntervalDelta from '$lib/components/IntervalDelta.svelte';
	import NumberDelta from '$lib/components/NumberDelta.svelte';
	import type { RepeatPreviewEntry } from '$lib/features/scheduler/repeat-items';
	import type { BoothRepeatPreviewGroup } from '$lib/features/scheduler/multi-booth-repeat';

	let {
		draft = $bindable<ScheduleItem>(),
		isNew,
		lanes,
		relatedLaneId,
		relatedDelay,
		customRelatedDelay,
		repeatEnabled,
		repeatCount,
		repeatRestMinutes,
		repeatItemsBeforeRest,
		repeatNamesText,
		maximumRepeatCount,
		repeatPreview,
		destinationLocked,
		copyAcrossBooths,
		boothOffsets,
		boothRepeatNames,
		multiBoothPreview,
		closeLabel,
		cancelLabel,
		applyLabel,
		deleteLabel,
		duplicateLabel,
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
		onRepeatEnabledChange,
		onRepeatCountChange,
		onRepeatRestMinutesChange,
		onRepeatItemsBeforeRestChange,
		onRepeatNamesTextChange,
		onDestinationLaneChange,
		onCopyAcrossBoothsChange,
		onBoothRepeatNamesChange,
		onBoothOffsetsChange,
		onRemoveBoothOffset,
		onTogglePair,
		onClose,
		onDelete,
		onDuplicate,
		onSave
	}: {
		draft?: ScheduleItem;
		isNew: boolean;
		lanes: Lane[];
		relatedLaneId: string;
		relatedDelay: string;
		customRelatedDelay: number;
		repeatEnabled: boolean;
		repeatCount: number;
		repeatRestMinutes: number;
		repeatItemsBeforeRest: number;
		repeatNamesText: string;
		maximumRepeatCount: number;
		repeatPreview: RepeatPreviewEntry[];
		destinationLocked: boolean;
		copyAcrossBooths: boolean;
		boothOffsets: number[];
		boothRepeatNames: Record<string, string>;
		multiBoothPreview: BoothRepeatPreviewGroup[];
		closeLabel: string;
		cancelLabel: string;
		applyLabel: string;
		deleteLabel: string;
		duplicateLabel: string;
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
		onRepeatEnabledChange: (value: boolean) => void;
		onRepeatCountChange: (value: number) => void;
		onRepeatRestMinutesChange: (value: number) => void;
		onRepeatItemsBeforeRestChange: (value: number) => void;
		onRepeatNamesTextChange: (value: string) => void;
		onDestinationLaneChange: (value: string) => void;
		onCopyAcrossBoothsChange: (value: boolean) => void;
		onBoothRepeatNamesChange: (boothId: string, value: string) => void;
		onBoothOffsetsChange: (value: number[]) => void;
		onRemoveBoothOffset: (index: number) => void;
		onTogglePair: (id: string) => void;
		onClose: () => void;
		onDelete: () => void;
		onDuplicate: () => void;
		onSave: () => void;
	} = $props();

	const laneTypes: LaneType[] = ['stage', 'tokuten', 'event'];
	const delays = [0, 5, 10, 15, 20];
	const customDelays = Array.from({ length: 32 }, (_, index) => (index + 5) * 5);
	let relatedOpen = $state(false);
	function currentLane(): Lane | undefined { return lanes.find((lane) => lane.id === draft.laneId); }
	function minuteFromText(value: string): number { return Number(value.slice(0, 2)) * 60 + Number(value.slice(3)); }
	function itemDuration(): number { return Math.max(0, draft.endMinute - draft.startMinute); }
	function itemTypeLabel(type: LaneType): string { return type === 'event' ? 'イベント・インフォ' : laneTypeLabel(type); }
	const hasMultipleBooths = $derived((currentLane()?.booths?.length ?? 0) > 1);
	function selectItemType(type: LaneType): void {
		draft.itemType = type;
		draft.color = type === currentLane()?.type ? undefined : type === 'tokuten' ? '#d7d9d6' : currentLane()?.color;
	}
	function handleDeleteKey(event: KeyboardEvent): void {
		if (event.key !== 'Delete') return;
		const target = event.target;
		if (target instanceof Element && target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]')) return;
		event.preventDefault();
		onDelete();
	}
</script>

<svelte:window onkeydown={handleDeleteKey} />
<ModalShell className="editor-modal" labelledBy="edit-title" {onClose}>
	<ModalHeader eyebrow={isNew ? '新規項目' : '項目を編集'} title={draft.artistLabel || '新しい項目'} titleId="edit-title" closeLabel={closeLabel} {onClose} />
	<div class="form-grid">
		{#if isNew}<div class="item-destination-row" class:destination-only={!hasMultipleBooths}><label class="item-destination-field">追加先レーン<select value={draft.laneId} disabled={destinationLocked} onchange={(event) => onDestinationLaneChange((event.currentTarget as HTMLSelectElement).value)}><option value="">選択してください</option>{#each lanes as lane (lane.id)}<option value={lane.id}>{lane.name}（{laneTypeLabel(lane.type)}）</option>{/each}</select>{#if destinationLocked}<span class="field-hint">ドラッグしたレーンへ追加します</span>{/if}</label>{#if hasMultipleBooths}<label class="item-booth-field">ブース<select bind:value={draft.boothId}>{#each currentLane()?.booths ?? [] as booth (booth)}<option value={booth}>{booth}</option>{/each}</select></label>{/if}</div>{/if}
		<label>アーティスト<input bind:value={draft.artistLabel} /></label>{#if !isNew && hasMultipleBooths}<label class="item-booth-field">ブース<select bind:value={draft.boothId}>{#each currentLane()?.booths ?? [] as booth (booth)}<option value={booth}>{booth}</option>{/each}</select></label>{/if}<label class:wide-field={!isNew && hasMultipleBooths}>サブコンテンツ<input bind:value={draft.subContent} /></label>
		<label>開始時刻<span class="time-input-row"><input value={formatMinute(draft.startMinute)} onblur={(event) => normalizeTime(event, (value) => (draft.startMinute = minuteFromText(value)))} /><IntervalDelta value={draft.startMinute} onChange={(value) => (draft.startMinute = value)} /></span></label>
		<label><span>終了時刻 <span class="item-duration">（+ {itemDuration()}分）</span></span><span class="time-input-row"><input value={formatMinute(draft.endMinute)} onblur={(event) => normalizeTime(event, (value) => (draft.endMinute = minuteFromText(value)))} /><IntervalDelta value={draft.endMinute} onChange={(value) => (draft.endMinute = value)} /></span></label>
	</div>
	{#if isNew}<fieldset class="item-type-field"><legend>項目種別</legend><div class="lane-type-options" aria-label="項目種別">{#each laneTypes as type}<label class="lane-type-option" class:active={draft.itemType === type}><input type="radio" name="item-type" value={type} checked={draft.itemType === type} onchange={() => selectItemType(type)} /><span>{itemTypeLabel(type)}</span></label>{/each}</div>{#if draft.itemType !== currentLane()?.type}<label class="item-color-field">項目の色<span><input type="color" value={draft.color ?? '#a8adb5'} onchange={(event) => (draft.color = (event.currentTarget as HTMLInputElement).value)} /><code>{draft.color ?? '#a8adb5'}</code></span></label>{/if}</fieldset>{/if}
	{#if isNew}
		<details class="repeat-entry" open={repeatEnabled} ontoggle={(event) => onRepeatEnabledChange((event.currentTarget as HTMLDetailsElement).open)}>
			<summary><span>繰り返し追加</span><small>{repeatEnabled ? 'オン' : 'オフ'}</small></summary>
			<div class="repeat-entry-content">
				{#if !copyAcrossBooths}<label class="repeat-names">項目名<span class="field-hint">/ または ／ で区切って入力</span><input value={repeatNamesText} placeholder="グループA / グループB" oninput={(event) => onRepeatNamesTextChange((event.currentTarget as HTMLInputElement).value)} /></label>{/if}
				<div class="repeat-controls-row"><label>追加数<NumberDelta value={repeatCount} max={maximumRepeatCount} suffix="件" label="追加数" onChange={onRepeatCountChange} /></label><label>休憩を入れる間隔<NumberDelta value={repeatItemsBeforeRest} max={maximumRepeatCount} suffix="件ごと" label="休憩を入れる間隔" onChange={onRepeatItemsBeforeRestChange} /></label><label>休憩時間<NumberDelta value={repeatRestMinutes} min={0} max={1800} step={5} suffix="分" label="休憩時間を5分ずつ調整" onChange={onRepeatRestMinutesChange} /></label></div>
				{#if currentLane()?.type === 'tokuten' && hasMultipleBooths}<label class="booth-copy-toggle"><input type="checkbox" checked={copyAcrossBooths} onchange={(event) => onCopyAcrossBoothsChange((event.currentTarget as HTMLInputElement).checked)} /><span>全ブースへコピー</span></label>{#if copyAcrossBooths}<section class="booth-repeat-names"><strong>項目名</strong><p class="field-note">各ブースで / または ／ を使って繰り返し順を指定します。</p><div>{#each currentLane()?.booths ?? [] as booth (booth)}<label><span>{booth}ブース</span><input value={boothRepeatNames[booth] ?? ''} placeholder="グループA / グループB" oninput={(event) => onBoothRepeatNamesChange(booth, (event.currentTarget as HTMLInputElement).value)} /></label>{/each}</div></section><section class="booth-offsets"><strong>開始ずらし</strong><p class="field-note">1つだけなら次のブースごとに同じ間隔で開始します。追加した値はAブースからの開始ずらしです。</p><div class="booth-offset-list" class:compact-offset-grid={boothOffsets.length < 3}>{#each boothOffsets as offset, index (index)}<div class="booth-offset-row"><label><span>{boothOffsets.length === 1 ? 'ブース間の間隔' : `${currentLane()?.booths?.[index + 1] ?? ''}：Aブースから`} <strong>+{offset}分</strong></span><IntervalDelta value={offset} displayValue min={0} max={1800} label="開始ずらしを5分ずつ調整" onChange={(value) => onBoothOffsetsChange(boothOffsets.map((current, offsetIndex) => offsetIndex === index ? value : current))} /></label>{#if boothOffsets.length > 1}<button class="quiet-button booth-offset-remove" type="button" onclick={() => onRemoveBoothOffset(index)}>削除</button>{/if}</div>{/each}</div>{#if boothOffsets.length < (currentLane()?.booths?.length ?? 0) - 1}<button class="outline-button booth-offset-add" type="button" onclick={() => onBoothOffsetsChange([...boothOffsets, boothOffsets.at(-1) ?? 5])}>＋ ずらし時間を追加</button>{/if}</section>{/if}{/if}
				<div class="repeat-preview"><strong>追加プレビュー</strong>{#if copyAcrossBooths}{#each multiBoothPreview as group (group.boothId)}<section class="booth-repeat-preview"><strong>{group.boothId}ブース（+{group.offset}分）</strong>{#each group.entries as entry, index}{#if entry.kind === 'rest'}<span class="repeat-rest">--- {entry.minutes}分休憩 ---</span>{:else}<span>{index + 1}. {formatMinute(entry.startMinute)}–{formatMinute(entry.endMinute)}　{entry.artistLabel}</span>{/if}{/each}</section>{/each}{:else}{#each repeatPreview as entry, index}{#if entry.kind === 'rest'}<span class="repeat-rest">--- {entry.minutes}分休憩 ---</span>{:else}<span>{index + 1}. {formatMinute(entry.startMinute)}–{formatMinute(entry.endMinute)}　{entry.artistLabel}</span>{/if}{/each}{/if}</div>
			</div>
		</details>
	{/if}
	{#if !isNew}<div class="favorite-editor"><span>お気に入り</span>{#each [0, 1, 2, 3] as level (level)}<button class:active={draft.favoriteLevel === level} onclick={() => (draft.favoriteLevel = level as 0 | 1 | 2 | 3)}>♥{level}</button>{/each}</div>{/if}
	<details class="related-entry" open={relatedOpen} ontoggle={(event) => (relatedOpen = (event.currentTarget as HTMLDetailsElement).open)}><summary><span>{relatedLabel}</span><small>{relatedOpen ? 'オン' : 'オフ'}</small></summary><fieldset class="pairing-field related-event-field"><legend class="visually-hidden">{relatedLabel}</legend>
		{#if isNew}<p class="field-note">保存時に、指定したレーンへ同じ長さの関連イベントを追加します。</p><div class="form-grid related-event-create"><label>追加先レーン<select value={relatedLaneId} onchange={(event) => onRelatedLaneChange((event.currentTarget as HTMLSelectElement).value)}><option value="">追加しない</option>{#each lanes as lane (lane.id)}<option value={lane.id}>{lane.name}（{laneTypeLabel(lane.type)}）</option>{/each}<optgroup label="新しいレーンを追加">{#each laneTypes as type}<option value={`new:${type}`}>＋ 新しい{laneTypeLabel(type)}</option>{/each}</optgroup></select></label><label>開始タイミング<select value={relatedDelay} disabled={!relatedLaneId} onchange={(event) => onRelatedDelayChange((event.currentTarget as HTMLSelectElement).value)}>{#each delays as minutes (minutes)}<option value={minutes}>{minutes === 0 ? '終演後' : `${minutes}分後`}</option>{/each}<option value="custom">カスタム</option></select></label>{#if relatedDelay === 'custom'}<label>カスタム時間<span class="time-input-row"><select value={customRelatedDelay} disabled={!relatedLaneId} onchange={(event) => onCustomRelatedDelayChange(Number((event.currentTarget as HTMLSelectElement).value))}>{#each customDelays as minutes (minutes)}<option value={minutes}>{minutes}分後</option>{/each}</select><IntervalDelta value={customRelatedDelay} min={25} max={180} onChange={onCustomRelatedDelayChange} label="カスタム時間を5分ずつ調整" /></span></label>{/if}</div>{/if}
		<details class="existing-event-picker" open><summary>既存のイベントを関連付ける</summary><div class="pairing-list">{#each lanes as lane (lane.id)}{@const laneItems = relatedItemsForLane(lane)}{#if laneItems.length}<details class="related-lane-group" open={shouldExpandRelatedBranch(laneItems)}><summary><span>{lane.name}</span><small>{laneItems.length}件</small></summary><div class="related-lane-items">{#if lane.booths?.length}{#each lane.booths as booth (booth)}{@const boothItems = relatedItemsForBooth(lane, booth)}{#if boothItems.length}<details class="related-booth-group" open={shouldExpandRelatedBranch(boothItems)}><summary>{booth}</summary><div class="related-booth-items">{#each boothItems as item (item.id)}<label><input type="checkbox" checked={draft.pairedTokutenItemIds.includes(item.id)} onchange={() => onTogglePair(item.id)} /><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong></label>{/each}</div></details>{/if}{/each}{:else}{#each laneItems as item (item.id)}<label><input type="checkbox" checked={draft.pairedTokutenItemIds.includes(item.id)} onchange={() => onTogglePair(item.id)} /><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong></label>{/each}{/if}</div></details>{/if}{/each}</div></details>
	</fieldset></details>
	<div class="modal-actions"><button class="danger-button" onclick={onDelete}>{deleteLabel}</button>{#if !isNew}<button class="quiet-button" onclick={onDuplicate}>{duplicateLabel}</button>{/if}<span></span><button class="quiet-button" onclick={onClose}>{cancelLabel}</button><button class="primary-button" onclick={onSave}>{applyLabel}</button></div>
</ModalShell>
