<script lang="ts">
	let { trialEnd }: { trialEnd: Date } = $props();

	const endLabel = $derived(trialEnd.toLocaleString(undefined, { dateStyle: `medium`, timeStyle: `short` }));

	const hoursLeft = $derived(Math.max(0, (trialEnd.getTime() - Date.now()) / 3600000));

	const urgent = $derived(hoursLeft > 0 && hoursLeft <= 24);
</script>

<div class="banner" class:urgent role="status">
	<strong>Trial active</strong>
	— ends <time datetime={trialEnd.toISOString()}>{endLabel}</time>.
	{#if urgent}
		<span class="urgent-tag">Ends within 24h</span>
	{/if}
	<a href="/account/billing">Update payment method</a>
</div>

<style>
	.banner {
		padding: var(--space-md) var(--space-lg);
		background: var(--color-primary-muted);
		color: var(--color-text);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		border-block-end: 1px solid var(--color-border);
	}
	.banner.urgent {
		background: var(--color-warn-muted);
	}
	.urgent-tag {
		display: inline-block;
		margin-inline: var(--space-sm);
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-warn);
		color: var(--color-on-warn);
		font-size: var(--text-xs);
		font-weight: 600;
	}
	.banner a {
		margin-inline-start: var(--space-sm);
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
