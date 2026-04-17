<script lang="ts">
	let {
		title,
		description,
		siteUrl,
		path,
		jsonLd = null
	}: {
		title: string;
		description: string;
		siteUrl: string;
		path: string;
		jsonLd?: Record<string, unknown> | null;
	} = $props();

	const origin = $derived(siteUrl.replace(/\/$/, ``));
	const canonical = $derived(`${origin}${path.startsWith(`/`) ? path : `/${path}`}`);
	const jsonLdSerialized = $derived(
		jsonLd ? JSON.stringify(jsonLd).replace(/</g, `\\u003c`) : null,
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if jsonLdSerialized}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<script type="application/ld+json">{@html jsonLdSerialized}</script>
	{/if}
</svelte:head>
