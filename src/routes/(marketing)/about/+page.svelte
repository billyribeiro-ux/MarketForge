<svelte:head>
	<title>About — MarketForge</title>
</svelte:head>

<article class="about">
	<h1>About MarketForge</h1>
	<p class="lead">
		MarketForge is built for serious retail traders who want structured education, professional-grade indicator
		materials, and an optional live room experience — without the noise of generic “signal” groups.
	</p>

	<section>
		<h2>What we believe</h2>
		<p>
			Clarity beats hype. Risk management and process matter more than any single setup. Our curriculum and tools are
			designed to help you build repeatable habits, not to promise unrealistic returns.
		</p>
	</section>

	<section>
		<h2>What you get</h2>
		<ul>
			<li><strong>Courses</strong> — progressive lessons with progress saved to your account.</li>
			<li><strong>Indicator vault</strong> — Pine Script and ThinkScript sources on eligible plans.</li>
			<li><strong>Live room</strong> — included with lifetime access; live sessions and Q&amp;A when scheduled.</li>
			<li><strong>Fair access</strong> — entitlements are enforced in the database, not by fragile “plan” flags.</li>
		</ul>
	</section>

	<section>
		<h2>Who it’s for</h2>
		<p>
			Active traders and motivated learners who already understand that markets are uncertain and who want a cleaner
			playbook. If you are looking for guaranteed profits, MarketForge is not a fit.
		</p>
	</section>

	<section>
		<h2>Contact</h2>
		<p>Press, partnerships, or member support: <a href="/contact">reach out here</a>.</p>
	</section>
</article>

<style>
	.about {
		padding: var(--space-3xl) var(--space-lg);
		max-width: 44rem;
		margin: 0 auto;
		line-height: var(--leading-relaxed);
	}
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-md);
	}
	.lead {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-2xl);
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
		font-size: var(--text-sm);
	}
	ul {
		margin: 0;
		padding-inline-start: var(--space-xl);
		font-size: var(--text-sm);
	}
	li {
		margin-block-end: var(--space-sm);
	}
	a {
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
