import { describe, expect, it } from 'vitest';
import { displayLaneWidth, resolvedLaneBaseWidth } from './lane-width';
import type { Lane, LaneTypeWidths } from '$lib/types';

const widths: LaneTypeWidths = { stage: 152, tokuten: 168, event: 140 };

describe('lane widths', () => {
	it('inherits the configured type width by default', () => {
		const lane: Lane = { id: 'stage', name: 'メイン', type: 'stage' };
		expect(resolvedLaneBaseWidth(lane, 'type', widths)).toBe(152);
	});

	it('uses a lane override only in individual width mode', () => {
		const lane: Lane = { id: 'event', name: 'インフォ', type: 'event', width: 220 };
		expect(resolvedLaneBaseWidth(lane, 'type', widths)).toBe(140);
		expect(resolvedLaneBaseWidth(lane, 'individual', widths)).toBe(220);
	});

	it('applies the three-booth display multiplier after resolving the base width', () => {
		const lane: Lane = {
			id: 'tokuten',
			name: '特典会',
			type: 'tokuten',
			width: 200,
			booths: ['A', 'B', 'C']
		};
		expect(displayLaneWidth(lane, 'individual', widths)).toBe(300);
	});
});
