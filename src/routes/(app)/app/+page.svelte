<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Dashboard — MarketForge</title>
</svelte:head>

<h1>Dashboard</h1>
<p class="meta">
	Signed in as <strong>{page.data.user?.email ?? `—`}</strong>
</p>
<p class="tier">Auth tier: <code>{page.data.authTier}</code></p>
<p class="hint">
	Entitlements: <code>{(page.data.entitlementKeys ?? []).join(`, `) || `none`}</code>
</p>

{#if page.data.checkoutEnabled}
	<section id="plans" class="plans" aria-labelledby="plans-heading">
		<h2 id="plans-heading">Plans</h2>
		<p class="plans-lead">Start checkout (hosted by Stripe). Access is granted after webhooks confirm payment.</p>
		<ul class="plan-list">
			<li><a href="/checkout/pro-monthly">Pro — Monthly</a></li>
			<li><a href="/checkout/pro-quarterly">Pro — Quarterly</a></li>
			<li><a href="/checkout/pro-yearly">Pro — Yearly</a></li>
			<li><a href="/checkout/pro-lifetime">Pro — Lifetime</a></li>
		</ul>
		{#if page.data.user?.stripeCustomerId}
			<p class="plans-foot"><a href="/account/billing">Open billing portal</a> for invoices and payment methods.</p>
		{/if}
	</section>
{/if}

<style>
	h1 {
		font-size: var(--text-3xl);
		margin: 0 0 var(--space-md);
	}
	.meta,
	.hint {
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.tier {
		margin-block-start: var(--space-lg);
		font-size: var(--text-sm);
	}
	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
		padding: 0.1em 0.35em;
		border-radius: var(--radius-sm);
		background: var(--color-surface-2);
	}
	.plans {
		margin-block-start: var(--space-xl);
		padding-block-start: var(--space-lg);
		border-block-start: 1px solid var(--color-border);
	}
	.plans h2 {
		font-size: var(--text-xl);
		margin: 0 0 var(--space-sm);
	}
	.plans-lead {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin: 0 0 var(--space-md);
		line-height: var(--leading-relaxed);
	}
	.plan-list {
		margin: 0;
		padding-inline-start: 1.25rem;
		line-height: var(--leading-relaxed);
	}
	.plan-list a {
		color: var(--color-primary);
	}
	.plans-foot {
		margin-block-start: var(--space-md);
		font-size: var(--text-sm);
	}
	.plans-foot a {
		color: var(--color-primary);
	}
</style>
