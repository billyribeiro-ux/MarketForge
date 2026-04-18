<script lang="ts">
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally -- validated form from load
	const { form, errors, enhance, message } = superForm(data.form);

	// Stamp the form with a client-side load timestamp so the server can reject
	// submissions that arrive faster than a human could type them. This is a
	// one-shot mount-time write — running it inside `$effect` would re-subscribe
	// to the store it mutates and risk a render loop.
	onMount(() => {
		$form.formLoadedAt = Date.now();
	});
</script>

<svelte:head>
	<title>Contact — MarketForge</title>
</svelte:head>

<div class="wrap">
	<h1>Contact</h1>
	<p class="lead">
		Questions about memberships, billing, or the platform? Send a note — we read every message.
	</p>

	{#if $message}
		<p class="msg" role="status">{$message}</p>
	{/if}

	<form method="POST" use:enhance class="form">
		<!-- Honeypot: hidden from humans; bots that fill every input get flagged. -->
		<div class="hp" aria-hidden="true">
			<label>
				Website
				<input
					type="text"
					name="website"
					tabindex="-1"
					autocomplete="off"
					bind:value={$form.website}
				/>
			</label>
		</div>
		<input type="hidden" name="formLoadedAt" bind:value={$form.formLoadedAt} />

		<div class="field">
			<label class="label" for="contact-name">Name</label>
			<input id="contact-name" name="name" autocomplete="name" bind:value={$form.name} />
			{#if $errors.name}<span class="err">{$errors.name}</span>{/if}
		</div>
		<div class="field">
			<label class="label" for="contact-email">Email</label>
			<input
				id="contact-email"
				name="email"
				type="email"
				autocomplete="email"
				bind:value={$form.email}
			/>
			{#if $errors.email}<span class="err">{$errors.email}</span>{/if}
		</div>
		<div class="field">
			<label class="label" for="contact-topic">Topic</label>
			<select id="contact-topic" name="topic" bind:value={$form.topic}>
				<option value="general">General inquiry</option>
				<option value="billing">Billing & subscriptions</option>
				<option value="technical">Technical / platform</option>
				<option value="partnership">Partnership or media</option>
			</select>
			{#if $errors.topic}<span class="err">{$errors.topic}</span>{/if}
		</div>
		<div class="field">
			<label class="label" for="contact-message">Message</label>
			<textarea
				id="contact-message"
				name="message"
				rows="6"
				bind:value={$form.message}
				placeholder="Describe your question in a few sentences (minimum 20 characters)."
			></textarea>
			{#if $errors.message}<span class="err">{$errors.message}</span>{/if}
		</div>
		<button type="submit" class="btn">Send message</button>
	</form>

	<p class="fine-print">
		Signed-in members can open the billing portal from the app when Stripe checkout is enabled.
	</p>
</div>

<style>
	.wrap {
		padding: var(--space-3xl) var(--space-lg);
		max-width: 40rem;
		margin: 0 auto;
		line-height: var(--leading-relaxed);
	}
	h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-sm);
	}
	.lead {
		margin: 0 0 var(--space-xl);
		color: var(--color-text-muted);
	}
	.msg {
		padding: var(--space-md);
		border-radius: var(--radius-sm, 0.375rem);
		background: var(--color-primary-muted);
		color: var(--color-text);
		margin: 0 0 var(--space-lg);
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
	.field input,
	.field select,
	.field textarea {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm, 0.375rem);
		background: var(--color-surface-0);
		color: inherit;
		font: inherit;
	}
	.field textarea {
		resize: vertical;
		min-block-size: 8rem;
	}
	.btn {
		align-self: flex-start;
		padding: var(--space-sm) var(--space-xl);
		border: none;
		border-radius: var(--radius-sm, 0.375rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.err {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}
	.fine-print {
		margin-block-start: var(--space-2xl);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	.hp {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
