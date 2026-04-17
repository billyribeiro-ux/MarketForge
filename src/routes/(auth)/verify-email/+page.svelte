<script lang="ts">
	import { page } from '$app/state';
	import { trackPlausible } from '$lib/client/plausible';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { onMount } from 'svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	onMount(() => {
		if (data.justRegistered) {
			trackPlausible(`signup_completed`);
		}
	});
</script>

<SeoHead
	title="Verify email — MarketForge"
	description="Confirm your email address to activate your MarketForge account."
	siteUrl={data.siteUrl}
	path={page.url.pathname}
/>

<article class="card">
	<h1>Check your inbox</h1>
	<p>We sent a verification link. Open it on this device to activate your account.</p>
	<p class="muted"><a href="/login">Back to sign in</a></p>
</article>

<style>
	.card {
		inline-size: min(100%, 28rem);
		padding: var(--space-xl);
		border-radius: var(--radius-md);
		background: var(--color-surface-0);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}
	h1 {
		margin: 0 0 var(--space-md);
		font-size: var(--text-2xl);
		font-weight: 600;
	}
	p {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.muted {
		font-size: var(--text-sm);
	}
	.muted a {
		color: var(--color-primary);
	}
</style>
