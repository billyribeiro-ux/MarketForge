<script lang="ts">
	import { page } from '$app/state';
	import { trackPlausible } from '$lib/client/plausible';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally -- superforms validated form from load
	const { form, errors, enhance, message } = superForm(data.form);

	onMount(() => {
		trackPlausible(`signup_started`);
	});
</script>

<SeoHead
	title="Create account — MarketForge"
	description="Create your MarketForge account to access courses, indicators, and member tools."
	siteUrl={data.siteUrl}
	path={page.url.pathname}
/>

<article class="card">
	<h1>Create account</h1>
	{#if $message}
		<p class="msg msg--err" role="alert">{$message}</p>
	{/if}
	<form method="POST" use:enhance class="stack">
		<label class="field">
			<span>Name</span>
			<input name="name" type="text" autocomplete="name" bind:value={$form.name} />
			{#if $errors.name}<span class="err">{$errors.name}</span>{/if}
		</label>
		<label class="field">
			<span>Email</span>
			<input name="email" type="email" autocomplete="email" bind:value={$form.email} />
			{#if $errors.email}<span class="err">{$errors.email}</span>{/if}
		</label>
		<label class="field">
			<span>Password</span>
			<input
				name="password"
				type="password"
				autocomplete="new-password"
				bind:value={$form.password}
			/>
			{#if $errors.password}<span class="err">{$errors.password}</span>{/if}
		</label>
		<button type="submit" class="btn">Sign up</button>
	</form>
	<p class="muted"><a href="/login">Already have an account?</a></p>
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
	.msg--err {
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--color-danger-muted);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}
</style>
