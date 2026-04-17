import { Agentation } from 'sv-agentation';
import { mount } from 'svelte';

let mounted = false;

export function mountAgentationInspector(workspaceRoot: string): void {
	if (mounted) return;
	mounted = true;
	mount(Agentation, {
		target: document.body,
		props: { workspaceRoot, openSourceOnClick: true },
	});
}
