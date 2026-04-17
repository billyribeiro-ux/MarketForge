<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally -- superforms validated form from load
	const { form, errors, enhance, message } = superForm(data.form);
</script>

<svelte:head>
	<title>Sign in — MarketForge</title>
</svelte:head>

<article class="card">
	<h1>Sign in</h1>
	{#if $message}
		<p class="msg msg--err" role="alert">{$message}</p>
	{/if}
	<form method="POST" use:enhance class="stack">
		<input type="hidden" name="redirectTo" bind:value={$form.redirectTo} />
		<div class="field">
			<label class="label" for="login-email">Email</label>
			<input
				id="login-email"
				name="email"
				type="email"
				autocomplete="email"
				bind:value={$form.email}
			/>
			{#if $errors.email}<span class="err">{$errors.email}</span>{/if}
		</div>
		<div class="field">
			<label class="label" for="login-password">Password</label>
			<input
				id="login-password"
				name="password"
				type="password"
				autocomplete="current-password"
				bind:value={$form.password}
			/>
			{#if $errors.password}<span class="err">{$errors.password}</span>{/if}
		</div>
		<button type="submit" class="btn">Continue</button>
	</form>
	<p class="muted">
		<a href="/reset-password">Forgot password</a>
		·
		<a href="/signup">Create account</a>
	</p>
</article>

<style>
	.card {
		inline-size: min(100%, 24rem);
		padding: var(--space-xl);
		border-radius: var(--radius-md, 0.5rem);
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
	.label {
		font-weight: 500;
	}
	.field input {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm, 0.375rem);
		background: var(--color-surface-0);
		color: inherit;
		font: inherit;
	}
	.btn {
		margin-block-start: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm, 0.375rem);
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
	.msg--err {
		padding: var(--space-sm);
		border-radius: var(--radius-sm, 0.375rem);
		background: var(--color-danger-muted);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}
</style>
