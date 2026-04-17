<script lang="ts">
	let { name, planName, amountLabel }: { name: string; planName: string; amountLabel: string } =
		$props();
</script>

<p>Hi {name},</p>
<p>We received your payment for <strong>{planName}</strong>.</p>
<p>Amount: {amountLabel}</p>
<p>Thank you for staying with MarketForge.</p>
