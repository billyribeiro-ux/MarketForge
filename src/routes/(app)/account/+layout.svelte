<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	import type { LayoutData } from './$types';

	type Tab = { href: string; label: string; match: RegExp; danger?: boolean };
	const TABS: readonly Tab[] = [
		{ href: `/account`, label: `Profile`, match: /^\/account\/?$/ },
		{
			href: `/account/security`,
			label: `Security`,
			match: /^\/account\/security(\/.*)?$/,
		},
		{
			href: `/account/delete`,
			label: `Delete account`,
			match: /^\/account\/delete(\/.*)?$/,
			danger: true,
		},
	];

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const pathname = $derived(page.url.pathname);
</script>

<svelte:head>
	<title>Account — MarketForge</title>
</svelte:head>

<div class="account">
	<header class="account-head">
		<h1>Account</h1>
		<p class="sub">
			Signed in as <strong>{data.user.email}</strong>
		</p>
	</header>
	<nav class="tabs" aria-label="Account sections">
		{#each TABS as tab (tab.href)}
			{@const isActive = tab.match.test(pathname)}
			<a
				href={tab.href}
				class="tab"
				class:active={isActive}
				class:danger={Boolean(tab.danger)}
				aria-current={isActive ? `page` : undefined}
			>
				{tab.label}
			</a>
		{/each}
	</nav>
	<section class="panel">
		{@render children()}
	</section>
</div>

<style>
	.account {
		max-width: 56rem;
	}
	.account-head {
		margin-bottom: var(--space-xl);
	}
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-xs);
	}
	.sub {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
		border-block-end: 1px solid var(--color-border);
		padding-block-end: var(--space-sm);
	}
	.tab {
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		color: var(--color-primary);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
	}
	.tab.active {
		background: var(--color-surface-2);
		font-weight: 700;
	}
	.tab.danger {
		color: var(--color-danger);
	}
	.panel {
		display: block;
	}
</style>
