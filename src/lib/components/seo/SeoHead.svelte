<script lang="ts">
	let {
		title,
		description,
		siteUrl,
		path,
		jsonLd = null,
	}: {
		title: string;
		description: string;
		/** Absolute origin (with or without trailing slash). */
		siteUrl: string;
		/** Pathname starting with `/`. Query/hash are stripped from the canonical. */
		path: string;
		/** Optional JSON-LD payload; serialized safely for inline `<script>`. */
		jsonLd?: Record<string, unknown> | null;
	} = $props();

	/** Canonical href built with the URL constructor so we never produce `//path`. */
	const canonical = $derived.by(() => {
		try {
			const base = siteUrl.endsWith(`/`) ? siteUrl : `${siteUrl}/`;
			const url = new URL(path.startsWith(`/`) ? path.slice(1) : path, base);
			url.search = ``;
			url.hash = ``;
			return url.toString().replace(/\/$/, ``);
		} catch {
			return siteUrl;
		}
	});

	/**
	 * Escapes `<`, `>`, and `&` so the payload can't break out of the inline
	 * `<script>` tag or be mis-parsed as HTML.
	 */
	const jsonLdSerialized = $derived.by(() => {
		if (!jsonLd) return null;
		return JSON.stringify(jsonLd)
			.replace(/</g, `\\u003c`)
			.replace(/>/g, `\\u003e`)
			.replace(/&/g, `\\u0026`);
	});
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
