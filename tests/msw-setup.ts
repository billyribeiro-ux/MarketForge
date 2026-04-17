import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

/** Example handler for parallel frontend work — extend with Stripe/Resend mocks as needed. */
export const testMswServer = setupServer(
	http.get(`https://example.com/__msw_health`, () =>
		HttpResponse.json({ ok: true }),
	),
);

beforeAll(() => {
	testMswServer.listen({ onUnhandledRequest: `bypass` });
});

afterEach(() => {
	testMswServer.resetHandlers();
});

afterAll(() => {
	testMswServer.close();
});
