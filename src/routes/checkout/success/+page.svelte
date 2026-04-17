<script lang="ts">
	import { page } from '$app/state';
	import { trackPlausible } from '$lib/client/plausible';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { onMount } from 'svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sessionId = $derived(page.url.searchParams.get(`session_id`));

	onMount(() => {
		if (sessionId) {
			trackPlausible(`checkout_completed`);
		}
	});
</script>

<SeoHead
	title="Checkout complete — MarketForge"
	description="Your MarketForge checkout completed. Access updates when Stripe confirms payment."
	siteUrl={data.siteUrl}
	path={page.url.pathname}
/>

<main class="wrap">
	<h1>Thanks — you’re all set</h1>
	<p>
		Your payment is processing. Access updates as soon as Stripe confirms the purchase — refresh in a
		moment if you don’t see it yet.
	</p>
	{#if sessionId}
		<p class="muted">Reference: {sessionId}</p>
	{/if}
	<p><a href="/app">Back to app</a></p>
</main>

<style>
	.wrap {
		max-width: 36rem;
		margin: 3rem auto;
		padding: 0 1.25rem;
		font-family: system-ui, sans-serif;
		line-height: 1.5;
	}
	.muted {
		color: #64748b;
		font-size: 0.875rem;
		word-break: break-all;
	}
</style>
