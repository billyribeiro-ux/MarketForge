<svelte:head>
	<title>Live Room — MarketForge</title>
</svelte:head>

<h1>Live Room</h1>

<p class="lead">
	When a session is live, the broadcast appears in the player below. Between sessions, review the schedule and prep
	materials — everything stays inside your membership; there is no public embed link.
</p>

<section class="player-shell" aria-labelledby="player-label">
	<h2 id="player-label" class="sr-only">Live player</h2>
	<div class="player">
		<p class="player-msg">
			No broadcast is live right now. We’ll drop the stream here automatically when the room opens — typically a few
			minutes before the published start time.
		</p>
	</div>
</section>

<section class="panel" aria-labelledby="next-label">
	<h2 id="next-label">Upcoming session</h2>
	<p class="muted">
		Session titles and times are announced in the app and by email. Your first live block will show the calendar link
		or join instructions your team configures in admin.
	</p>
</section>

<section class="panel guidelines" aria-labelledby="guide-label">
	<h2 id="guide-label">Room guidelines</h2>
	<ul>
		<li>Respect moderators and other members — no harassment or off-topic spam.</li>
		<li>No recording or redistribution of live audio/video without written permission.</li>
		<li>Educational content only; nothing here is personalized investment advice.</li>
	</ul>
</section>

<style>
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-sm);
	}
	.lead {
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		max-width: 42rem;
		margin: 0 0 var(--space-xl);
		font-size: var(--text-sm);
	}
	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.player-shell {
		margin-block-end: var(--space-xl);
		max-width: 48rem;
	}
	.player {
		aspect-ratio: 16 / 9;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		border: 1px dashed var(--color-border-strong);
		border-radius: var(--radius-md, 0.5rem);
		background: var(--color-surface-1);
	}
	.player-msg {
		margin: 0;
		max-width: 28rem;
		text-align: center;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.panel {
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface-1);
		max-width: 40rem;
		margin-block-end: var(--space-lg);
	}
	.panel h2 {
		font-size: var(--text-lg);
		margin: 0 0 var(--space-sm);
	}
	.muted {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
	}
	.guidelines ul {
		margin: 0;
		padding-inline-start: var(--space-xl);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
	}
	.guidelines li {
		margin-block-end: var(--space-xs);
	}
</style>
