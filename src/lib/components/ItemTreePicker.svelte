<script lang="ts">
	import type { Lane, ScheduleItem } from '$lib/types';

	let {
		lanes,
		selectedItemIds,
		itemsForLane,
		itemsForBooth,
		shouldExpandBranch,
		formatMinute,
		onToggle
	}: {
		lanes: Lane[];
		selectedItemIds: string[];
		itemsForLane: (lane: Lane) => ScheduleItem[];
		itemsForBooth: (lane: Lane, booth: string) => ScheduleItem[];
		shouldExpandBranch: (items: ScheduleItem[]) => boolean;
		formatMinute: (minute: number) => string;
		onToggle: (itemId: string) => void;
	} = $props();
</script>

<div class="pairing-list">
	{#each lanes as lane (lane.id)}
		{@const laneItems = itemsForLane(lane)}
		{#if laneItems.length}
			<details class="related-lane-group" open={shouldExpandBranch(laneItems)}>
				<summary><span>{lane.name}</span><small>{laneItems.length}件</small></summary>
				<div class="related-lane-items">
					{#if lane.booths?.length}
						{#each lane.booths as booth (booth)}
							{@const boothItems = itemsForBooth(lane, booth)}
							{#if boothItems.length}
								<details class="related-booth-group" open={shouldExpandBranch(boothItems)}>
									<summary>{booth}</summary>
									<div class="related-booth-items">
										{#each boothItems as item (item.id)}
											<label><input type="checkbox" checked={selectedItemIds.includes(item.id)} onchange={() => onToggle(item.id)} /><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong></label>
										{/each}
									</div>
								</details>
							{/if}
						{/each}
					{:else}
						{#each laneItems as item (item.id)}
							<label><input type="checkbox" checked={selectedItemIds.includes(item.id)} onchange={() => onToggle(item.id)} /><span>{formatMinute(item.startMinute)}–{formatMinute(item.endMinute)}</span><strong>{item.artistLabel}</strong></label>
						{/each}
					{/if}
				</div>
			</details>
		{/if}
	{/each}
</div>
