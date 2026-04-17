<script lang="ts">
	import type { Snippet } from 'svelte';

	import UpgradePrompt from '$lib/components/entitlements/UpgradePrompt.svelte';

	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

{#if !data.hasIndicatorVault}
	<UpgradePrompt
		title="Indicator Vault"
		body="Download Pine Script and ThinkScript sources. Unlock with a Yearly or Lifetime plan."
		requiredKey="indicator_vault"
		checkoutSlug="pro-yearly"
	/>
{:else}
	{@render children()}
{/if}
