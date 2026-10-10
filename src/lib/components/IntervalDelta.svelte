<script lang="ts">
	import { intervalDeltaText } from '$lib/features/scheduler/interval-delta';

	let {
		value,
		onChange,
		min = 0,
		max = 30 * 60,
		label = '時刻を5分ずつ調整',
		displayValue = false
	}: {
		value: number;
		onChange: (value: number) => void;
		min?: number;
		max?: number;
		label?: string;
		displayValue?: boolean;
	} = $props();

	function adjust(delta: number): void {
		const alignedValue = Math.round(value / 5) * 5;
		onChange(Math.max(min, Math.min(max, alignedValue + delta)));
	}
</script>

<span class="interval-delta" aria-label={label}>
	<button type="button" aria-label={`${label}を5分戻す`} disabled={value <= min} onclick={() => adjust(-5)}>−</button>
	<output>{intervalDeltaText(value, displayValue)}</output>
	<button type="button" aria-label={`${label}を5分進める`} disabled={value >= max} onclick={() => adjust(5)}>＋</button>
</span>
