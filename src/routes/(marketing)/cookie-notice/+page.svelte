<svelte:head>
	<title>Cookie notice — MarketForge</title>
</svelte:head>

<article class="legal">
	<h1>Cookie notice</h1>
	<p class="meta">Last updated: April 2026. How MarketForge uses cookies and similar storage.</p>

	<section>
		<h2>1. Strictly necessary</h2>
		<p>
			We use HTTP cookies and browser storage to keep you signed in, protect against cross-site request forgery, and
			maintain session security. These are required for the service to function and are not used for third-party
			advertising.
		</p>
	</section>

	<section>
		<h2>2. Analytics</h2>
		<p>
			If <strong>Plausible</strong> (or similar privacy-oriented analytics) is enabled for our domain, it may use a
			lightweight approach that avoids personal data collection and many traditional tracking cookies. Check our
			<a href="/privacy">Privacy policy</a> for the current subprocessors list.
		</p>
	</section>

	<section>
		<h2>3. Payment &amp; embedded content</h2>
		<p>
			When you use Stripe Checkout or the billing portal, Stripe may set its own cookies subject to
			<a href="https://stripe.com/legal/cookies" rel="noopener noreferrer">Stripe’s policies</a>. We do not control
			those cookies.
		</p>
	</section>

	<section>
		<h2>4. Your choices</h2>
		<p>
			You can block or delete cookies in your browser settings; doing so may break login and checkout. For
			region-specific consent banners, we may add controls as our traffic and legal obligations evolve.
		</p>
	</section>

	<section>
		<h2>5. Contact</h2>
		<p>Questions: <a href="/contact">Contact us</a>.</p>
	</section>
</article>

<style>
	.legal {
		padding: var(--space-3xl) var(--space-lg);
		max-width: 44rem;
		margin: 0 auto;
		line-height: var(--leading-relaxed);
		font-size: var(--text-sm);
	}
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-sm);
	}
	.meta {
		margin: 0 0 var(--space-2xl);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	section {
		margin-block-end: var(--space-xl);
	}
	h2 {
		font-size: var(--text-lg);
		margin: 0 0 var(--space-sm);
	}
	p {
		margin: 0 0 var(--space-md);
		color: var(--color-text);
	}
	a {
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
