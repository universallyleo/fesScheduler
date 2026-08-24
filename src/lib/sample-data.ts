import type { Festival, Lane, ScheduleItem } from './types';

const lanes: Lane[] = [
	{
		id: 'main',
		name: 'パイナップルステージ',
		type: 'stage',
		venueName: '屋外メイン',
		color: '#ffad0a'
	},
	{
		id: 'tokuten-1',
		name: '特典会1（学校2F）',
		type: 'tokuten',
		venueName: '学校 2F',
		color: '#a8adb5'
	},
	{
		id: 'tokuten-2',
		name: '特典会2（学校2F）',
		type: 'tokuten',
		venueName: '学校 2F',
		color: '#b7bdc5'
	},
	{ id: 'event', name: 'イベント広場', type: 'event', venueName: '体育館前', color: '#69a7bc' }
];

const items: ScheduleItem[] = [
	{
		id: 'stage-1',
		laneId: 'main',
		startMinute: 600,
		endMinute: 615,
		artistLabel: 'I’mew（あいみゅう）',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['imew'],
		favoriteLevel: 3,
		pairedTokutenItemIds: ['benefit-1']
	},
	{
		id: 'stage-2',
		laneId: 'main',
		startMinute: 615,
		endMinute: 630,
		artistLabel: 'むーぷり',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['muupuri'],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	},
	{
		id: 'stage-3',
		laneId: 'main',
		startMinute: 630,
		endMinute: 645,
		artistLabel: 'ルージュブック',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['rouge'],
		favoriteLevel: 2,
		pairedTokutenItemIds: ['benefit-2']
	},
	{
		id: 'stage-4',
		laneId: 'main',
		startMinute: 645,
		endMinute: 660,
		artistLabel: '世界デザイン',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['sekai'],
		favoriteLevel: 1,
		pairedTokutenItemIds: []
	},
	{
		id: 'stage-5',
		laneId: 'main',
		startMinute: 660,
		endMinute: 675,
		artistLabel: 'あまいもの',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['amai'],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	},
	{
		id: 'stage-6',
		laneId: 'main',
		startMinute: 685,
		endMinute: 700,
		artistLabel: 'KRD8',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['krd8'],
		favoriteLevel: 1,
		pairedTokutenItemIds: ['benefit-3']
	},
	{
		id: 'stage-7',
		laneId: 'main',
		startMinute: 700,
		endMinute: 715,
		artistLabel: 'ミームトーキョー',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['meme'],
		favoriteLevel: 2,
		pairedTokutenItemIds: []
	},
	{
		id: 'stage-8',
		laneId: 'main',
		startMinute: 715,
		endMinute: 730,
		artistLabel: 'すーぱーぷー',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['super'],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	},
	{
		id: 'stage-9',
		laneId: 'main',
		startMinute: 730,
		endMinute: 745,
		artistLabel: '月刊PAM',
		subContent: 'パイナップルステージ',
		artistEntityIds: ['pam'],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	},
	{
		id: 'benefit-1',
		laneId: 'tokuten-1',
		startMinute: 610,
		endMinute: 670,
		artistLabel: 'I’mew（メンバー）',
		subContent: '特典会1',
		artistEntityIds: ['imew-member-a'],
		favoriteLevel: 3,
		pairedTokutenItemIds: []
	},
	{
		id: 'benefit-2',
		laneId: 'tokuten-1',
		startMinute: 680,
		endMinute: 740,
		artistLabel: 'ルージュブック',
		subContent: '特典会1',
		artistEntityIds: ['rouge'],
		favoriteLevel: 2,
		pairedTokutenItemIds: []
	},
	{
		id: 'benefit-3',
		laneId: 'tokuten-2',
		startMinute: 700,
		endMinute: 760,
		artistLabel: 'KRD8',
		subContent: '特典会2',
		artistEntityIds: ['krd8'],
		favoriteLevel: 1,
		pairedTokutenItemIds: []
	},
	{
		id: 'event-1',
		laneId: 'event',
		startMinute: 630,
		endMinute: 690,
		artistLabel: 'Bunny La Crew',
		subContent: '縁日 - 金魚釣り',
		artistEntityIds: [],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	},
	{
		id: 'event-2',
		laneId: 'event',
		startMinute: 750,
		endMinute: 810,
		artistLabel: 'Sweet Alley',
		subContent: 'フードコート',
		artistEntityIds: [],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	}
];

export const SAMPLE_FESTIVAL: Festival = {
	id: 'sample-jam-expo-2026',
	title: '@JAM EXPO 2026',
	timezone: 'Asia/Tokyo',
	artistDirectory: [
		{ id: 'imew', kind: 'group', name: 'I’mew', memberIds: ['imew-member-a'] },
		{ id: 'imew-member-a', kind: 'member', name: 'I’mew member', groupIds: ['imew'] },
		...['muupuri', 'rouge', 'sekai', 'amai', 'krd8', 'meme', 'super', 'pam'].map((id) => ({
			id,
			kind: 'group' as const,
			name: id
		}))
	],
	days: [{ id: 'sample-day-1', date: '2026-08-29', openingMinute: 600, lanes, items }],
	updatedAt: '2026-08-24T00:00:00.000Z'
};

export function cloneFestival(festival: Festival): Festival {
	return JSON.parse(JSON.stringify(festival)) as Festival;
}

export function createBlankFestival(): Festival {
	const id = crypto.randomUUID();
	const dayId = crypto.randomUUID();
	return {
		id,
		title: '新しいフェスティバル',
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo',
		artistDirectory: [],
		days: [
			{
				id: dayId,
				date: new Date().toISOString().slice(0, 10),
				lanes: [
					{ id: crypto.randomUUID(), name: 'メインステージ', type: 'stage', color: '#ffad0a' },
					{ id: crypto.randomUUID(), name: '特典会', type: 'tokuten', color: '#a8adb5' }
				],
				items: []
			}
		],
		updatedAt: new Date().toISOString()
	};
}
