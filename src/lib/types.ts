export type LaneType = 'stage' | 'tokuten' | 'event';
export type ItemOverlapPolicy = 'allow' | 'free-booth' | 'cascade';
export type LaneWidthMode = 'type' | 'individual';
export type LaneTypeWidths = Record<LaneType, number>;
export type ArtistEntityKind = 'group' | 'member';

export interface ArtistEntity {
	id: string;
	kind: ArtistEntityKind;
	name: string;
	memberIds?: string[];
	groupIds?: string[];
}

export interface Lane {
	id: string;
	name: string;
	type: LaneType;
	venueName?: string;
	venueUrl?: string;
	openingMinute?: number;
	color?: string;
	backgroundColor?: string;
	booths?: string[];
	width?: number;
}

export interface ScheduleItem {
	id: string;
	laneId: string;
	startMinute: number;
	endMinute: number;
	artistLabel: string;
	subContent?: string;
	boothId?: string;
	itemType?: LaneType;
	color?: string;
	artistEntityIds: string[];
	favoriteLevel: 0 | 1 | 2 | 3;
	pairedTokutenItemIds: string[];
}

export interface FestivalDay {
	id: string;
	date: string;
	openingMinute?: number;
	displayStartMinute?: number;
	displayEndMinute?: number;
	lanes: Lane[];
	items: ScheduleItem[];
}

export interface Festival {
	id: string;
	title: string;
	timezone: string;
	artistDirectory: ArtistEntity[];
	days: FestivalDay[];
	updatedAt: string;
}

export interface UserPreferences {
	language: 'ja' | 'en';
	theme: 'light' | 'dark';
	snapMinutes: 5;
	timeZoom: number;
	laneWidthMode: LaneWidthMode;
	laneWidths: LaneTypeWidths;
	itemOverlapPolicy: ItemOverlapPolicy;
	compactFavorites: boolean;
	blockColorMode: 'full' | 'partial';
	lastFestivalId?: string;
	lastDayId?: string;
}

export interface CompactItemPlacement {
	item: ScheduleItem;
	column: number;
}

export interface ConflictReport {
	sameLane: [string, string][];
	sameArtist: [string, string][];
}
