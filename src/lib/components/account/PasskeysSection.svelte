<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	type Passkey = {
		id: string;
		name: string | null;
		createdAt: string | null;
		deviceType: string;
		backedUp: boolean;
	};

	let { passkeys }: { passkeys: readonly Passkey[] } = $props();

	let newName = $state(``);
	let registering = $state(false);
	let message = $state<{ kind: 'ok' | 'err'; text: string } | null>(null);

	const supportsWebauthn = $derived(
		typeof window !== `undefined` &&
			typeof window.PublicKeyCredential !== `undefined`,
	);

	async function addPasskey(e: SubmitEvent) {
		e.preventDefault();
		if (registering) return;
		registering = true;
		message = null;
		try {
			const trimmed = newName.trim();
			const { error } = await authClient.passkey.addPasskey({
				name: trimmed.length > 0 ? trimmed : undefined,
			});
			if (error) {
				message = { kind: `err`, text: error.message ?? `Could not register passkey.` };
				return;
			}
			newName = ``;
			message = { kind: `ok`, text: `Passkey added.` };
			await invalidateAll();
		} catch (err) {
			message = {
				kind: `err`,
				text: err instanceof Error ? err.message : `Registration cancelled.`,
			};
		} finally {
			registering = false;
		}
	}

	async function removePasskey(id: string) {
		message = null;
		try {
			const { error } = await authClient.passkey.deletePasskey({ id });
			if (error) {
				message = { kind: `err`, text: error.message ?? `Could not remove passkey.` };
				return;
			}
			message = { kind: `ok`, text: `Passkey removed.` };
			await invalidateAll();
		} catch (err) {
			message = {
				kind: `err`,
				text: err instanceof Error ? err.message : `Unexpected error.`,
			};
		}
	}

	function formatDate(iso: string | null): string {
		if (!iso) return `—`;
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: `medium` });
	}
</script>

<section class="stack">
	<header>
		<h3>Passkeys</h3>
		<p class="muted">
			Passkeys replace passwords with device-bound cryptographic keys (Touch ID, Windows Hello,
			security keys). You can sign in on any device that has access to a registered passkey.
		</p>
	</header>

	{#if !supportsWebauthn}
		<p class="note">Your browser doesn’t support passkeys. Use Chrome, Safari, or Firefox on a recent device.</p>
	{/if}

	{#if message}
		<p class:ok={message.kind === `ok`} class:err={message.kind === `err`} role="status">
			{message.text}
		</p>
	{/if}

	<form class="add" onsubmit={addPasskey}>
		<div class="field">
			<label class="label" for="pk-name">Name (optional)</label>
			<input
				id="pk-name"
				type="text"
				maxlength={60}
				bind:value={newName}
				placeholder="e.g. MacBook Touch ID"
			/>
		</div>
		<button type="submit" class="btn" disabled={registering || !supportsWebauthn}>
			{registering ? `Waiting for device…` : `Add passkey`}
		</button>
	</form>

	{#if passkeys.length === 0}
		<p class="empty">You haven’t registered any passkeys yet.</p>
	{:else}
		<ul class="list">
			{#each passkeys as pk (pk.id)}
				<li class="item">
					<div class="meta">
						<strong>{pk.name ?? `Unnamed passkey`}</strong>
						<span class="tag">{pk.deviceType}</span>
						{#if pk.backedUp}
							<span class="tag ok">Synced</span>
						{/if}
					</div>
					<div class="row">
						<span class="date">Added {formatDate(pk.createdAt)}</span>
						<button type="button" class="link danger" onclick={() => removePasskey(pk.id)}>
							Remove
						</button>
					</div>
				</li>
			{/each}
		</ul>
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
		line-height: var(--leading-relaxed);
	}
	.note {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-warn-muted);
		color: var(--color-on-warn);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
	}
	.add {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-md);
		align-items: end;
		max-inline-size: 32rem;
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
		padding: var(--space-sm) var(--space-lg);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.item {
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-1);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}
	.tag {
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-sm);
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: capitalize;
	}
	.tag.ok {
		background: var(--color-success-muted);
		color: var(--color-success);
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	.link.danger {
		background: none;
		border: none;
		color: var(--color-danger);
		font-weight: 600;
		cursor: pointer;
		font-size: inherit;
		padding: 0;
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
