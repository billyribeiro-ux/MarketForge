<script lang="ts">
	let { periodEnd }: { periodEnd: Date } = $props();

	const endLabel = $derived(periodEnd.toLocaleDateString(undefined, { dateStyle: `medium` }));
</script>

<div class="banner" role="status">
	<strong>Subscription ending</strong>
	— you’ve cancelled but keep access until <time datetime={periodEnd.toISOString()}>{endLabel}</time>.
	<a href="/account/billing">Manage billing</a>
</div>

<style>
	.banner {
		padding: var(--space-md) var(--space-lg);
		background: var(--color-warn-muted);
		color: var(--color-on-warn);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		border-block-end: 1px solid var(--color-border);
	}
	.banner a {
		margin-inline-start: var(--space-sm);
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
