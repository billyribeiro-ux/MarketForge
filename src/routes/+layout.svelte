<script lang="ts">
	import '$lib/styles/tokens.css';
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';
	import { navigating } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const isNavigating = $derived(navigating.to !== null);

	$effect(() => {
		if (!browser || typeof data.workspaceRoot !== 'string') return;
		document.documentElement.setAttribute('data-workspace-root', data.workspaceRoot);
		return () => {
			document.documentElement.removeAttribute('data-workspace-root');
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if data.plausibleDomain}
		<script defer data-domain={data.plausibleDomain} src={data.plausibleScriptSrc}></script>
	{/if}
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
<div class="nav-progress" aria-hidden="true" data-active={isNavigating}></div>

{@render children()}

<style>
	.nav-progress {
		position: fixed;
		inset-block-start: 0;
		inset-inline: 0;
		block-size: 2px;
		background: var(--color-primary);
		transform-origin: left;
		transform: scaleX(0);
		opacity: 0;
		transition:
			transform var(--duration-slow) var(--ease-out-expo),
			opacity var(--duration-fast) ease-out;
		z-index: 10000;
		pointer-events: none;
	}
	.nav-progress[data-active='true'] {
		transform: scaleX(0.8);
		opacity: 1;
	}
	@media (prefers-reduced-motion: reduce) {
		.nav-progress {
			transition: opacity var(--duration-fast) ease-out;
			transform: scaleX(1);
		}
	}
</style>
