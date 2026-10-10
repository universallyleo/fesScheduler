<script lang="ts">
	import type { FestivalSettingsDraft } from '$lib/ui-types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';
	import IntervalDelta from '$lib/components/IntervalDelta.svelte';

	let {
		draft = $bindable<FestivalSettingsDraft>(),
		closeLabel,
		cancelLabel,
		applyLabel,
		onClose,
		onApply,
		onNormalizeTime
	}: {
		draft?: FestivalSettingsDraft;
		closeLabel: string;
		cancelLabel: string;
		applyLabel: string;
		onClose: () => void;
		onApply: () => void;
		onNormalizeTime: (
			event: FocusEvent,
			commit: (value: string) => void,
			maxHour?: number
		) => void;
	} = $props();
	function minuteFromText(value: string): number { return Number(value.slice(0, 2)) * 60 + Number(value.slice(3)); }
	function formatMinute(value: number): string { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
</script>

<ModalShell className="festival-settings-modal" labelledBy="festival-settings-title" {onClose}>
	<ModalHeader
		eyebrow="フェス基本設定"
		title="フェス設定"
		titleId="festival-settings-title"
		closeLabel={closeLabel}
		{onClose}
	/>
	<div class="form-grid">
		<label class="festival-settings-title-field">フェス名<input bind:value={draft.title} /></label>
		<label>タイムゾーン<input list="timezone-options" bind:value={draft.timezone} /></label>
		<label>日付<input type="date" bind:value={draft.date} /></label>
		<label>
			表示開始時刻
			<span class="time-input-row"><input
				inputmode="numeric"
				placeholder="09:00"
				bind:value={draft.displayStart}
				onblur={(event) => onNormalizeTime(event, (value) => (draft.displayStart = value))}
			/><IntervalDelta value={minuteFromText(draft.displayStart)} onChange={(value) => (draft.displayStart = formatMinute(value))} /></span>
		</label>
		<label>
			表示終了時刻
			<span class="time-input-row"><input
				inputmode="numeric"
				placeholder="30:00"
				bind:value={draft.displayEnd}
				onblur={(event) => onNormalizeTime(event, (value) => (draft.displayEnd = value))}
			/><IntervalDelta value={minuteFromText(draft.displayEnd)} onChange={(value) => (draft.displayEnd = formatMinute(value))} /></span>
		</label>
	</div>
	<datalist id="timezone-options">
		<option value="Asia/Tokyo"></option><option value="Asia/Seoul"></option><option value="Asia/Shanghai"></option><option value="Asia/Singapore"></option><option value="Asia/Bangkok"></option><option value="Australia/Sydney"></option><option value="Europe/London"></option><option value="America/Los_Angeles"></option><option value="America/New_York"></option>
	</datalist>
	<p class="field-note">表示範囲はタイムテーブルの見える時間だけを変更します。終了時刻は翌朝06:00を表す30:00まで指定でき、項目の時刻は変更されません。</p>
	<div class="modal-actions">
		<button class="quiet-button" onclick={onClose}>{cancelLabel}</button><span></span>
		<button class="primary-button" onclick={onApply}>{applyLabel}</button>
	</div>
</ModalShell>
