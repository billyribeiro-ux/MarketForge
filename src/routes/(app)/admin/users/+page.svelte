<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Users — Admin</title>
</svelte:head>

<h2 class="h">Users</h2>

<form method="get" class="search">
	<label>
		<span class="sr">Search</span>
		<input type="search" name="q" value={data.q} placeholder="Email or name" />
	</label>
	<button type="submit">Search</button>
</form>

<table class="table">
	<thead>
		<tr>
			<th>Email</th>
			<th>Name</th>
			<th>Status</th>
		</tr>
	</thead>
	<tbody>
		{#each data.users as u (u.id)}
			<tr>
				<td><a href="/admin/users/{u.id}">{u.email}</a></td>
				<td>{u.name}</td>
				<td>{u.banned ? `Banned` : `OK`}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.h {
		font-size: var(--text-lg);
		margin: 0 0 var(--space-md);
	}
	.search {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-end;
		margin-bottom: var(--space-lg);
		flex-wrap: wrap;
	}
	.search input {
		padding: var(--space-sm);
		min-width: 14rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		font: inherit;
	}
	.search button {
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 600;
		cursor: pointer;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
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
	}
	.table a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}
</style>
