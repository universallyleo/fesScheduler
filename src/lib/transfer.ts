import type { Festival, FestivalDay, Lane, ScheduleItem } from './types';

export const TRANSFER_SCHEMA_VERSION = 1;

interface TransferDocument {
	schemaVersion: number;
	exportedAt: string;
	festival: Festival;
}

export type TransferResult = { ok: true; festival: Festival } | { ok: false; error: string };

export function createTransferDocument(festival: Festival): string {
	const document: TransferDocument = {
		schemaVersion: TRANSFER_SCHEMA_VERSION,
		exportedAt: new Date().toISOString(),
		festival
	};
	return JSON.stringify(document, null, 2);
}

function isLane(value: unknown): value is Lane {
	if (!value || typeof value !== 'object') return false;
	const lane = value as Partial<Lane>;
	return (
		typeof lane.id === 'string' &&
		typeof lane.name === 'string' &&
		['stage', 'tokuten', 'event'].includes(lane.type ?? '')
	);
}

function isItem(value: unknown): value is ScheduleItem {
	if (!value || typeof value !== 'object') return false;
	const item = value as Partial<ScheduleItem>;
	return (
		typeof item.id === 'string' &&
		typeof item.laneId === 'string' &&
		typeof item.startMinute === 'number' &&
		typeof item.endMinute === 'number' &&
		item.endMinute > item.startMinute &&
		typeof item.artistLabel === 'string' &&
		Array.isArray(item.artistEntityIds) &&
		[0, 1, 2, 3].includes(item.favoriteLevel ?? -1) &&
		Array.isArray(item.pairedTokutenItemIds)
	);
}

function isDay(value: unknown): value is FestivalDay {
	if (!value || typeof value !== 'object') return false;
	const day = value as Partial<FestivalDay>;
	return (
		typeof day.id === 'string' &&
		typeof day.date === 'string' &&
		Array.isArray(day.lanes) &&
		Array.isArray(day.items) &&
		day.lanes.every(isLane) &&
		day.items.every(isItem)
	);
}

export function parseTransferDocument(text: string): TransferResult {
	try {
		const value = JSON.parse(text) as Partial<TransferDocument>;
		if (value.schemaVersion !== TRANSFER_SCHEMA_VERSION)
			return { ok: false, error: 'Unsupported timetable file version.' };
		const festival = value.festival;
		if (
			!festival ||
			typeof festival.id !== 'string' ||
			typeof festival.title !== 'string' ||
			typeof festival.timezone !== 'string' ||
			!Array.isArray(festival.artistDirectory) ||
			!Array.isArray(festival.days) ||
			!festival.days.every(isDay)
		) {
			return { ok: false, error: 'This file is missing required timetable data.' };
		}
		return { ok: true, festival };
	} catch {
		return { ok: false, error: 'The selected file is not valid JSON.' };
	}
}
