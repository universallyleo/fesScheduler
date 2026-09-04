import type { ScheduleItem } from '$lib/types';

export type FavoriteFilter = 0 | 1 | 2 | 3;

export type DragState = {
	kind: 'move' | 'resize';
	itemId: string;
	originY: number;
	startMinute: number;
	endMinute: number;
} | null;

export type CreateState = {
	laneId: string;
	startMinute: number;
	currentMinute: number;
} | null;

export type BulkRow = {
	id: string;
	artist: string;
	start: number;
	end: number;
};

export type FestivalSettingsDraft = {
	title: string;
	timezone: string;
	date: string;
	displayStart: string;
	displayEnd: string;
};

export type ItemEditorState = {
	draft: ScheduleItem;
	isNew: boolean;
};
