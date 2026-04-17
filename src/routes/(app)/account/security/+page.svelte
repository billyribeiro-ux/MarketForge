<script lang="ts">
	import PasswordSection from '$lib/components/account/PasswordSection.svelte';
	import PasskeysSection from '$lib/components/account/PasskeysSection.svelte';
	import TwoFactorSection from '$lib/components/account/TwoFactorSection.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="stack">
	<PasswordSection hasPassword={data.hasPassword} />
	<hr />
	<TwoFactorSection enabled={data.user.twoFactorEnabled} />
	<hr />
	<PasskeysSection passkeys={data.passkeys} />
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xl);
	}
	hr {
		border: none;
		border-block-start: 1px solid var(--color-border);
		margin: 0;
	}
</style>
