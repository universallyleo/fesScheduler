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

type TimetableEntry = readonly [start: string, end: string, artist: string];

function timetableMinute(value: string): number {
	const [hour, minute] = value.split(':').map(Number);
	return hour * 60 + minute;
}

function timetableItems(laneId: string, entries: TimetableEntry[]): ScheduleItem[] {
	return entries.map(([start, end, artist], index) => ({
		id: `${laneId}-${index + 1}`,
		laneId,
		startMinute: timetableMinute(start),
		endMinute: timetableMinute(end),
		artistLabel: artist,
		subContent: '',
		artistEntityIds: [],
		favoriteLevel: 0,
		pairedTokutenItemIds: []
	}));
}

const kagayakiStageLanes: Lane[] = [
	{ id: 'kagayaki-theatre', name: '金沢歌劇座', type: 'stage', color: '#229d53' },
	{ id: 'kagayaki-eight', name: 'Eight Hall', type: 'stage', color: '#ff657b' },
	{ id: 'kagayaki-redsun', name: 'REDSUN', type: 'stage', color: '#ca1830' },
	{ id: 'kagayaki-az', name: '金沢AZ', type: 'stage', color: '#12afd5' },
	{ id: 'kagayaki-gold-creek', name: 'GOLD CREEK', type: 'stage', color: '#f6db3e' },
	{ id: 'kagayaki-double', name: 'ダブル金沢', type: 'stage', color: '#d931bb' },
	{ id: 'kagayaki-education', name: '教育会館ホール', type: 'stage', color: '#8765a0' },
	{ id: 'kagayaki-katamachi', name: '片町きらら', type: 'stage', color: '#fff552' }
];

const kagayakiTokutenLanes: Lane[] = [
	{ id: 'kagayaki-2f-conference', name: '金沢歌劇座 2F大会議室', type: 'tokuten', booths: ['A', 'B', 'C'], color: '#229d53' },
	{ id: 'kagayaki-2f-lobby', name: '金沢歌劇座 2Fロビー', type: 'tokuten', booths: ['E', 'F'], color: '#229d53' },
	{ id: 'kagayaki-3f-practice', name: '金沢歌劇座 3F大練習室', type: 'tokuten', booths: ['G', 'H', 'I'], color: '#229d53' },
	{ id: 'kagayaki-3f-conference', name: '金沢歌劇座 3F大会議室', type: 'tokuten', booths: ['J', 'K', 'L', 'M'], color: '#229d53' },
	{ id: 'kagayaki-2f-5th', name: '金沢歌劇座 2F第5大会議室', type: 'tokuten', color: '#229d53' },
	{ id: 'kagayaki-2f-6th', name: '金沢歌劇座 2F第6大会議室', type: 'tokuten', booths: ['O', 'P', 'Q'], color: '#229d53' },
	{ id: 'kagayaki-2f-8th', name: '金沢歌劇座 2F第8大会議室', type: 'tokuten', color: '#229d53' },
	{ id: 'kagayaki-eight-4f', name: 'Eight Hall 4F', type: 'tokuten', booths: ['S', 'T'], color: '#ff657b' },
	{ id: 'kagayaki-redsun-lobby', name: 'REDSUN ロビー', type: 'tokuten', color: '#ca1830' },
	{ id: 'kagayaki-az-parking', name: '金沢AZ 駐車場', type: 'tokuten', booths: ['V', 'W'], color: '#12afd5' },
	{ id: 'kagayaki-az-g-studio', name: '金沢AZ Gスタジオ', type: 'tokuten', color: '#12afd5' },
	{ id: 'kagayaki-double-2f', name: 'ダブル金沢 2F', type: 'tokuten', booths: ['Y', 'Z', 'AA'], color: '#d931bb' },
	{ id: 'kagayaki-education-lobby', name: '教育会館ホール ロビー', type: 'tokuten', color: '#8765a0' },
	{ id: 'kagayaki-education-2f', name: '教育会館ホール 2F第1大会議室', type: 'tokuten', booths: ['AD', 'AE', 'AF'], color: '#8765a0' },
	{ id: 'kagayaki-harmonie-1f', name: 'HARMONIE 1F', type: 'tokuten', booths: ['AG', 'AH'], color: '#6686bd' },
	{ id: 'kagayaki-harmonie-2f', name: 'HARMONIE 2F', type: 'tokuten', booths: ['AI', 'AJ'], color: '#6686bd' }
];

const kagayakiStageItems: ScheduleItem[] = [
	...timetableItems('kagayaki-theatre', [
		['10:50', '11:00', 'オープニング'],
		['11:00', '11:20', 'クマリデパート'], ['11:20', '11:40', 'selfish'],
		['11:40', '12:00', 'マリークラウン'], ['12:15', '12:35', 'Switch Drop'],
		['12:35', '12:55', 'KAWAII LAB. MATES'], ['12:55', '13:15', '@onefive'],
		['13:15', '13:35', '江籠裕奈'],
		['14:05', '14:35', 'みらくらぱーく！ from 蓮ノ空女学院スクールアイドルクラブ'],
		['14:45', '15:10', 'REIRIE'], ['15:10', '15:35', 'ラフ×ラフ'],
		['15:35', '16:00', 'ほくりくアイドル部'], ['16:00', '16:25', 'Rain Tree'],
		['16:25', '16:45', 'NEVER END ROLL'], ['17:00', '17:30', 'Pixel Ribbon'],
		['17:45', '18:05', 'Peel the Apple'], ['18:05', '18:25', 'AsIs'],
		['18:25', '18:45', 'マジカル・パンチライン'], ['18:45', '19:05', 'KAWAII LAB. SOUTH'],
		['19:20', '19:40', 'Onephony'], ['19:40', '20:00', 'カラフルスクリーム'],
		['20:00', '20:20', 'ドラマチックレコード'], ['20:20', '20:40', 'Task have Fun']
	]),
	...timetableItems('kagayaki-eight', [
		['11:00', '11:20', 'PinkySpice'], ['11:20', '11:40', 'himawari（船橋）'],
		['11:40', '12:00', 'Shibu3 project'], ['12:00', '12:20', '君と見るそら'],
		['12:25', '12:45', 'MyDresscode'], ['12:45', '13:05', 'LIT MOON'],
		['13:05', '13:25', '#よーよーよー'], ['13:25', '13:45', '点染テンセイ少女。'],
		['13:45', '14:05', 'マジカル・パンチライン'], ['14:25', '14:45', 'Toi Toi Toi'],
		['14:45', '15:05', 'HelloYouth'], ['15:05', '15:25', '背越しのアンサンブル'],
		['15:25', '15:45', 'クマリデパート'], ['15:45', '16:05', 'OS☆U'],
		['16:10', '16:30', '江籠裕奈'], ['16:30', '16:50', 'KAWAII LAB. MATES'],
		['16:50', '17:10', '@onefive'], ['17:10', '17:30', 'AQUAPLANET'],
		['17:30', '17:50', 'フューチャーサイダー'], ['17:50', '18:10', 'ideal peco'],
		['18:30', '18:50', 'RePLAY'], ['18:50', '19:10', 'MAGICAL SPEC'],
		['19:10', '19:30', 'さとりモンスター'], ['19:35', '19:55', 'feelNEO'],
		['19:55', '20:15', 'MixVeil'], ['20:15', '20:35', 'log you'], ['20:35', '20:55', '#Mooove!']
	]),
	...timetableItems('kagayaki-redsun', [
		['11:00', '11:20', 'ROAD TO 東京 3位'], ['11:20', '11:40', 'ROAD TO 東京 2位'],
		['11:40', '12:00', '.LiNIXLiNE.'], ['12:00', '12:20', 'AIWO'],
		['12:25', '12:45', 'すべての瞬間は君だった。'], ['12:45', '13:05', 'シャルロット'],
		['13:05', '13:25', 'log you'], ['13:25', '13:45', 'アイドルカレッジ'],
		['13:45', '14:05', 'フューチャーサイダー'], ['14:25', '14:45', 'ドラマチックレコード'],
		['14:45', '15:05', '#Mooove!'], ['15:05', '15:25', 'メルクマールメルマール'],
		['15:25', '15:45', 'さとりモンスター'], ['15:45', '16:05', 'selfish'],
		['16:10', '16:30', '感情線は時をこえて'], ['16:30', '16:50', 'びっくえんじぇる'],
		['16:50', '17:10', '点染テンセイ少女。'], ['17:10', '17:30', 'Merry Mellow'],
		['17:30', '17:50', 'ぜろから☆すた→と'], ['17:50', '18:10', 'XINXIN'],
		['18:30', '18:50', '#よーよーよー'], ['18:50', '19:10', 'SAI²Rium'],
		['19:10', '19:30', 'いつかの夜に僕たちが、'], ['19:35', '19:55', '絶対少女'],
		['19:55', '20:15', 'HAPPY CREATORS'], ['20:15', '20:35', 'Hey!Mommy!'],
		['20:35', '20:55', 'なんキニ！']
	]),
	...timetableItems('kagayaki-az', [
		['11:00', '11:20', 'めろでぃらびっと'], ['11:20', '11:40', 'i Moon'],
		['11:40', '12:00', 'ぜろから☆すた→と'], ['12:00', '12:20', 'SPRISE'],
		['12:25', '12:45', '感情線は時をこえて'], ['12:45', '13:05', 'メイビーME'],
		['13:05', '13:25', 'Melty BeaR'], ['13:25', '13:45', 'AQUAPLANET'],
		['13:45', '14:05', 'XINXIN'], ['14:25', '14:45', 'RePLAY'],
		['14:45', '15:05', '最終未来少女'], ['15:05', '15:25', '.LiNIXLiNE.'],
		['15:25', '15:45', 'いつかの夜に僕たちが、'], ['15:45', '16:05', 'AIWO'],
		['16:10', '16:30', 'MyDresscode'], ['16:30', '16:50', 'べるべっとセンテンス'],
		['16:50', '17:10', 'COzMIC ぱれーど'], ['17:10', '17:30', 'ROAD TO 東京 1位'],
		['17:30', '17:50', '遥か、彼方。'], ['17:50', '18:10', 'ファーストプレイリスト'],
		['18:30', '18:50', 'ai*ai'], ['18:50', '19:10', '背越しのアンサンブル'],
		['19:10', '19:30', 'あまいものつめあわせ'], ['19:35', '19:55', '島なるプレリュード'],
		['19:55', '20:15', '君とのシナリオ'], ['20:15', '20:35', '踊れ！神風'],
		['20:35', '20:55', 'Loulouchouchou']
	]),
	...timetableItems('kagayaki-gold-creek', [
		['11:00', '11:20', 'リリシック学園'], ['11:20', '11:40', '&youth!'],
		['11:40', '12:00', 'このアイドルはフィクションです。'], ['12:00', '12:20', 'お願い!!フルハウス'],
		['12:25', '12:45', '踊れ！神風'], ['12:45', '13:05', 'STARRY×NIGHT↗'],
		['13:05', '13:25', 'ルシフェルの園。'], ['13:25', '13:45', 'にっぽんワチャチャ'],
		['13:45', '14:05', '猫の眼に宇宙'], ['14:25', '14:45', 'ROY Limited GIRLFRIEND'],
		['14:45', '15:05', 'YUGUREMI'], ['15:05', '15:25', 'SAI²Rium'],
		['15:25', '15:45', 'PinkySpice'], ['15:45', '16:05', 'SAKURADOLL'],
		['16:10', '16:30', 'himawari（船橋）'], ['16:30', '16:50', 'ハレとハレ！'],
		['16:50', '17:10', 'ツキナミ'], ['17:10', '17:30', 'tune time capsule'],
		['17:30', '17:50', 'BANZAI JAPAN'], ['17:50', '18:10', 'HOT DOG CAT'],
		['18:30', '18:50', 'SAY-LA'], ['18:50', '19:10', 'エイアイカ'],
		['19:10', '19:30', 'mementoa'], ['19:35', '19:55', 'メルクマールメルマール'],
		['19:55', '20:15', '八木沙季'], ['20:15', '20:35', 'いつだって青い春。'],
		['20:35', '20:55', 'Lollipop♡CHU']
	]),
	...timetableItems('kagayaki-double', [
		['11:00', '11:20', 'ROAD TO 東京 5位'], ['11:20', '11:40', 'ROAD TO 東京 4位'],
		['11:40', '12:00', 'ZooZooZoo'], ['12:00', '12:20', 'けっぱって東北'],
		['12:25', '12:45', 'キュン!?恋堕ちキューピッド'], ['12:45', '13:05', 'すてねこキャッツ'],
		['13:05', '13:25', 'SAY-LA'], ['13:25', '13:45', 'べるべっとセンテンス'],
		['13:45', '14:05', 'すーぱーぷーばぁー!!'], ['14:25', '14:45', 'ファーストプレイリスト'],
		['14:45', '15:05', 'シオリベル'], ['15:05', '15:25', 'KissBee'],
		['15:25', '15:45', 'SPRISE'], ['15:45', '16:05', 'mementoa'],
		['16:10', '16:30', '石川元気応援隊ジャンピン'], ['16:30', '16:50', 'お願い!!フルハウス'],
		['16:50', '17:10', 'Nody'], ['17:10', '17:30', 'ミニワチャ'],
		['17:30', '17:50', '猫の眼に宇宙'], ['17:50', '18:10', 'Coloration'],
		['18:30', '18:50', 'ROY Limited GIRLFRIEND'], ['18:50', '19:10', 'TERIOS'],
		['19:10', '19:30', 'YUGUREMI'], ['19:35', '19:55', 'CØCØRIZE'],
		['19:55', '20:15', 'このアイドルはフィクションです。'],
		['20:15', '20:35', 'ギガLOVEアップビート'], ['20:35', '20:55', 'おちゃメンタル☆パーティー']
	]),
	...timetableItems('kagayaki-education', [
		['11:00', '11:25', 'ほくりくアイドル部'], ['11:30', '11:50', 'ハレとハレ！'],
		['11:50', '12:10', 'SAKURADOLL'], ['12:15', '12:35', '遥か、彼方。'],
		['12:35', '12:55', 'Hey!Mommy!'], ['12:55', '13:15', 'びっくえんじぇる'],
		['13:15', '13:40', 'OS☆U'], ['14:00', '14:20', 'ideal peco'],
		['14:20', '14:40', 'Loulouchouchou'], ['14:40', '15:00', 'あまいものつめあわせ'],
		['15:00', '15:20', 'Shibu3 project'], ['15:20', '15:40', '島なるプレリュード'],
		['15:45', '16:10', 'テラテラ'], ['16:15', '16:35', 'メイビーME'],
		['16:35', '16:55', 'Melty BeaR'], ['16:55', '17:15', 'STARRY×NIGHT↗'],
		['17:15', '17:35', 'すべての瞬間は君だった。'], ['17:55', '18:15', 'Toi Toi Toi'],
		['18:15', '18:35', 'シャルロット'], ['18:35', '18:55', '君と見るそら'],
		['18:55', '19:15', 'すてねこキャッツ'], ['19:15', '19:35', 'アイドルカレッジ']
	]),
	...timetableItems('kagayaki-katamachi', [
		['11:00', '11:20', 'LIMITLESS PINK'], ['11:20', '11:40', 'ミニワチャ'],
		['11:40', '12:00', 'Lollipop♡CHU'], ['12:00', '12:20', '八木沙季'],
		['12:25', '12:45', 'ほくりくアイドル部next'], ['12:45', '13:05', 'tune time capsule'],
		['13:05', '13:25', 'ギガLOVEアップビート'], ['13:25', '13:45', 'エイアイカ'],
		['13:45', '14:15', 'かがやきパーク企画ステージ'], ['14:35', '14:55', 'ai*ai'],
		['14:55', '15:15', 'おちゃメンタル☆パーティー'], ['15:15', '15:35', 'TERIOS'],
		['15:35', '15:55', 'けっぱって東北'], ['15:55', '16:15', 'ESTLINK☆'],
		['16:20', '16:40', 'キュン!?恋堕ちキューピッド'], ['16:40', '17:00', 'にっぽんワチャチャ'],
		['17:00', '17:20', 'wonder channel'], ['17:20', '17:40', 'ルシフェルの園。'],
		['17:40', '18:00', 'More Sisters'], ['18:00', '18:20', 'やれてき!!']
	])
];

const kagayakiTokutenItems: ScheduleItem[] = [
	...timetableItems('kagayaki-2f-conference', [
		['12:15', '13:15', 'クマリデパート'], ['13:50', '14:50', 'Switch Drop'],
		['17:00', '18:00', 'REIRIE'], ['18:10', '19:10', 'Pixel Ribbon']
	]).map((item) => ({ ...item, boothId: 'A' })),
	...timetableItems('kagayaki-2f-conference', [
		['12:15', '13:15', 'selfish'], ['13:50', '14:50', 'KAWAII LAB. MATES'],
		['17:00', '18:00', 'ラフ×ラフ'], ['19:30', '20:30', 'AsIs']
	]).map((item) => ({ ...item, id: `kagayaki-2f-conference-b-${item.id}`, boothId: 'B' })),
	...timetableItems('kagayaki-2f-conference', [
		['12:15', '13:15', 'マリークラウン'], ['13:50', '14:50', '@onefive'],
		['17:00', '18:00', 'ほくりくアイドル部'], ['19:30', '20:30', 'マジカル・パンチライン']
	]).map((item) => ({ ...item, id: `kagayaki-2f-conference-c-${item.id}`, boothId: 'C' })),
	...timetableItems('kagayaki-2f-lobby', [
		['13:50', '14:50', '江籠裕奈'], ['17:00', '18:00', 'Rain Tree'],
		['18:10', '19:10', 'カラフルスクリーム'], ['19:30', '20:30', 'KAWAII LAB. SOUTH']
	]).map((item) => ({ ...item, boothId: 'E' })),
	...timetableItems('kagayaki-2f-lobby', [
		['17:00', '18:00', 'NEVER END ROLL'], ['18:45', '19:45', 'Task have Fun']
	]).map((item) => ({ ...item, id: `kagayaki-2f-lobby-f-${item.id}`, boothId: 'F' })),
	...timetableItems('kagayaki-3f-practice', [
		['12:45', '13:45', 'Shibu3 project'], ['13:50', '14:50', 'LIT MOON'],
		['14:50', '15:50', 'マジカル・パンチライン'], ['16:10', '17:10', '背越しのアンサンブル'],
		['17:15', '18:15', '江籠裕奈'], ['18:15', '19:15', 'AQUAPLANET'],
		['19:35', '20:35', 'RePLAY'], ['20:40', '21:40', 'feelNEO']
	]).map((item) => ({ ...item, boothId: 'G' })),
	...timetableItems('kagayaki-3f-practice', [
		['15:40', '16:40', 'MixVeil'], ['16:50', '17:50', 'log you'],
		['18:00', '19:00', '#Mooove!'], ['19:10', '20:10', '最終未来少女']
	]).map((item) => ({ ...item, id: `kagayaki-3f-practice-h-${item.id}`, boothId: 'H' })),
	...timetableItems('kagayaki-3f-practice', [
		['15:40', '16:40', '君とのシナリオ'], ['16:50', '17:50', '踊れ！神風'],
		['18:00', '19:00', 'Loulouchouchou'], ['19:10', '20:10', 'シオリベル']
	]).map((item) => ({ ...item, id: `kagayaki-3f-practice-i-${item.id}`, boothId: 'I' })),
	...timetableItems('kagayaki-3f-conference', [
		['12:05', '13:05', 'リリシック学園'], ['13:05', '14:05', 'お願い!!フルハウス'],
		['15:30', '16:30', 'ROY Limited GIRLFRIEND'], ['17:35', '18:35', 'ハレとハレ！'],
		['19:35', '20:35', 'SAY-LA']
	]).map((item) => ({ ...item, boothId: 'J' })),
	...timetableItems('kagayaki-3f-conference', [
		['12:25', '13:25', '&youth!'], ['13:30', '14:30', '踊れ！神風'],
		['15:50', '16:50', 'YUGUREMI'], ['17:55', '18:55', 'ツキナミ'],
		['19:55', '20:55', 'エイアイカ']
	]).map((item) => ({ ...item, id: `kagayaki-3f-conference-k-${item.id}`, boothId: 'K' })),
	...timetableItems('kagayaki-3f-conference', [
		['12:45', '13:45', 'このアイドルはフィクションです。'], ['13:50', '14:50', 'STARRY×NIGHT↗'],
		['16:10', '17:10', 'SAI²Rium'], ['18:15', '19:15', 'tune time capsule']
	]).map((item) => ({ ...item, id: `kagayaki-3f-conference-l-${item.id}`, boothId: 'L' })),
	...timetableItems('kagayaki-3f-conference', [
		['15:40', '16:40', '八木沙季'], ['16:50', '17:50', 'いつだって青い春。'],
		['18:00', '19:00', 'Lollipop♡CHU'], ['19:10', '20:10', 'すーぱーぷーばぁー!!']
	]).map((item) => ({ ...item, id: `kagayaki-3f-conference-m-${item.id}`, boothId: 'M' })),
	...timetableItems('kagayaki-2f-5th', [
		['20:20', '21:20', 'アイドルカレッジ']
	]),
	...timetableItems('kagayaki-2f-6th', [
		['12:05', '13:05', 'LIMITLESS PINK'], ['13:05', '14:05', '八木沙季'],
		['14:10', '15:10', 'ギガLOVEアップビート'], ['16:00', '17:00', 'おちゃメンタル☆パーティー'],
		['18:45', '19:45', 'More Sisters']
	]).map((item) => ({ ...item, boothId: 'O' })),
	...timetableItems('kagayaki-2f-6th', [
		['12:25', '13:25', 'ミニワチャ'], ['13:50', '14:50', 'tune time capsule'],
		['16:20', '17:20', 'TERIOS'], ['17:25', '18:25', 'キュン!?恋堕ちキューピッド']
	]).map((item) => ({ ...item, id: `kagayaki-2f-6th-p-${item.id}`, boothId: 'P' })),
	...timetableItems('kagayaki-2f-6th', [
		['12:45', '13:45', 'Lollipop♡CHU'], ['13:50', '14:50', 'tune time capsule'],
		['15:40', '16:40', 'ai*ai'], ['16:40', '17:40', 'けっぱって東北'],
		['17:45', '18:45', 'にっぽんワチャチャ'], ['18:45', '19:45', 'More Sisters']
	]).map((item) => ({ ...item, id: `kagayaki-2f-6th-q-${item.id}`, boothId: 'Q' })),
	...timetableItems('kagayaki-2f-8th', [
		['15:45', '16:45', 'このアイドルはフィクションです。'], ['16:50', '17:50', 'ギガLOVEアップビート'],
		['18:00', '19:00', 'おちゃメンタル☆パーティー'], ['19:10', '20:10', 'ESTLINK☆']
	]),
	...timetableItems('kagayaki-eight-4f', [
		['12:05', '13:05', 'PinkySpice'], ['13:05', '14:05', '君と見るそら'],
		['14:10', '15:10', '#よーよーよー'], ['15:30', '16:30', 'Toi Toi Toi'],
		['16:30', '17:30', 'クマリデパート'], ['18:35', '19:35', 'フューチャーサイダー'],
		['19:55', '20:55', 'MAGICAL SPEC']
	]).map((item) => ({ ...item, boothId: 'S' })),
	...timetableItems('kagayaki-eight-4f', [
		['12:25', '13:25', 'himawari（船橋）'], ['13:30', '14:30', 'MyDresscode'],
		['14:30', '15:30', '点染テンセイ少女。'], ['15:50', '16:50', 'HelloYouth'],
		['16:50', '17:50', 'OS☆U'], ['18:55', '19:55', 'ideal peco'],
		['20:15', '21:15', 'さとりモンスター']
	]).map((item) => ({ ...item, id: `kagayaki-eight-4f-t-${item.id}`, boothId: 'T' })),
	...timetableItems('kagayaki-redsun-lobby', [
		['16:00', '17:00', 'シャルロット'], ['20:00', '21:00', 'すてねこキャッツ']
	]),
	...timetableItems('kagayaki-az-parking', [
		['12:05', '13:05', 'めろでぃらびっと'], ['13:05', '14:05', 'SPRISE'],
		['14:10', '15:10', 'Melty BeaR'], ['15:30', '16:30', 'RePLAY'],
		['16:30', '17:30', 'いつかの夜に僕たちが、'], ['17:35', '18:35', 'べるべっとセンテンス'],
		['18:50', '19:50', '遥か、彼方。'], ['20:10', '21:10', '背越しのアンサンブル']
	]).map((item) => ({ ...item, boothId: 'V' })),
	...timetableItems('kagayaki-az-parking', [
		['12:25', '13:25', 'i Moon'], ['13:30', '14:30', '感情線は時をこえて'],
		['14:30', '15:30', 'AQUAPLANET'], ['15:50', '16:50', '最終未来少女'],
		['16:50', '17:50', 'AIWO'], ['17:55', '18:55', 'COzMIC ぱれーど'],
		['20:15', '21:15', 'あまいものつめあわせ']
	]).map((item) => ({ ...item, id: `kagayaki-az-parking-w-${item.id}`, boothId: 'W' })),
	...timetableItems('kagayaki-az-g-studio', [
		['12:45', '13:45', 'ぜろから☆すた→と'], ['13:50', '14:50', 'メイビーME'],
		['14:50', '15:50', 'XINXIN'], ['16:10', '17:10', '.LiNIXLiNE.'],
		['17:15', '18:15', 'MyDresscode'], ['18:15', '19:15', 'ROAD TO 東京1位'],
		['19:35', '20:35', 'ai*ai'], ['20:40', '21:40', '島なるプレリュード']
	]),
	...timetableItems('kagayaki-double-2f', [
		['12:05', '13:05', 'ROAD TO 東京5位'], ['13:05', '14:05', 'けっぱって東北'],
		['14:10', '15:10', 'SAY-LA'], ['15:30', '16:30', 'ファーストプレイリスト'],
		['16:30', '17:30', 'SPRISE'], ['17:35', '18:35', 'お願い!!フルハウス'],
		['18:35', '19:35', '猫の眼に宇宙'], ['19:55', '20:55', 'TERIOS']
	]).map((item) => ({ ...item, boothId: 'Y' })),
	...timetableItems('kagayaki-double-2f', [
		['12:25', '13:25', 'ROAD TO 東京4位'], ['13:30', '14:30', 'キュン!?恋堕ちキューピッド'],
		['14:30', '15:30', 'べるべっとセンテンス'], ['15:50', '16:50', 'シオリベル'],
		['16:50', '17:50', 'mementoa'], ['17:55', '18:55', 'Nody'],
		['18:55', '19:55', 'Coloration'], ['20:15', '21:15', 'YUGUREMI']
	]).map((item) => ({ ...item, id: `kagayaki-double-2f-z-${item.id}`, boothId: 'Z' })),
	...timetableItems('kagayaki-double-2f', [
		['12:45', '13:45', 'ZooZooZoo'], ['13:50', '14:50', 'すてねこキャッツ'],
		['14:50', '15:50', 'すーぱーぷーばぁー!!'], ['16:10', '17:10', 'KissBee'],
		['17:15', '18:15', '石川元気応援隊ジャンピン'], ['18:15', '19:15', 'ミニワチャ'],
		['19:35', '20:35', 'ROY Limited GIRLFRIEND'], ['20:40', '21:40', 'CØCØRIZE']
	]).map((item) => ({ ...item, id: `kagayaki-double-2f-aa-${item.id}`, boothId: 'AA' })),
	...timetableItems('kagayaki-education-lobby', [
		['11:40', '12:40', 'ほくりくアイドル部'], ['13:55', '14:55', 'OS☆U'], ['16:25', '17:25', 'テラテラ']
	]),
	...timetableItems('kagayaki-education-2f', [
		['12:35', '13:35', 'ハレとハレ！'], ['13:40', '14:40', 'Hey!Mommy!'],
		['15:25', '16:25', 'Loulouchouchou'], ['16:25', '17:25', '島なるプレリュード'],
		['18:00', '19:00', 'STARRY×NIGHT↗']
	]).map((item) => ({ ...item, boothId: 'AD' })),
	...timetableItems('kagayaki-education-2f', [
		['12:55', '13:55', 'SAKURADOLL'], ['14:00', '15:00', 'びっくえんじぇる'],
		['15:45', '16:45', 'あまいものつめあわせ'], ['17:20', '18:20', 'メイビーME'],
		['18:20', '19:20', 'すべての瞬間は君だった。']
	]).map((item) => ({ ...item, id: `kagayaki-education-2f-ae-${item.id}`, boothId: 'AE' })),
	...timetableItems('kagayaki-education-2f', [
		['12:45', '13:45', '.LiNIXLiNE.'], ['13:50', '14:50', 'シャルロット'],
		['14:50', '15:50', 'フューチャーサイダー'], ['16:10', '17:10', 'メルクマールメルマール'],
		['17:15', '18:15', '感情線は時をこえて'], ['18:15', '19:15', 'Merry Mellow'],
		['19:35', '20:35', '#よーよーよー'], ['20:40', '21:40', '絶対少女']
	]).map((item) => ({ ...item, id: `kagayaki-education-2f-af-${item.id}`, boothId: 'AF' })),
	...timetableItems('kagayaki-harmonie-1f', [
		['12:45', '13:45', '.LiNIXLiNE.'], ['13:50', '14:50', 'シャルロット'],
		['14:50', '15:50', 'フューチャーサイダー'], ['16:10', '17:10', 'メルクマールメルマール'],
		['17:15', '18:15', '感情線は時をこえて'], ['18:15', '19:15', 'Merry Mellow'],
		['19:35', '20:35', '#よーよーよー'], ['20:40', '21:40', '絶対少女']
	]).map((item) => ({ ...item, boothId: 'AG' })),
	...timetableItems('kagayaki-harmonie-1f', [
		['15:40', '16:40', 'HAPPY CREATORS'], ['16:50', '17:50', 'Hey!Mommy!'],
		['18:00', '19:00', 'なんキニ！'], ['19:10', '20:10', 'KissBee']
	]).map((item) => ({ ...item, id: `kagayaki-harmonie-1f-ah-${item.id}`, boothId: 'AH' })),
	...timetableItems('kagayaki-harmonie-2f', [
		['12:05', '13:05', 'ROAD TO 東京3位'], ['13:05', '14:05', 'AIWO'],
		['14:10', '15:10', 'log you'], ['15:30', '16:30', 'ドラマチックレコード'],
		['16:30', '17:30', 'さとりモンスター'], ['17:35', '18:35', 'びっくえんじぇる'],
		['18:35', '19:35', 'ぜろから☆すた→と'], ['19:55', '20:55', 'SAI²Rium']
	]).map((item) => ({ ...item, boothId: 'AI' })),
	...timetableItems('kagayaki-harmonie-2f', [
		['12:25', '13:25', 'ROAD TO 東京2位'], ['13:30', '14:30', 'すべての瞬間は君だった。'],
		['14:30', '15:30', 'アイドルカレッジ'], ['15:50', '16:50', '#Mooove!'],
		['16:50', '17:50', 'selfish'], ['17:55', '18:55', '点染テンセイ少女。'],
		['18:55', '19:55', 'XINXIN'], ['20:15', '21:15', 'いつかの夜に僕たちが、']
	]).map((item) => ({ ...item, id: `kagayaki-harmonie-2f-aj-${item.id}`, boothId: 'AJ' }))
];

function linkItemsWithMatchingMainContent(items: ScheduleItem[]): ScheduleItem[] {
	const idsByMainContent = new Map<string, string[]>();
	for (const item of items) {
		const mainContent = item.artistLabel.normalize('NFKC').trim();
		if (!mainContent) continue;
		const matchingIds = idsByMainContent.get(mainContent) ?? [];
		matchingIds.push(item.id);
		idsByMainContent.set(mainContent, matchingIds);
	}
	return items.map((item) => {
		const mainContent = item.artistLabel.normalize('NFKC').trim();
		const matchingIds = idsByMainContent.get(mainContent) ?? [];
		return {
			...item,
			pairedTokutenItemIds: [...new Set([...item.pairedTokutenItemIds, ...matchingIds])].filter(
				(id) => id !== item.id
			)
		};
	});
}

export const KAGAYAKI_FES_DAY_ONE: Festival = {
	id: 'kagayaki-fes-2026-day-1',
	title: 'かがやきフェス 2026 · 1日目',
	timezone: 'Asia/Tokyo',
	artistDirectory: [],
	days: [
		{
			id: 'kagayaki-fes-2026-10-03',
			date: '2026-10-03',
			openingMinute: 630,
			displayStartMinute: 600,
			displayEndMinute: 1320,
			lanes: [...kagayakiStageLanes, ...kagayakiTokutenLanes],
			items: linkItemsWithMatchingMainContent([...kagayakiStageItems, ...kagayakiTokutenItems])
		}
	],
	updatedAt: '2026-10-03T00:00:00.000Z'
};

export const BUNDLED_FESTIVALS: Festival[] = [SAMPLE_FESTIVAL, KAGAYAKI_FES_DAY_ONE];

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
