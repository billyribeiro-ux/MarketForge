import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Keeps `sv-agentation` out of the production client bundle (dev-only inspector). */
function agentationProductionStub(): Plugin {
	const stub = path.resolve(__dirname, 'src/lib/dev/agentation-client.stub.ts');
	return {
		name: 'marketforge-agentation-stub',
		enforce: 'pre',
		resolveId(id) {
			if (id.includes('agentation-client.stub')) return null;
			const n = id.split(path.sep).join('/');
			if (
				n === '$lib/dev/agentation-client' ||
				n.endsWith('/lib/dev/agentation-client.ts') ||
				n.endsWith('/lib/dev/agentation-client')
			) {
				return stub;
			}
			return null;
		},
	};
}

export default defineConfig(({ mode }) => ({
	plugins: [
		...(mode === `production` || process.env.MARKETFORGE_E2E === `1`
			? [agentationProductionStub()]
			: []),
		sveltekit(),
	],
}));
