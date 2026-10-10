<script lang="ts">
	let {
		value,
		onChange,
		min = 1,
		max,
		step = 1,
		suffix = '',
		label
	}: {
		value: number;
		onChange: (value: number) => void;
		min?: number;
		max: number;
		step?: number;
		suffix?: string;
		label: string;
	} = $props();

	function adjust(delta: number): void {
		onChange(Math.max(min, Math.min(max, value + delta * step)));
	}
</script>

<span class="number-delta" aria-label={label}>
	<button type="button" aria-label={`${label}を減らす`} disabled={value <= min} onclick={() => adjust(-1)}>−</button>
	<output>{value}{suffix}</output>
	<button type="button" aria-label={`${label}を増やす`} disabled={value >= max} onclick={() => adjust(1)}>＋</button>
</span>
