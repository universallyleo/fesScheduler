<script lang="ts">
	import type { ItemOverlapPolicy } from '$lib/types';
	import ModalHeader from '$lib/components/ModalHeader.svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';

	let { policy, onChange, onClose }: { policy: ItemOverlapPolicy; onChange: (policy: ItemOverlapPolicy) => void; onClose: () => void } = $props();
	const options: { value: ItemOverlapPolicy; label: string; description: string; kind: 'overlap' | 'booth' | 'cascade' }[] = [
		{ value: 'allow', label: '重ねる（警告）', description: '項目を重ね、競合を警告します。', kind: 'overlap' },
		{ value: 'free-booth', label: '空きブースへ移動', description: '空いているブースがあれば移動します。', kind: 'booth' },
		{ value: 'cascade', label: '前後をずらす', description: '重なった項目だけを前後にずらします。', kind: 'cascade' }
	];
</script>

<ModalShell className="overlap-policy-modal" labelledBy="overlap-policy-title" {onClose}>
	<ModalHeader eyebrow="EDITING" title="重なり時の動作" titleId="overlap-policy-title" closeLabel="閉じる" {onClose} />
	<fieldset class="overlap-policy-options">
		<legend>項目をドラッグして重なったとき</legend>
		{#each options as option (option.value)}
			<label class:active={policy === option.value}>
				<input type="radio" name="overlap-policy" value={option.value} checked={policy === option.value} onchange={() => onChange(option.value)} />
				<svg viewBox="0 0 100 44" aria-hidden="true" class:policy-overlap={option.kind === 'overlap'} class:policy-booth={option.kind === 'booth'} class:policy-cascade={option.kind === 'cascade'}>
					<rect x="8" y="10" width="38" height="20" rx="4" /><rect x="42" y="14" width="38" height="20" rx="4" />
					{#if option.kind === 'overlap'}<path d="M51 6v9M46.5 10.5h9" />{:else if option.kind === 'booth'}<path d="M47 7h35M75 3l6 4-6 4" />{:else}<path d="M42 38v-7M37.5 34.5h9" />{/if}
				</svg>
				<span><strong>{option.label}</strong><small>{option.description}</small></span>
			</label>
		{/each}
	</fieldset>
</ModalShell>
