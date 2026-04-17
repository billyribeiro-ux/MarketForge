<svelte:head>
	<title>Refund policy — MarketForge</title>
</svelte:head>

<article class="legal">
	<h1>Refund policy</h1>
	<p class="meta">Last updated: April 2026. This policy works alongside Stripe checkout and your plan terms.</p>

	<section>
		<h2>1. Subscriptions</h2>
		<p>
			Monthly, quarterly, and yearly memberships renew automatically until cancelled. You may cancel from your
			account billing portal (when enabled) or by contacting support. Cancellation stops future renewals; you
			typically retain access through the end of the paid period unless stated otherwise at purchase.
		</p>
		<p>
			<strong>Refund requests</strong> for subscription charges are evaluated case by case. Where required by law
			or payment network rules, we will honor applicable cooling-off or dispute rights. Otherwise, refunds are not
			guaranteed for partial periods already delivered.
		</p>
	</section>

	<section>
		<h2>2. Lifetime &amp; one-time purchases</h2>
		<p>
			Lifetime and other one-time products are described at checkout. Refunds may be available within a limited
			window after purchase if you have not materially consumed downloadable assets, subject to fraud review.
			Chargebacks and disputes may result in revocation of access per our terms and payment processor rules.
		</p>
	</section>

	<section>
		<h2>3. Trials</h2>
		<p>
			If your plan includes a trial, conversion and billing timing are shown before you confirm payment. Cancelling
			before the trial ends may avoid charges depending on how the trial was configured in Stripe.
		</p>
	</section>

	<section>
		<h2>4. How to request help</h2>
		<p>
			For billing questions or refund requests, use <a href="/contact">Contact</a> with topic
			<strong>Billing &amp; subscriptions</strong> or open a ticket from <a href="/support">Support</a>. Include
			the email on your account and approximate charge date.
		</p>
	</section>

	<section>
		<h2>5. Chargebacks</h2>
		<p>
			Initiating a chargeback may lead to immediate suspension of access while the case is reviewed. We work with
			Stripe to resolve disputes fairly and may provide evidence of delivery and terms acceptance.
		</p>
	</section>

	<p class="disclaimer">
		<em>Align this policy with your Stripe account settings and counsel-approved terms before launch.</em>
	</p>
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
	.disclaimer {
		margin-block-start: var(--space-3xl);
		padding-block-start: var(--space-lg);
		border-block-start: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
</style>
