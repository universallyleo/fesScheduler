/** Text shown between the decrement and increment buttons. */
export function intervalDeltaText(value: number, displayValue = false): string {
	return displayValue ? `${value}分` : '5分';
}
