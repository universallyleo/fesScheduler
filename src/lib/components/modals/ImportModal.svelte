<script lang="ts">
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

	let {
		text = $bindable(''),
		closeLabel,
		cancelLabel,
		importLabel,
		onClose,
		onImport,
		onFileInput
	}: {
		text?: string;
		closeLabel: string;
		cancelLabel: string;
		importLabel: string;
		onClose: () => void;
		onImport: () => void;
		onFileInput: (event: Event) => void;
	} = $props();
</script>

<ModalShell className="transfer-modal" labelledBy="import-title" {onClose}>
	<ModalHeader
		eyebrow="TRANSFER"
		title={importLabel}
		titleId="import-title"
		closeLabel={closeLabel}
		{onClose}
	/>
	<p class="modal-note">JSONファイルを選択するか、テキストを貼り付けてください。既存データは上書きされません。</p>
	<textarea bind:value={text} placeholder="ここに JSON を貼り付け"></textarea>
	<div class="modal-actions">
		<label class="file-button">ファイルを選択<input type="file" accept="application/json,.json" onchange={onFileInput} /></label>
		<span></span>
		<button class="quiet-button" onclick={onClose}>{cancelLabel}</button>
		<button class="primary-button" onclick={onImport} disabled={!text.trim()}>{importLabel}</button>
	</div>
</ModalShell>
