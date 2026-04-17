/** Format a Stripe-style integer amount (e.g. cents) for display. */
export function formatMoney(unitAmount: number, currency: string): string {
	return new Intl.NumberFormat(undefined, {
		style: `currency`,
		currency: currency.toUpperCase(),
	}).format(unitAmount / 100);
}
