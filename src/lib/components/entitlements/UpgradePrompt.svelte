<script lang="ts">
	import { trackPlausible } from '$lib/client/plausible';
	import type { EntitlementKey } from '$lib/types/auth';

	let {
		title,
		body,
		requiredKey,
		checkoutSlug = `pro-yearly`
	}: {
		title: string;
		body: string;
		requiredKey: EntitlementKey;
		/** Default upgrade path — yearly unlocks vault on this product. */
		checkoutSlug?: string;
	} = $props();

	function onUpgradeClick(): void {
		trackPlausible(`checkout_started`, { product: checkoutSlug });
	}
</script>

<section class="upgrade" role="status" aria-live="polite">
	<h2 class="h">{title}</h2>
	<p class="p">{body}</p>
	<p class="meta">Required: <code>{requiredKey}</code></p>
	<p class="actions">
		<a class="btn" href="/checkout/{checkoutSlug}" onclick={onUpgradeClick}>Upgrade</a>
		<a class="link" href="/pricing">View pricing</a>
	</p>
</section>

<style>
	.upgrade {
		max-width: 32rem;
		padding: var(--space-xl);
		border-radius: var(--radius-md, 0.5rem);
		border: 1px solid var(--color-border);
		background: var(--color-surface-1);
	}
	.h {
		margin: 0 0 var(--space-sm);
		font-size: var(--text-xl);
	}
	.p {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.meta {
		font-size: var(--text-sm);
		color: var(--color-text-subtle);
		margin: 0 0 var(--space-lg);
	}
	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: center;
		margin: 0;
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
	.link {
		color: var(--color-primary);
		font-size: var(--text-sm);
	}
</style>
