<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="auth-shell" id="main" tabindex="-1">
	{@render children()}
</main>

<style>
	.auth-shell {
		min-block-size: 100dvb;
		display: grid;
		place-items: center;
		padding: var(--space-lg);
		background: var(--color-surface-1);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: var(--text-md);
		line-height: var(--leading-normal);
	}
	.auth-shell:focus {
		outline: none;
	}
</style>
