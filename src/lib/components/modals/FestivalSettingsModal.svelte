<script lang="ts">
	import type { FestivalSettingsDraft } from '$lib/ui-types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

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
			<input
				inputmode="numeric"
				placeholder="09:00"
				bind:value={draft.displayStart}
				onblur={(event) => onNormalizeTime(event, (value) => (draft.displayStart = value), 24)}
			/>
		</label>
		<label>
			表示終了時刻
			<input
				inputmode="numeric"
				placeholder="30:00"
				bind:value={draft.displayEnd}
				onblur={(event) => onNormalizeTime(event, (value) => (draft.displayEnd = value))}
			/>
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
