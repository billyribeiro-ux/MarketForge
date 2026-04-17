<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	import LogoMarkIcon from '$lib/icons/generated/LogoMarkIcon.svelte';

	import type { LayoutData } from './$types';

	const NAV = [
		{ href: `/pricing`, label: `Pricing` },
		{ href: `/about`, label: `About` },
		{ href: `/contact`, label: `Contact` },
		{ href: `/support`, label: `Support` },
	] as const;

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const pathname = $derived(page.url.pathname);
	const currentYear = $derived(new Date().getFullYear());
</script>

<div class="mkt">
	<header class="bar">
		<a class="brand" href="/">
			<span class="brand-mark" aria-hidden="true"><LogoMarkIcon class="brand-svg" /></span>
			<span class="brand-text">MarketForge</span>
		</a>
		<nav class="nav" aria-label="Primary">
			{#each NAV as item (item.href)}
				{@const isActive = pathname === item.href}
				<a href={item.href} aria-current={isActive ? `page` : undefined} class:active={isActive}>
					{item.label}
				</a>
			{/each}
			{#if data.user}
				<a href="/app">App</a>
			{:else}
				<a href="/login">Log in</a>
				<a class="cta" href="/signup">Sign up</a>
			{/if}
			<Icon icon="ph:chart-line-up" class="nav-icon" aria-hidden="true" />
		</nav>
	</header>
	<main class="main" id="main" tabindex="-1">
		{@render children()}
	</main>
	<footer class="foot">
		<nav class="foot-nav" aria-label="Legal">
			<a href="/terms">Terms</a>
			<a href="/privacy">Privacy</a>
			<a href="/refund-policy">Refund policy</a>
			<a href="/cookie-notice">Cookies</a>
		</nav>
		<p class="copy">
			© {currentYear} MarketForge — structured trading education &amp; tools. Not financial advice.
		</p>
	</footer>
</div>

<style>
	.mkt {
		min-height: 100dvb;
		display: flex;
		flex-direction: column;
		font-family: var(--font-sans);
		background: var(--color-surface-0);
		color: var(--color-text);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-lg);
		padding: var(--space-md) var(--space-lg);
		border-block-end: 1px solid var(--color-border);
		background: var(--color-surface-1);
		flex-wrap: wrap;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		font-weight: 800;
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--text-md);
	}
	.brand-mark {
		display: inline-flex;
		line-height: 0;
	}
	:global(.brand-svg) {
		inline-size: 1.75rem;
		block-size: 1.75rem;
	}
	.brand-text {
		line-height: 1;
	}
	:global(.nav-icon) {
		inline-size: 1.25rem;
		block-size: 1.25rem;
		color: var(--color-text-muted);
	}
	.nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
		font-size: var(--text-sm);
	}
	.nav a {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
	}
	.nav a.active {
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}
	.main:focus {
		outline: none;
	}
	.nav .cta {
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 600;
	}
	.main {
		flex: 1;
	}
	.foot {
		padding: var(--space-xl) var(--space-lg);
		border-block-start: 1px solid var(--color-border);
		background: var(--color-surface-1);
	}
	.foot-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
		font-size: var(--text-sm);
	}
	.foot-nav a {
		color: var(--color-text-muted);
		text-decoration: none;
	}
	.copy {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
