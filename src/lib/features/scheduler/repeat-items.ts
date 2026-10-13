export type RepeatItemInput = {
	startMinute: number;
	endMinute: number;
	fallbackName: string;
	namesText: string;
	repeatCount: number;
	restMinutes: number;
	itemsBeforeRest: number;
	endLimitMinute?: number;
};

export type RepeatItemSpec = {
	startMinute: number;
	endMinute: number;
	artistLabel: string;
};

export type RepeatPreviewEntry =
	| ({ kind: 'item' } & RepeatItemSpec)
	| { kind: 'rest'; minutes: number };

export const SCHEDULE_END_MINUTE = 30 * 60;

function normalizedNames(namesText: string, fallbackName: string): string[] {
	const names = namesText
		.replaceAll('／', '/')
		.split('/')
		.map((name) => name.trim())
		.filter(Boolean);
	return names.length ? names : [fallbackName.trim() || '新しい項目'];
}

export function countRepeatNames(namesText: string): number {
	return namesText
		.replaceAll('／', '/')
		.split('/')
		.map((name) => name.trim())
		.filter(Boolean).length;
}

export function maximumRepeatCount({
	startMinute,
	endMinute,
	restMinutes,
	itemsBeforeRest,
	endLimitMinute
}: Pick<RepeatItemInput, 'startMinute' | 'endMinute' | 'restMinutes' | 'itemsBeforeRest' | 'endLimitMinute'>, limitMinute = endLimitMinute ?? SCHEDULE_END_MINUTE): number {
	const duration = endMinute - startMinute;
	if (duration <= 0 || startMinute < 0) return 0;
	let count = 0;
	let cursor = startMinute;
	const normalizedCadence = Math.max(1, Math.floor(itemsBeforeRest));
	const normalizedRest = Math.max(0, restMinutes);
	while (cursor + duration <= limitMinute) {
		count += 1;
		cursor += duration;
		if (count % normalizedCadence === 0) cursor += normalizedRest;
	}
	return count;
}

export function reconcileRepeatCount(repeatCount: number, namesText: string, maximumCount: number): number {
	return Math.min(Math.max(1, Math.floor(maximumCount)), Math.max(1, Math.floor(repeatCount), countRepeatNames(namesText)));
}

export function buildRepeatedItemSpecs(input: RepeatItemInput, limitMinute = input.endLimitMinute ?? SCHEDULE_END_MINUTE): RepeatItemSpec[] {
	const duration = input.endMinute - input.startMinute;
	const count = Math.min(
		Math.max(0, Math.floor(input.repeatCount)),
		maximumRepeatCount(input, limitMinute)
	);
	const names = normalizedNames(input.namesText, input.fallbackName);
	const cadence = Math.max(1, Math.floor(input.itemsBeforeRest));
	const rest = Math.max(0, input.restMinutes);
	let cursor = input.startMinute;
	return Array.from({ length: count }, (_, index) => {
		const artistLabel = names[Math.min(index, names.length - 1)] as string;
		const item = { startMinute: cursor, endMinute: cursor + duration, artistLabel };
		cursor += duration;
		if ((index + 1) % cadence === 0) cursor += rest;
		return item;
	});
}

export function buildRepeatPreview(input: RepeatItemInput, limitMinute = input.endLimitMinute ?? SCHEDULE_END_MINUTE): RepeatPreviewEntry[] {
	const items = buildRepeatedItemSpecs(input, limitMinute);
	const cadence = Math.max(1, Math.floor(input.itemsBeforeRest));
	const rest = Math.max(0, input.restMinutes);
	return items.flatMap((item, index) => {
		const entries: RepeatPreviewEntry[] = [{ kind: 'item', ...item }];
		if (rest > 0 && (index + 1) % cadence === 0 && index < items.length - 1) {
			entries.push({ kind: 'rest', minutes: rest });
		}
		return entries;
	});
}
