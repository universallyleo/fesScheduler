<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		className = '',
		labelledBy,
		onClose
	}: {
		children: Snippet;
		className?: string;
		labelledBy: string;
		onClose: () => void;
	} = $props();
</script>

<div
	class="modal-backdrop"
	role="presentation"
	onclick={(event) => {
		if (event.target === event.currentTarget) onClose();
	}}
>
	<div class={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
		{@render children()}
	</div>
</div>
