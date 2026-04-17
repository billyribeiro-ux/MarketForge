<svelte:head>
	<title>Support — MarketForge</title>
</svelte:head>

<article class="support">
	<h1>Support</h1>
	<p class="lead">
		We answer member questions in order of urgency. Most billing and access issues are resolved within one business
		day.
	</p>

	<section class="panel">
		<h2>Before you write in</h2>
		<ul>
			<li>
				<strong>Access after payment:</strong> entitlements activate after Stripe webhooks confirm payment — usually
				within a minute. If it’s longer, check spam folders and try signing out and back in.
			</li>
			<li>
				<strong>Billing portal:</strong> signed-in members can manage payment methods and invoices from the app when
				checkout is enabled.
			</li>
			<li>
				<strong>Password &amp; 2FA:</strong> use the reset flow on the login page; keep your email inbox accessible.
			</li>
		</ul>
	</section>

	<section class="panel">
		<h2>How to reach us</h2>
		<p>
			Use the <a href="/contact">contact form</a> and pick the topic that best matches your question. Include your
			account email and any relevant dates (e.g. charge date).
		</p>
	</section>

	<section class="panel">
		<h2>Refunds &amp; disputes</h2>
		<p>
			See our <a href="/refund-policy">Refund policy</a>. For card disputes, note that chargebacks may temporarily
			suspend access while we coordinate with Stripe.
		</p>
	</section>

	<section class="panel">
		<h2>Status &amp; incidents</h2>
		<p>
			For widespread outages we will post updates on this page or by email to affected members. Routine maintenance is
			scheduled during low-traffic windows when possible.
		</p>
	</section>
</article>

<style>
	.support {
		padding: var(--space-3xl) var(--space-lg);
		max-width: 44rem;
		margin: 0 auto;
		line-height: var(--leading-relaxed);
	}
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-sm);
	}
	.lead {
		margin: 0 0 var(--space-2xl);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.panel {
		margin-block-end: var(--space-xl);
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface-1);
	}
	h2 {
		font-size: var(--text-lg);
		margin: 0 0 var(--space-md);
	}
	p,
	ul {
		margin: 0;
		font-size: var(--text-sm);
	}
	ul {
		padding-inline-start: var(--space-xl);
	}
	li {
		margin-block-end: var(--space-sm);
	}
	a {
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
