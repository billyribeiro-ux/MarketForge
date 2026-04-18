<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Audit log — Admin</title>
</svelte:head>

<h2 class="h">Audit log</h2>
<p class="lead">Last 100 entries.</p>

<table class="table">
	<thead>
		<tr>
			<th>When</th>
			<th>Action</th>
			<th>Entity</th>
			<th>Actor</th>
		</tr>
	</thead>
	<tbody>
		{#each data.entries as e (e.id)}
			<tr>
				<td>{e.createdAt.toLocaleString()}</td>
				<td>{e.action}</td>
				<td>{e.entityType}:{e.entityId}</td>
				<td class="mono">{e.actorUserId ?? `—`}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.h {
		font-size: var(--text-lg);
		margin: 0 0 var(--space-xs);
	}
	.lead {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin: 0 0 var(--space-lg);
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}
	.table th,
	.table td {
		text-align: left;
		padding: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
		vertical-align: top;
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.85em;
		word-break: break-all;
	}
</style>
