<svelte:head>
	<title>Privacy policy — MarketForge</title>
</svelte:head>

<article class="legal">
	<h1>Privacy policy</h1>
	<p class="meta">Last updated: April 2026. This policy describes how MarketForge collects and uses personal data.</p>

	<section>
		<h2>1. Who we are</h2>
		<p>
			MarketForge operates the membership platform at our websites and applications. For privacy inquiries, use the
			<a href="/contact">contact form</a> and select the appropriate topic.
		</p>
	</section>

	<section>
		<h2>2. Data we collect</h2>
		<ul>
			<li><strong>Account data:</strong> name, email, password hash (via our auth provider), session identifiers.</li>
			<li><strong>Billing data:</strong> processed by Stripe; we store references such as customer and subscription IDs, not full card numbers.</li>
			<li><strong>Usage &amp; support:</strong> messages you send us, and technical logs needed to operate the service.</li>
			<li><strong>Analytics (optional):</strong> if enabled, privacy-oriented analytics (e.g. Plausible) may record page views without third-party advertising cookies.</li>
		</ul>
	</section>

	<section>
		<h2>3. How we use data</h2>
		<p>We use personal data to:</p>
		<ul>
			<li>Provide accounts, authentication, and gated content.</li>
			<li>Process payments, entitlements, renewals, and support requests.</li>
			<li>Send transactional email (e.g. verification, receipts, billing notices) through our email provider.</li>
			<li>Improve reliability and security, including error monitoring where configured.</li>
			<li>Comply with law and enforce our terms.</li>
		</ul>
	</section>

	<section>
		<h2>4. Processors &amp; services</h2>
		<p>Depending on configuration, we may use:</p>
		<ul>
			<li><strong>Stripe</strong> for payments and billing portal.</li>
			<li><strong>Resend</strong> (or similar) for transactional email.</li>
			<li><strong>Sentry</strong> (optional) for error reporting.</li>
			<li><strong>Plausible</strong> (optional) for privacy-friendly analytics.</li>
			<li><strong>Hosting &amp; database</strong> providers where the application and data reside.</li>
		</ul>
		<p>Each provider processes data under their terms and, where applicable, a data processing agreement.</p>
	</section>

	<section>
		<h2>5. Retention</h2>
		<p>
			We retain account and billing records as needed to provide the service, meet legal obligations, and resolve
			disputes. You may request deletion of your account subject to legal retention requirements (e.g. tax and
			fraud prevention).
		</p>
	</section>

	<section>
		<h2>6. Your rights</h2>
		<p>
			Depending on your location, you may have rights to access, correct, delete, or export personal data, and to
			object to or restrict certain processing. Contact us to exercise these rights. You may also lodge a complaint
			with your local supervisory authority where applicable.
		</p>
	</section>

	<section>
		<h2>7. International transfers</h2>
		<p>
			If you access the service from outside the country where our infrastructure is hosted, your data may be
			transferred and processed there. We use appropriate safeguards as required by applicable law.
		</p>
	</section>

	<section>
		<h2>8. Children</h2>
		<p>
			MarketForge is not directed at children under 16. We do not knowingly collect personal data from children. If
			you believe we have, contact us and we will delete it.
		</p>
	</section>

	<section>
		<h2>9. Cookies &amp; similar technologies</h2>
		<p>
			We use cookies and similar technologies for authentication and security. See our <a href="/cookie-notice"
				>Cookie notice</a
			> for detail.
		</p>
	</section>

	<section>
		<h2>10. Changes</h2>
		<p>
			We may update this policy. We will post the new version with an updated date and notify you of material changes
			where required.
		</p>
	</section>

	<p class="disclaimer">
		<em>Have privacy counsel review this policy for your jurisdictions and subprocessors before production launch.</em>
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
	ul {
		margin: 0 0 var(--space-md);
		padding-inline-start: var(--space-xl);
	}
	li {
		margin-block-end: var(--space-xs);
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
