<script lang="ts">
	import type { Snippet } from 'svelte';

	import UpgradePrompt from '$lib/components/entitlements/UpgradePrompt.svelte';

	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

{#if !data.hasLiveRoom}
	<UpgradePrompt
		title="Live Room"
		body="Session broadcasts and live Q&A. Included with Lifetime access."
		requiredKey="live_room"
		checkoutSlug="pro-lifetime"
	/>
{:else}
	{@render children()}
{/if}
