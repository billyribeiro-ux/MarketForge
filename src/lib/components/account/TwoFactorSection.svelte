<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	let { enabled }: { enabled: boolean } = $props();

	type Stage = 'idle' | 'enabling' | 'confirming' | 'disabling';
	let stage = $state<Stage>(`idle`);
	let password = $state(``);
	let totpCode = $state(``);
	let qr = $state<{ uri: string; codes: readonly string[] } | null>(null);
	let message = $state<{ kind: 'ok' | 'err'; text: string } | null>(null);

	async function handleEnable(e: SubmitEvent) {
		e.preventDefault();
		stage = `enabling`;
		message = null;
		try {
			const { data, error } = await authClient.twoFactor.enable({ password });
			if (error || !data) {
				message = { kind: `err`, text: error?.message ?? `Could not start 2FA setup.` };
				stage = `idle`;
				return;
			}
			qr = {
				uri: data.totpURI,
				codes: data.backupCodes,
			};
			stage = `confirming`;
			password = ``;
		} catch (err) {
			message = {
				kind: `err`,
				text: err instanceof Error ? err.message : `Unexpected error.`,
			};
			stage = `idle`;
		}
	}

	async function handleConfirm(e: SubmitEvent) {
		e.preventDefault();
		message = null;
		try {
			const { error } = await authClient.twoFactor.verifyTotp({ code: totpCode });
			if (error) {
				message = { kind: `err`, text: error.message ?? `Invalid code.` };
				return;
			}
			message = { kind: `ok`, text: `Two-factor authentication enabled.` };
			qr = null;
			totpCode = ``;
			stage = `idle`;
			await invalidateAll();
		} catch (err) {
			message = {
				kind: `err`,
				text: err instanceof Error ? err.message : `Unexpected error.`,
			};
		}
	}

	async function handleDisable(e: SubmitEvent) {
		e.preventDefault();
		stage = `disabling`;
		message = null;
		try {
			const { error } = await authClient.twoFactor.disable({ password });
			if (error) {
				message = { kind: `err`, text: error.message ?? `Could not disable 2FA.` };
				stage = `idle`;
				return;
			}
			message = { kind: `ok`, text: `Two-factor authentication disabled.` };
			password = ``;
			stage = `idle`;
			await invalidateAll();
		} catch (err) {
			message = {
				kind: `err`,
				text: err instanceof Error ? err.message : `Unexpected error.`,
			};
			stage = `idle`;
		}
	}

	function cancelSetup() {
		qr = null;
		totpCode = ``;
		stage = `idle`;
	}
</script>

<section class="stack">
	<header>
		<h3>Two-factor authentication (TOTP)</h3>
		<p class="muted">
			Authenticator apps like 1Password, Authy, or Google Authenticator generate one-time codes that
			your account requires on sign-in.
		</p>
		<p class="status">
			Status:
			<strong class:on={enabled} class:off={!enabled}>
				{enabled ? `Enabled` : `Not enabled`}
			</strong>
		</p>
	</header>

	{#if message}
		<p class:ok={message.kind === `ok`} class:err={message.kind === `err`} role="status">
			{message.text}
		</p>
	{/if}

	{#if stage === `confirming` && qr}
		<div class="confirm">
			<p class="muted">
				1. Scan the QR code with your authenticator app (or paste the URI manually).<br />
				2. Enter the 6-digit code it generates.<br />
				3. Save your backup codes in a safe place — you’ll need them to sign in if you lose your device.
			</p>
			<div class="qr">
				<code class="uri">{qr.uri}</code>
			</div>
			<details class="codes">
				<summary>Backup codes ({qr.codes.length})</summary>
				<ul>
					{#each qr.codes as code (code)}
						<li><code>{code}</code></li>
					{/each}
				</ul>
			</details>
			<form class="form" onsubmit={handleConfirm}>
				<div class="field">
					<label class="label" for="totp">Authenticator code</label>
					<input
						id="totp"
						type="text"
						inputmode="numeric"
						pattern="[0-9]*"
						autocomplete="one-time-code"
						bind:value={totpCode}
						maxlength={6}
						required
					/>
				</div>
				<div class="actions">
					<button type="submit" class="btn">Verify &amp; enable</button>
					<button type="button" class="btn-link" onclick={cancelSetup}>Cancel</button>
				</div>
			</form>
		</div>
	{:else if enabled}
		<form class="form" onsubmit={handleDisable}>
			<div class="field">
				<label class="label" for="tf-pwd-disable">Confirm password</label>
				<input
					id="tf-pwd-disable"
					type="password"
					autocomplete="current-password"
					bind:value={password}
					required
				/>
			</div>
			<button type="submit" class="btn danger" disabled={stage === `disabling`}>
				{stage === `disabling` ? `Disabling…` : `Disable 2FA`}
			</button>
		</form>
	{:else}
		<form class="form" onsubmit={handleEnable}>
			<div class="field">
				<label class="label" for="tf-pwd-enable">Confirm password</label>
				<input
					id="tf-pwd-enable"
					type="password"
					autocomplete="current-password"
					bind:value={password}
					required
				/>
			</div>
			<button type="submit" class="btn" disabled={stage === `enabling`}>
				{stage === `enabling` ? `Preparing…` : `Enable 2FA`}
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
		line-height: var(--leading-relaxed);
	}
	.status {
		margin: var(--space-sm) 0 0;
		font-size: var(--text-sm);
	}
	.status .on {
		color: var(--color-success);
	}
	.status .off {
		color: var(--color-text-muted);
	}
	.confirm {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-1);
		max-inline-size: 32rem;
	}
	.qr {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-2);
		overflow-x: auto;
	}
	.uri {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		word-break: break-all;
	}
	.codes summary {
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.codes ul {
		list-style: none;
		padding: 0;
		margin: var(--space-sm) 0 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: var(--space-xs);
		font-family: var(--font-mono);
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
	.actions {
		display: flex;
		gap: var(--space-md);
		align-items: center;
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
	}
	.btn.danger {
		background: var(--color-danger);
		color: var(--color-on-danger);
	}
	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.btn-link {
		background: none;
		border: none;
		color: var(--color-primary);
		font: inherit;
		cursor: pointer;
		padding: var(--space-sm);
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
