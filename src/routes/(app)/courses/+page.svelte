<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Courses — MarketForge</title>
</svelte:head>

<h1>Courses</h1>
<p class="lead">Markdown lessons with saved progress.</p>

<ul class="list">
	{#each data.courses as c}
		<li>
			<a href="/courses/{c.slug}">{c.title}</a>
			{#if c.description}
				<p class="desc">{c.description}</p>
			{/if}
		</li>
	{:else}
		<li>No published courses yet.</li>
	{/each}
</ul>

<style>
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-sm);
	}
	.lead {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-xl);
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.list a {
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.desc {
		margin: var(--space-xs) 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
