export function formatMinute(minute: number): string {
	return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

export function parseMinute(value: string): number {
	const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
	return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export function normalizeTimeText(value: string, maxHour = 30): string | null {
	const input = value.trim();
	let hour: number;
	let minute: number;
	const colonMatch = input.match(/^(\d{1,2}):(\d{2})$/);
	if (colonMatch) {
		hour = Number(colonMatch[1]);
		minute = Number(colonMatch[2]);
	} else if (/^\d{3,4}$/.test(input)) {
		hour = Number(input.slice(0, -2));
		minute = Number(input.slice(-2));
	} else return null;
	if (hour > maxHour || minute > 59 || (hour === maxHour && minute !== 0)) return null;
	return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function minuteToY(minute: number, startMinute: number, timeZoom: number): number {
	return ((minute - startMinute) / 60) * timeZoom;
}

export function minuteFromPointer(
	event: PointerEvent,
	target: HTMLElement,
	startMinute: number,
	timeZoom: number,
	snapMinutes: number,
	snap: (minute: number, step: number) => number
): number {
	const rect = target.getBoundingClientRect();
	return snap(startMinute + ((event.clientY - rect.top) / timeZoom) * 60, snapMinutes);
}
