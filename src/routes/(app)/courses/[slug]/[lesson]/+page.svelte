<script lang="ts">
	import { enhance } from '$app/forms';

	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { success?: boolean } | undefined } = $props();

	const lessonIndex = $derived(
		data.manifest.lessons.findIndex((l) => l.slug === data.lesson.slug)
	);
	const prevLesson = $derived(lessonIndex > 0 ? data.manifest.lessons[lessonIndex - 1] : null);
	const nextLesson = $derived(
		lessonIndex >= 0 && lessonIndex < data.manifest.lessons.length - 1
			? data.manifest.lessons[lessonIndex + 1]
			: null
	);
</script>

<svelte:head>
	<title>{data.lesson.title} — {data.course.title}</title>
</svelte:head>

<nav class="crumb" aria-label="Lesson">
	<a href="/courses">Courses</a>
	<span aria-hidden="true">/</span>
	<a href="/courses/{data.course.slug}">{data.course.title}</a>
	<span aria-hidden="true">/</span>
	<span>{data.lesson.title}</span>
</nav>

<article class="lesson">
	<h1>{data.lesson.title}</h1>
	{#if data.progress?.completedAt}
		<p class="done">Completed {data.progress.completedAt.toLocaleDateString()}</p>
	{/if}
	<div class="prose">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html data.html}
	</div>
</article>

<footer class="foot">
	<div class="nav2">
		{#if prevLesson}
			<a href="/courses/{data.course.slug}/{prevLesson.slug}">← {prevLesson.title}</a>
		{:else}
			<span class="spacer"></span>
		{/if}
		{#if nextLesson}
			<a href="/courses/{data.course.slug}/{nextLesson.slug}">{nextLesson.title} →</a>
		{/if}
	</div>
	<form method="POST" action="?/markComplete" use:enhance>
		<button type="submit" class="btn">Mark lesson complete</button>
	</form>
	{#if nextLesson}
		<form method="POST" action="?/nextLesson" use:enhance>
			<button type="submit" class="btn secondary">Next lesson</button>
		</form>
	{/if}
	{#if form?.success}
		<p class="ok" role="status">Progress saved.</p>
	{/if}
</footer>

<style>
	.crumb {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-lg);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		align-items: center;
	}
	.crumb a {
		color: var(--color-primary);
		text-decoration: none;
	}
	.lesson h1 {
		font-size: var(--text-2xl);
		margin: 0 0 var(--space-md);
	}
	.done {
		font-size: var(--text-sm);
		color: var(--color-success);
		margin: 0 0 var(--space-md);
	}
	.prose {
		max-width: 40rem;
		line-height: var(--leading-relaxed);
	}
	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3) {
		margin-block: var(--space-lg) var(--space-sm);
		line-height: var(--leading-tight);
	}
	.prose :global(p) {
		margin: 0 0 var(--space-md);
	}
	.prose :global(ul) {
		margin: 0 0 var(--space-md);
		padding-inline-start: 1.25rem;
	}
	.prose :global(blockquote) {
		margin: var(--space-md) 0;
		padding-inline-start: var(--space-md);
		border-inline-start: 3px solid var(--color-border-strong);
		color: var(--color-text-muted);
	}
	.prose :global(pre) {
		padding: var(--space-md);
		background: var(--color-surface-2);
		border-radius: var(--radius-sm, 0.25rem);
		overflow: auto;
		font-size: var(--text-sm);
	}
	.foot {
		margin-top: var(--space-2xl);
		padding-top: var(--space-xl);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		align-items: flex-start;
	}
	.nav2 {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 40rem;
		gap: var(--space-md);
		font-size: var(--text-sm);
	}
	.nav2 a {
		color: var(--color-primary);
	}
	.spacer {
		display: block;
		min-width: 1px;
	}
	.btn {
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 600;
		cursor: pointer;
		font-size: var(--text-sm);
	}
	.btn.secondary {
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}
	.ok {
		font-size: var(--text-sm);
		color: var(--color-success);
		margin: 0;
	}
</style>
