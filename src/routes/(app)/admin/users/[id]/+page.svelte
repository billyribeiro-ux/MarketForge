<script lang="ts">
	import { enhance } from '$app/forms';

	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { ok?: boolean; message?: string } | undefined } = $props();
</script>

<svelte:head>
	<title>{data.subject.email} — Admin</title>
</svelte:head>

<p class="back"><a href="/admin/users">← Users</a></p>

<h2 class="h">{data.subject.name}</h2>
<p class="meta">{data.subject.email}</p>

<section class="section">
	<h3>Grant entitlement</h3>
	<form method="POST" action="?/grant" use:enhance class="form">
		<label>
			Key
			<select name="key" required>
				{#each data.keys as k}
					<option value={k}>{k}</option>
				{/each}
			</select>
		</label>
		<label>
			Valid until (optional)
			<input type="datetime-local" name="validUntil" />
		</label>
		<button type="submit" class="btn">Grant</button>
	</form>
</section>

<section class="section">
	<h3>Active &amp; historical</h3>
	<ul class="ents">
		{#each data.entitlements as e}
			<li class:revoked={e.revokedAt !== null}>
				<div class="row">
					<span><strong>{e.key}</strong> · {e.source}</span>
					{#if e.revokedAt}
						<span class="muted">Revoked {e.revokedAt.toLocaleString()}</span>
					{:else if e.validUntil}
						<span class="muted">Until {e.validUntil.toLocaleString()}</span>
					{:else}
						<span class="muted">No expiry</span>
					{/if}
				</div>
				{#if !e.revokedAt}
					<form method="POST" action="?/revoke" use:enhance>
						<input type="hidden" name="entitlementId" value={e.id} />
						<button type="submit" class="btn danger">Revoke</button>
					</form>
				{/if}
			</li>
		{:else}
			<li class="muted">No entitlement rows.</li>
		{/each}
	</ul>
</section>

{#if form?.ok}
	<p class="ok" role="status">Saved.</p>
{/if}
{#if form?.message}
	<p class="err" role="alert">{form.message}</p>
{/if}

<style>
	.back {
		margin: 0 0 var(--space-md);
		font-size: var(--text-sm);
	}
	.back a {
		color: var(--color-primary);
	}
	.h {
		margin: 0 0 var(--space-xs);
		font-size: var(--text-xl);
	}
	.meta {
		margin: 0 0 var(--space-xl);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.section {
		margin-bottom: var(--space-2xl);
	}
	.section h3 {
		font-size: var(--text-md);
		margin: 0 0 var(--space-md);
	}
	.form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: flex-end;
	}
	.form label {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		font-size: var(--text-sm);
	}
	.form select,
	.form input {
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		font: inherit;
		min-width: 12rem;
	}
	.btn {
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 600;
		cursor: pointer;
		font-size: var(--text-sm);
	}
	.btn.danger {
		background: var(--color-danger);
		color: var(--color-on-danger);
		margin-top: var(--space-sm);
	}
	.ents {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.ents li {
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface-1);
	}
	.ents li.revoked {
		opacity: 0.65;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-sm);
		font-size: var(--text-sm);
	}
	.muted {
		color: var(--color-text-muted);
	}
	.ok {
		color: var(--color-success);
		font-size: var(--text-sm);
	}
	.err {
		color: var(--color-danger);
		font-size: var(--text-sm);
	}
</style>
