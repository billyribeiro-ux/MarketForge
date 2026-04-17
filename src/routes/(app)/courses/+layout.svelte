<script lang="ts">
	import type { Snippet } from 'svelte';

	import UpgradePrompt from '$lib/components/entitlements/UpgradePrompt.svelte';

	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

{#if !data.hasProAccess}
	<UpgradePrompt
		title="Courses"
		body="Structured lessons and progress tracking. Unlock with any active Pro plan."
		requiredKey="pro_access"
		checkoutSlug="pro-monthly"
	/>
{:else}
	{@render children()}
{/if}
