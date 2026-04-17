<script lang="ts">
	import { page } from '$app/state';
	import { motion } from '@humanspeak/svelte-motion';
	import { prefersReducedMotion } from 'svelte/motion';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const reduce = $derived(prefersReducedMotion.current);

	const jsonLd = $derived({
		[`@context`]: `https://schema.org`,
		[`@type`]: `WebSite`,
		name: `MarketForge`,
		url: `${data.siteUrl}/`
	});
</script>

<SeoHead
	title="MarketForge — Trading education & tools"
	description="Structured courses, indicators, and live sessions. Upgrade when you are ready."
	siteUrl={data.siteUrl}
	path={page.url.pathname}
	{jsonLd}
/>

<section class="hero">
	<motion.div
		class="inner"
		initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: reduce ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}
	>
		<h1>Trade with a clearer playbook</h1>
		<p class="sub">
			Courses, downloadable indicators, and optional live room access — gated so paying members get a
			consistent experience.
		</p>
		<p class="cta-row">
			<a class="btn primary" href="/signup">Create account</a>
			<a class="btn" href="/pricing">View pricing</a>
		</p>
	</motion.div>
</section>

<section class="band">
	<h2>Why MarketForge</h2>
	<ul class="features">
		<motion.li
				class="card"
				initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
				viewport={{ once: true, margin: `-40px` }}
				whileHover={reduce ? undefined : { y: -4 }}
			>
			<h3>Courses</h3>
			<p>Markdown lessons with progress saved to your account.</p>
		</motion.li>
			<motion.li
				class="card"
				initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.06, ease: [0.16, 1, 0.3, 1] }}
				viewport={{ once: true, margin: `-40px` }}
				whileHover={reduce ? undefined : { y: -4 }}
			>
			<h3>Indicator vault</h3>
			<p>Pine Script and ThinkScript sources for serious builders.</p>
		</motion.li>
			<motion.li
				class="card"
				initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
				viewport={{ once: true, margin: `-40px` }}
				whileHover={reduce ? undefined : { y: -4 }}
			>
			<h3>Live room</h3>
			<p>
				Scheduled broadcasts and Q&amp;A for lifetime members — player, calendar, and session notes ship in-product.
			</p>
		</motion.li>
	</ul>
</section>

<section class="band muted">
	<h2>Pricing preview</h2>
	<p>Numbers come from the database (Stripe-backed in dev). <a href="/pricing">Open the pricing page</a>.</p>
</section>

<section class="band">
	<h2>FAQ</h2>
	<dl class="faq">
		<dt>Do you store card data?</dt>
		<dd>No — checkout uses Stripe’s hosted flows.</dd>
		<dt>When do I get access?</dt>
		<dd>After Stripe webhooks confirm payment, entitlements update automatically.</dd>
	</dl>
</section>

<style>
	.hero {
		padding: var(--space-4xl) var(--space-lg);
		background: linear-gradient(
			160deg,
			var(--color-primary-muted) 0%,
			var(--color-surface-0) 55%
		);
	}
	.hero :global(.inner) {
		max-width: 40rem;
		margin: 0 auto;
		will-change: transform, opacity;
	}
	@media (prefers-reduced-motion: reduce) {
		.hero :global(.inner) {
			will-change: auto;
		}
	}
	.hero h1 {
		font-size: var(--text-4xl);
		line-height: var(--leading-tight);
		margin: 0 0 var(--space-md);
	}
	.sub {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0 0 var(--space-xl);
	}
	.cta-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin: 0;
	}
	.btn {
		display: inline-block;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm, 0.25rem);
		text-decoration: none;
		font-weight: 600;
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		background: var(--color-surface-1);
	}
	.btn.primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-color: transparent;
	}
	.band {
		padding: var(--space-3xl) var(--space-lg);
		max-width: 64rem;
		margin: 0 auto;
	}
	.band.muted {
		background: var(--color-surface-1);
		max-width: none;
	}
	.band h2 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-lg);
	}
	.features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-lg);
	}
	.features :global(.card) {
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface-1);
		will-change: transform, opacity;
	}
	@media (prefers-reduced-motion: reduce) {
		.features :global(.card) {
			will-change: auto;
		}
	}
	.features :global(.card h3) {
		margin: 0 0 var(--space-sm);
		font-size: var(--text-lg);
	}
	.features :global(.card p) {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
	}
	.band.muted p {
		margin: 0;
		color: var(--color-text-muted);
	}
	.band.muted a {
		color: var(--color-primary);
		font-weight: 600;
	}
	.faq {
		margin: 0;
		max-width: 36rem;
	}
	.faq dt {
		font-weight: 700;
		margin-block: var(--space-md) var(--space-xs);
	}
	.faq dd {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
</style>
