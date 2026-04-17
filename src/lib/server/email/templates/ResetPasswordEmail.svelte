<script lang="ts">
	let { name, url }: { name: string; url: string } = $props();
</script>

<p>Hi {name},</p>
<p><a href={url}>Choose a new password</a></p>
<p>This link expires soon.</p>
