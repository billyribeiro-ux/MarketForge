<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally -- superforms validated form from load
	const {
		form: rqForm,
		errors: rqErrors,
		enhance: rqEnhance
	} = superForm(data.requestForm, { id: `request-reset`, resetForm: false });

	// svelte-ignore state_referenced_locally -- superforms validated form from load
	const {
		form: pwdForm,
		errors: pwdErrors,
		enhance: pwdEnhance
	} = superForm(data.resetForm, { id: `reset-pwd`, resetForm: false });
</script>

<svelte:head>
	<title>Reset password — MarketForge</title>
</svelte:head>

<article class="card">
	<h1>Reset password</h1>
	{#if data.sent}
		<p class="ok" role="status">If that email exists, we sent reset instructions.</p>
	{/if}

	{#if data.hasToken}
		<form method="POST" action="?/reset" use:pwdEnhance class="stack">
			<input type="hidden" name="token" bind:value={$pwdForm.token} />
			<label class="field">
				<span>New password</span>
				<input
					name="newPassword"
					type="password"
					autocomplete="new-password"
					bind:value={$pwdForm.newPassword}
				/>
				{#if $pwdErrors.newPassword}<span class="err">{$pwdErrors.newPassword}</span>{/if}
			</label>
			<button type="submit" class="btn">Update password</button>
		</form>
	{:else}
		<p class="muted">Enter your email and we will send a reset link.</p>
		<form method="POST" action="?/request" use:rqEnhance class="stack">
			<label class="field">
				<span>Email</span>
				<input name="email" type="email" autocomplete="email" bind:value={$rqForm.email} />
				{#if $rqErrors.email}<span class="err">{$rqErrors.email}</span>{/if}
			</label>
			<button type="submit" class="btn">Send link</button>
		</form>
	{/if}
	<p class="muted"><a href="/login">Back to sign in</a></p>
</article>

<style>
	.card {
		inline-size: min(100%, 24rem);
		padding: var(--space-xl);
		border-radius: var(--radius-md);
		background: var(--color-surface-0);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}
	h1 {
		margin: 0 0 var(--space-lg);
		font-size: var(--text-2xl);
		font-weight: 600;
		line-height: var(--leading-tight);
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		font-size: var(--text-sm);
	}
	.field input {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm);
		background: var(--color-surface-0);
		color: inherit;
		font: inherit;
	}
	.btn {
		margin-block-start: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.muted {
		margin-block-start: var(--space-lg);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	.muted a {
		color: var(--color-primary);
	}
	.err {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}
	.ok {
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--color-success-muted);
		color: var(--color-success);
		font-size: var(--text-sm);
	}
</style>
