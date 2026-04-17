<script lang="ts">
	import { authClient } from '$lib/auth-client';

	let { hasPassword }: { hasPassword: boolean } = $props();

	let currentPassword = $state(``);
	let newPassword = $state(``);
	let confirmPassword = $state(``);
	let submitting = $state(false);
	let message = $state<{ kind: 'ok' | 'err'; text: string } | null>(null);

	const mismatch = $derived(
		newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword,
	);
	const tooShort = $derived(newPassword.length > 0 && newPassword.length < 8);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		if (mismatch || tooShort) return;
		submitting = true;
		message = null;
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (error) {
				message = { kind: `err`, text: error.message ?? `Could not change password.` };
				return;
			}
			currentPassword = ``;
			newPassword = ``;
			confirmPassword = ``;
			message = {
				kind: `ok`,
				text: `Password updated. Other sessions have been signed out.`,
			};
		} catch (err) {
			message = {
				kind: `err`,
				text: err instanceof Error ? err.message : `Unexpected error.`,
			};
		} finally {
			submitting = false;
		}
	}
</script>

<section class="stack">
	<header>
		<h3>Password</h3>
		<p class="muted">
			Changing your password also signs out any other active sessions.
		</p>
	</header>

	{#if !hasPassword}
		<p class="note">You don’t have a password set — you signed up with a passkey or link.</p>
	{:else}
		{#if message}
			<p class:ok={message.kind === `ok`} class:err={message.kind === `err`} role="status">
				{message.text}
			</p>
		{/if}
		<form class="form" onsubmit={submit}>
			<div class="field">
				<label class="label" for="pwd-current">Current password</label>
				<input
					id="pwd-current"
					type="password"
					autocomplete="current-password"
					bind:value={currentPassword}
					required
				/>
			</div>
			<div class="field">
				<label class="label" for="pwd-new">New password</label>
				<input
					id="pwd-new"
					type="password"
					autocomplete="new-password"
					bind:value={newPassword}
					minlength={8}
					maxlength={200}
					required
				/>
				{#if tooShort}<span class="err">At least 8 characters.</span>{/if}
			</div>
			<div class="field">
				<label class="label" for="pwd-confirm">Confirm new password</label>
				<input
					id="pwd-confirm"
					type="password"
					autocomplete="new-password"
					bind:value={confirmPassword}
					minlength={8}
					maxlength={200}
					required
				/>
				{#if mismatch}<span class="err">Passwords do not match.</span>{/if}
			</div>
			<button type="submit" class="btn" disabled={submitting || mismatch || tooShort}>
				{submitting ? `Updating…` : `Update password`}
			</button>
		</form>
	{/if}
</section>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	h3 {
		margin: 0 0 var(--space-xs);
		font-size: var(--text-lg);
	}
	.muted {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.note {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-1);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		max-inline-size: 26rem;
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
		font: inherit;
		background: var(--color-surface-0);
		color: inherit;
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
		cursor: not-allowed;
		opacity: 0.6;
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
		margin: 0;
	}
	p.err {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-danger-muted);
		color: var(--color-danger);
		margin: 0;
	}
</style>
