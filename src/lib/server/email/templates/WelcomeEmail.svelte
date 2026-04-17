<script lang="ts">
	let { name, appUrl }: { name: string; appUrl: string } = $props();
</script>

<p>Hi {name},</p>
<p>
	Your account is ready. Finish verifying your email if you have not already, then explore the app at
	<a href={`${appUrl}/app`}>{appUrl}/app</a>.
</p>
