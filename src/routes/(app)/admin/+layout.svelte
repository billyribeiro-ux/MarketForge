<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="admin">
	<h1 class="title">Admin</h1>
	<nav class="sub" aria-label="Admin sections">
		<a href="/admin/users">Users</a>
		<a href="/admin/audit">Audit log</a>
	</nav>
	<div class="body">
		{@render children()}
	</div>
</div>

<style>
	.admin {
		max-width: 56rem;
	}
	.title {
		font-size: var(--text-xl);
		margin: 0 0 var(--space-md);
	}
	.sub {
		display: flex;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
		font-size: var(--text-sm);
	}
	.sub a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}
	.body {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-lg);
	}
</style>
