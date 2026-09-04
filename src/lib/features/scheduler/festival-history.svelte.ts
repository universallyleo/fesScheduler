import type { Festival } from '$lib/types';

export function createFestivalHistory(initialFestival: Festival) {
	let current = $state(initialFestival);
	let undoStack = $state<Festival[]>([]);
	let redoStack = $state<Festival[]>([]);

	function snapshot(festival: Festival): Festival {
		return JSON.parse(JSON.stringify(festival)) as Festival;
	}

	function replace(next: Festival): void {
		current = next;
		undoStack = [];
		redoStack = [];
	}

	function update(mutator: (next: Festival) => void): void {
		undoStack.push(snapshot(current));
		redoStack = [];
		const next = snapshot(current);
		mutator(next);
		next.updatedAt = new Date().toISOString();
		current = next;
	}

	function undo(): void {
		const previous = undoStack.pop();
		if (!previous) return;
		redoStack.push(snapshot(current));
		current = previous;
	}

	function redo(): void {
		const next = redoStack.pop();
		if (!next) return;
		undoStack.push(snapshot(current));
		current = next;
	}

	return {
		get festival() {
			return current;
		},
		get undoStack() {
			return undoStack;
		},
		get redoStack() {
			return redoStack;
		},
		replace,
		update,
		undo,
		redo
	};
}
