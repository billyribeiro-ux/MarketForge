<script lang="ts">
	// AVIF-first responsive picture with JPEG/PNG fallback. `avifSrc`/`fallbackSrc` come from the asset pipeline.
	let {
		avifSrc,
		fallbackSrc,
		alt,
		width,
		height,
		loading = `lazy`,
		fetchpriority,
	}: {
		avifSrc: string;
		fallbackSrc: string;
		alt: string;
		width: number;
		height: number;
		loading?: 'eager' | 'lazy';
		fetchpriority?: 'high' | 'low' | 'auto';
	} = $props();
</script>

<picture>
	<source srcset={avifSrc} type="image/avif" />
	<img src={fallbackSrc} {alt} {width} {height} {loading} {fetchpriority} decoding="async" />
</picture>
