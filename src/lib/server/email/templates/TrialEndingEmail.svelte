<script lang="ts">
	let { name, trialEndLabel }: { name: string; trialEndLabel: string } = $props();
</script>

<p>Hi {name},</p>
<p>Your trial ends around <strong>{trialEndLabel}</strong>. Add a payment method to keep uninterrupted access.</p>
