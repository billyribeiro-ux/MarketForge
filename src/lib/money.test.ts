import { describe, expect, it } from 'vitest';

import { formatMoney } from './money';

describe(`formatMoney`, () => {
	it(`formats USD cents`, () => {
		expect(formatMoney(1299, `usd`)).toMatch(/\$12\.99/);
	});

	it(`formats zero`, () => {
		expect(formatMoney(0, `usd`)).toMatch(/\$0\.00/);
	});
});
