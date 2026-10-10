import {
	buildRepeatPreview,
	buildRepeatedItemSpecs,
	maximumRepeatCount,
	type RepeatItemInput,
	type RepeatItemSpec,
	type RepeatPreviewEntry
} from './repeat-items';

export type BoothRepeatItemSpec = RepeatItemSpec & {
	boothId: string;
};

export type BoothRepeatPreviewGroup = {
	boothId: string;
	offset: number;
	entries: RepeatPreviewEntry[];
};

export type MultiBoothRepeatInput = {
	repeat: RepeatItemInput;
	repeatByBooth?: Record<string, RepeatItemInput>;
	booths: string[];
	enteredOffsets: number[];
	copyAcrossBooths: boolean;
};

export type MultiBoothRepeatResult = {
	items: BoothRepeatItemSpec[];
	preview: BoothRepeatPreviewGroup[];
};

export function effectiveBoothOffsets(booths: string[], enteredOffsets: number[]): number[] {
	if (!booths.length) return [];
	const normalizedOffsets = enteredOffsets.map((value) => Math.max(0, Math.round(value / 5) * 5));
	if (normalizedOffsets.length >= booths.length - 1) return [0, ...normalizedOffsets.slice(0, booths.length - 1)];
	const interval = normalizedOffsets[0] ?? 0;
	return booths.map((_, index) => index * interval);
}

function shiftedRepeatInput(repeat: RepeatItemInput, offset: number): RepeatItemInput {
	return {
		...repeat,
		startMinute: repeat.startMinute + offset,
		endMinute: repeat.endMinute + offset
	};
}

function repeatForBooth(input: MultiBoothRepeatInput, boothId: string): RepeatItemInput {
	return input.repeatByBooth?.[boothId] ?? input.repeat;
}

export function buildMultiBoothRepeat(input: MultiBoothRepeatInput): MultiBoothRepeatResult {
	if (!input.copyAcrossBooths) return { items: [], preview: [] };
	const offsets = effectiveBoothOffsets(input.booths, input.enteredOffsets);
	const preview = input.booths.map((boothId, index) => {
		const repeat = shiftedRepeatInput(repeatForBooth(input, boothId), offsets[index] ?? 0);
		return { boothId, offset: offsets[index] ?? 0, entries: buildRepeatPreview(repeat) };
	});
	const items = input.booths.flatMap((boothId, index) =>
		buildRepeatedItemSpecs(shiftedRepeatInput(repeatForBooth(input, boothId), offsets[index] ?? 0)).map((item) => ({
			...item,
			boothId
		}))
	);
	return { items, preview };
}

export function maximumMultiBoothRepeatCount(input: MultiBoothRepeatInput): number {
	if (!input.copyAcrossBooths || !input.booths.length) return maximumRepeatCount(input.repeat);
	const offsets = effectiveBoothOffsets(input.booths, input.enteredOffsets);
	return Math.min(
		...offsets.map((offset, index) =>
			maximumRepeatCount(shiftedRepeatInput(repeatForBooth(input, input.booths[index] ?? ''), offset))
		)
	);
}
