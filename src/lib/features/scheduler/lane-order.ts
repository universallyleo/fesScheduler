import type { Lane } from '$lib/types';

export function reorderLanes(lanes: Lane[], sourceId: string, targetId: string): Lane[] {
	if (sourceId === targetId) return lanes;
	const sourceIndex = lanes.findIndex((lane) => lane.id === sourceId);
	const targetIndex = lanes.findIndex((lane) => lane.id === targetId);
	if (sourceIndex < 0 || targetIndex < 0) return lanes;
	const reordered = [...lanes];
	const [source] = reordered.splice(sourceIndex, 1);
	if (!source) return lanes;
	reordered.splice(targetIndex, 0, source);
	return reordered;
}
