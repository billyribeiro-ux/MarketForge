<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? `Something went wrong`);
	const isNotFound = $derived(status === 404);
</script>

<svelte:head>
	<title>{status} — MarketForge</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="wrap" id="main" tabindex="-1">
	<p class="code">{status}</p>
	<h1>{isNotFound ? `Page not found` : `Something went wrong`}</h1>
	<p class="msg">{message}</p>
	<p class="actions">
		<a class="btn primary" href="/">Return home</a>
		{#if !isNotFound}
			<a class="btn" href="/support">Contact support</a>
		{/if}
	</p>
</main>

<style>
	.wrap {
		max-inline-size: 36rem;
		margin-inline: auto;
		padding: var(--space-4xl) var(--space-lg);
		font-family: var(--font-sans);
		color: var(--color-text);
		text-align: center;
	}
	.wrap:focus {
		outline: none;
	}
	.code {
		margin: 0 0 var(--space-md);
		font-family: var(--font-mono);
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
	}
	h1 {
		margin: 0 0 var(--space-md);
		font-size: var(--text-3xl);
		line-height: var(--leading-tight);
	}
	.msg {
		margin: 0 0 var(--space-2xl);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.actions {
		display: inline-flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		justify-content: center;
		margin: 0;
	}
	.btn {
		display: inline-block;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface-1);
		color: var(--color-text);
		text-decoration: none;
		font-weight: 600;
		font-size: var(--text-sm);
	}
	.btn.primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-color: transparent;
	}
</style>
