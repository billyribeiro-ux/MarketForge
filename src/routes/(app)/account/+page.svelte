<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally -- superforms validated form from load
	const { form, errors, enhance, message, submitting } = superForm(data.form, {
		resetForm: false,
	});
</script>

<article class="stack">
	<header>
		<h2>Profile</h2>
		<p class="muted">Display name shown in the app and transactional emails.</p>
	</header>

	{#if $message}
		<p class="ok" role="status">{$message}</p>
	{/if}

	<form method="POST" use:enhance class="form">
		<div class="field">
			<label class="label" for="account-email">Email</label>
			<input id="account-email" type="email" value={data.user.email} disabled />
			<span class="hint">
				{#if data.user.emailVerified}
					Verified ✓
				{:else}
					Not verified — check your inbox.
				{/if}
				To change, head to <a href="/account/security">Security</a>.
			</span>
		</div>

		<div class="field">
			<label class="label" for="account-name">Name</label>
			<input
				id="account-name"
				name="name"
				autocomplete="name"
				bind:value={$form.name}
				maxlength={120}
				required
			/>
			{#if $errors.name}<span class="err">{$errors.name}</span>{/if}
		</div>

		<button type="submit" class="btn" disabled={$submitting}>
			{$submitting ? `Saving…` : `Save changes`}
		</button>
	</form>
</article>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
		max-inline-size: 32rem;
	}
	h2 {
		font-size: var(--text-xl);
		margin: 0 0 var(--space-xs);
	}
	.muted {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		font-size: var(--text-sm);
	}
	.label {
		font-weight: 600;
	}
	input {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm);
		background: var(--color-surface-0);
		color: inherit;
		font: inherit;
	}
	input:disabled {
		color: var(--color-text-muted);
		background: var(--color-surface-1);
	}
	.hint {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.hint a {
		color: var(--color-primary);
		font-weight: 600;
	}
	.btn {
		align-self: flex-start;
		padding: var(--space-sm) var(--space-lg);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.btn:disabled {
		cursor: wait;
		opacity: 0.7;
	}
	.err {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}
	.ok {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-success-muted);
		color: var(--color-success);
		font-size: var(--text-sm);
	}
</style>
