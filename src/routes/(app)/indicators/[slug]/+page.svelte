<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.indicator.title} — Indicator Vault</title>
</svelte:head>

<article>
	<h1>{data.indicator.title}</h1>
	{#if data.indicator.description}
		<p class="lead">{data.indicator.description}</p>
	{/if}
	<div class="downloads">
		<a class="btn" href="/indicators/{data.indicator.slug}/download?format=pine">Download Pine Script</a>
		<a class="btn secondary" href="/indicators/{data.indicator.slug}/download?format=thinkscript"
			>Download ThinkScript</a
		>
	</div>
</article>

<style>
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-md);
	}
	.lead {
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0 0 var(--space-xl);
	}
	.downloads {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
	}
	.btn {
		display: inline-block;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		text-decoration: none;
		font-weight: 600;
		font-size: var(--text-sm);
	}
	.btn.secondary {
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}
</style>
