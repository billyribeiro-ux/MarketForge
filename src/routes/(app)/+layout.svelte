<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	import PastDueWarning from '$lib/components/entitlements/PastDueWarning.svelte';
	import RenewalBanner from '$lib/components/entitlements/RenewalBanner.svelte';
	import TrialCountdown from '$lib/components/entitlements/TrialCountdown.svelte';

	import type { LayoutData } from './$types';

	type NavItem = { href: string; label: string; match: RegExp; admin?: boolean };
	const NAV: readonly NavItem[] = [
		{ href: `/app`, label: `Dashboard`, match: /^\/app(\/.*)?$/ },
		{ href: `/indicators`, label: `Indicators`, match: /^\/indicators(\/.*)?$/ },
		{ href: `/live`, label: `Live room`, match: /^\/live(\/.*)?$/ },
		{ href: `/courses`, label: `Courses`, match: /^\/courses(\/.*)?$/ },
		{ href: `/admin`, label: `Admin`, match: /^\/admin(\/.*)?$/, admin: true },
	];

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const showAdmin = $derived(data.entitlementKeys.includes(`admin`));
	const showRenewal = $derived(
		Boolean(
			data.subscription?.cancelAtPeriodEnd &&
				(data.subscription.status === `active` || data.subscription.status === `trialing`) &&
				data.subscription.currentPeriodEnd,
		),
	);
	const pathname = $derived(page.url.pathname);
	const items = $derived(NAV.filter((n) => (n.admin ? showAdmin : true)));
</script>

<div class="shell">
	<aside class="side" aria-label="App navigation">
		<a class="brand" href="/app">MarketForge</a>
		<nav class="nav">
			{#each items as item (item.href)}
				{@const isActive = item.match.test(pathname)}
				<a
					href={item.href}
					class="nav-link"
					class:admin={item.admin}
					class:active={isActive}
					aria-current={isActive ? `page` : undefined}
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</aside>
	<div class="col">
		<header class="top">
			<div class="user">
				<span class="email" title={data.user?.email ?? ``}>{data.user?.email}</span>
				<div class="user-actions">
					{#if data.checkoutEnabled}
						<a href="/app#plans">Plans</a>
						{#if data.user?.stripeCustomerId}
							<a href="/account/billing">Billing</a>
						{/if}
					{/if}
					<a href="/account">Account</a>
					<a href="/logout">Sign out</a>
				</div>
			</div>
		</header>

		{#if data.subscription?.status === `past_due`}
			<PastDueWarning />
		{:else if data.subscription?.status === `trialing` && data.subscription.trialEnd}
			<TrialCountdown trialEnd={data.subscription.trialEnd} />
		{:else if showRenewal && data.subscription?.currentPeriodEnd}
			<RenewalBanner periodEnd={data.subscription.currentPeriodEnd} />
		{/if}

		<main class="main" id="main" tabindex="-1">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell {
		min-height: 100dvb;
		display: grid;
		grid-template-columns: 13rem 1fr;
		font-family: var(--font-sans);
		background: var(--color-surface-0);
		color: var(--color-text);
	}
	@media (max-width: 48rem) {
		.shell {
			grid-template-columns: 1fr;
		}
		.side {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: var(--space-md);
		}
		.nav {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: var(--space-lg);
		background: var(--color-surface-1);
		border-inline-end: 1px solid var(--color-border);
	}
	.brand {
		font-weight: 800;
		font-size: var(--text-md);
		color: var(--color-text);
		text-decoration: none;
	}
	.nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.nav-link {
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm, 0.25rem);
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--text-sm);
	}
	.nav-link:hover {
		background: var(--color-surface-2);
	}
	.nav-link.active {
		background: var(--color-surface-2);
		font-weight: 600;
	}
	.nav-link.admin {
		color: var(--color-primary);
		font-weight: 600;
	}
	.main:focus {
		outline: none;
	}
	.col {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.top {
		display: flex;
		justify-content: flex-end;
		padding: var(--space-md) var(--space-lg);
		border-block-end: 1px solid var(--color-border);
		background: var(--color-surface-1);
	}
	.user {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
		font-size: var(--text-sm);
	}
	.email {
		color: var(--color-text-muted);
		max-width: 14rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.user-actions {
		display: flex;
		gap: var(--space-md);
	}
	.user-actions a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}
	.main {
		flex: 1;
		padding: var(--space-xl);
	}
</style>
