<script lang="ts">
	import { page } from '$app/state';
	import { trackPlausible } from '$lib/client/plausible';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function onCheckoutIntent(slug: string): void {
		trackPlausible(`checkout_started`, { product: slug });
	}
</script>

<SeoHead
	title="Pricing — MarketForge"
	description="Plans loaded from the catalog — amounts sync with Stripe in development."
	siteUrl={data.siteUrl}
	path={page.url.pathname}
/>

<div class="wrap">
	<h1>Pricing</h1>
	<p class="lead">All amounts are read from the database (seeded / synced from Stripe). Nothing hardcoded here.</p>

	<ul class="grid">
		{#each data.items as item}
			<li class="card">
				<h2>{item.name}</h2>
				<p class="price">{item.displayPrice}</p>
				<p class="meta">{item.billing}</p>
				<a
					class="btn"
					href="/login?redirect={encodeURIComponent(`/checkout/${item.checkoutPath}`)}"
					onclick={() => onCheckoutIntent(item.checkoutPath)}>Get started</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.wrap {
		padding: var(--space-3xl) var(--space-lg);
		max-width: 56rem;
		margin: 0 auto;
	}
	h1 {
		font-size: var(--text-3xl);
		margin: 0 0 var(--space-sm);
	}
	.lead {
		color: var(--color-text-muted);
		max-width: 36rem;
		line-height: var(--leading-relaxed);
		margin: 0 0 var(--space-2xl);
	}
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--space-lg);
	}
	.card {
		padding: var(--space-xl);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface-1);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.card h2 {
		font-size: var(--text-lg);
		margin: 0;
	}
	.price {
		font-size: var(--text-2xl);
		font-weight: 700;
		margin: 0;
	}
	.meta {
		margin: 0 0 var(--space-md);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		flex: 1;
	}
	.btn {
		display: inline-block;
		text-align: center;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		text-decoration: none;
		font-weight: 600;
		font-size: var(--text-sm);
	}
</style>
