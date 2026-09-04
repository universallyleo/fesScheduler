<script lang="ts">
	let {
		eyebrow,
		title,
		titleId,
		closeLabel,
		onClose
	}: {
		eyebrow: string;
		title: string;
		titleId: string;
		closeLabel: string;
		onClose: () => void;
	} = $props();
</script>

<div class="modal-heading">
	<div>
		<p class="eyebrow">{eyebrow}</p>
		<h2 id={titleId}>{title}</h2>
	</div>
	<button class="icon-button" aria-label={closeLabel} onclick={onClose}>×</button>
</div>
