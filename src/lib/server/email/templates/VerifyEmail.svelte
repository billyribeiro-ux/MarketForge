<script lang="ts">
	let { name, url }: { name: string; url: string } = $props();
</script>

<p>Hi {name},</p>
<p><a href={url}>Verify email</a></p>
