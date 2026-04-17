<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? `Something went wrong`);
</script>

<svelte:head>
	<title>{status} — MarketForge</title>
</svelte:head>

<section class="wrap">
	<p class="code">{status}</p>
	<h1>{status === 404 ? `Section not found` : `Couldn’t load this section`}</h1>
	<p class="msg">{message}</p>
	<p class="actions">
		<a class="btn primary" href="/app">Back to dashboard</a>
		<a class="btn" href="/support">Contact support</a>
	</p>
</section>

<style>
	.wrap {
		max-inline-size: 36rem;
		padding: var(--space-2xl) 0;
	}
	.code {
		margin: 0 0 var(--space-sm);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
	}
	h1 {
		margin: 0 0 var(--space-md);
		font-size: var(--text-2xl);
		line-height: var(--leading-tight);
	}
	.msg {
		margin: 0 0 var(--space-xl);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
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
