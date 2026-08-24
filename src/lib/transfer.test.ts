import { describe, expect, it } from 'vitest';
import { createTransferDocument, parseTransferDocument } from './transfer';
import type { Festival } from './types';

const festival: Festival = {
	id: 'local-1',
	title: 'Demo Fest',
	timezone: 'Asia/Tokyo',
	artistDirectory: [],
	days: [],
	updatedAt: '2026-08-24T00:00:00.000Z'
};

describe('transfer documents', () => {
	it('round-trips a versioned festival document', () => {
		const text = createTransferDocument(festival);
		const result = parseTransferDocument(text);
		expect(result.ok).toBe(true);
		if (result.ok)
			expect(result.festival).toMatchObject({ title: 'Demo Fest', timezone: 'Asia/Tokyo' });
	});

	it('rejects malformed or unsupported documents before storage', () => {
		expect(parseTransferDocument('{"schemaVersion":99}')).toMatchObject({ ok: false });
		expect(parseTransferDocument('not json')).toMatchObject({ ok: false });
	});
});
