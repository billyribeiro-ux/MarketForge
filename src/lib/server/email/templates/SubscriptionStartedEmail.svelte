<script lang="ts">
	let { name, planName, amountLabel }: { name: string; planName: string; amountLabel: string } =
		$props();
</script>

<p>Hi {name},</p>
<p>Your <strong>{planName}</strong> subscription is active.</p>
<p>Amount: {amountLabel}</p>
<p>Manage billing anytime from your account.</p>
