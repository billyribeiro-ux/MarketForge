<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<svelte:head>
	<title>Sign out — MarketForge</title>
</svelte:head>

<article class="card">
	<h1>Sign out</h1>
	<form method="POST" use:enhance>
		<button type="submit" class="btn">Sign out</button>
	</form>
	<p class="muted"><a href="/">Cancel</a></p>
</article>

<style>
	.card {
		inline-size: min(100%, 20rem);
		padding: var(--space-xl);
		border-radius: var(--radius-md);
		background: var(--color-surface-0);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}
	h1 {
		margin: 0 0 var(--space-lg);
		font-size: var(--text-xl);
		font-weight: 600;
	}
	.btn {
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.muted {
		margin-block-start: var(--space-md);
		font-size: var(--text-sm);
	}
	.muted a {
		color: var(--color-primary);
	}
</style>
