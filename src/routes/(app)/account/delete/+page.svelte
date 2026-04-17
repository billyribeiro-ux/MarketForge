<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally -- superforms validated form from load
	const { form, errors, enhance, message, submitting } = superForm(data.form);
</script>

<article class="danger-zone">
	<header>
		<h2>Delete account</h2>
		<p class="muted">
			This is permanent. We cancel any active subscriptions, remove your Stripe customer, and
			delete all account data including progress, entitlements, 2FA, and passkeys. Past invoices
			on the payment processor’s records are kept per legal retention rules.
		</p>
	</header>

	{#if $message}
		<p class="err" role="alert">{$message}</p>
	{/if}

	<form method="POST" use:enhance class="form">
		<div class="field">
			<label class="label" for="del-password">Confirm password</label>
			<input
				id="del-password"
				name="password"
				type="password"
				autocomplete="current-password"
				bind:value={$form.password}
				required
			/>
			{#if $errors.password}<span class="err">{$errors.password}</span>{/if}
		</div>
		<div class="field">
			<label class="label" for="del-confirm">
				Type <code>DELETE</code> to confirm
			</label>
			<input
				id="del-confirm"
				name="confirm"
				bind:value={$form.confirm}
				autocomplete="off"
				autocapitalize="characters"
				required
			/>
			{#if $errors.confirm}<span class="err">{$errors.confirm}</span>{/if}
		</div>
		<div class="actions">
			<button type="submit" class="btn danger" disabled={$submitting}>
				{$submitting ? `Deleting…` : `Delete my account`}
			</button>
			<a href="/account" class="link">Cancel</a>
		</div>
	</form>
</article>

<style>
	.danger-zone {
		max-inline-size: 32rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	h2 {
		margin: 0 0 var(--space-xs);
		font-size: var(--text-xl);
		color: var(--color-danger);
	}
	.muted {
		margin: 0;
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		font-size: var(--text-sm);
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-md);
		background: var(--color-danger-muted);
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
	code {
		font-family: var(--font-mono);
		padding: 0 0.2em;
		background: var(--color-surface-0);
		border-radius: var(--radius-sm);
	}
	input {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm);
		font: inherit;
		background: var(--color-surface-0);
		color: inherit;
	}
	.actions {
		display: flex;
		gap: var(--space-md);
		align-items: center;
	}
	.btn.danger {
		padding: var(--space-sm) var(--space-lg);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-danger);
		color: var(--color-on-danger);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.link {
		color: var(--color-primary);
		font-size: var(--text-sm);
	}
	.err {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}
	p.err {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-danger-muted);
		color: var(--color-danger);
		margin: 0;
	}
</style>
