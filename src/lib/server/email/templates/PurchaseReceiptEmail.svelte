<script lang="ts">
	let { name, title, amountLabel }: { name: string; title: string; amountLabel: string } = $props();
</script>

<p>Hi {name},</p>
<p>Thanks for your purchase: <strong>{title}</strong>.</p>
<p>Amount: {amountLabel}</p>
<p>If you have questions, reply to this email or visit support.</p>
