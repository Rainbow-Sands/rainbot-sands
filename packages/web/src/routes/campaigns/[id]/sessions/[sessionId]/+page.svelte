<script lang="ts">
  import { marked } from "marked";
  import type { PageData } from "./$types";
  import TaperedRule from "$lib/components/TaperedRule.svelte";

  let { data }: { data: PageData } = $props();

  function formatDate(d: Date | string): string {
    return new Date(d).toLocaleString("en-CA", {
      dateStyle: "long",
      timeStyle: "short",
    });
  }

  function renderMarkdown(text: string): string {
    return marked(text) as string;
  }
</script>

<svelte:head
  ><title>{data.session.title ?? formatDate(data.session.startedAt)} — Session</title
  ></svelte:head
>

<p><a href="/campaigns/{data.session.campaignId}">← Campaign</a></p>

<div class="panel">
  <p class="eyebrow">Session Chronicle</p>
  <h1>{data.session.title ?? formatDate(data.session.startedAt)}</h1>
  {#if data.session.title}
    <p class="muted session-date">{formatDate(data.session.startedAt)}</p>
  {/if}
  <TaperedRule />
  <p class="muted status">Status: {data.session.status}</p>

  <h2>Recap</h2>
  {#if data.session.recap}
    <div class="prose">{@html renderMarkdown(data.session.recap)}</div>
  {:else}
    <p class="empty">The bards have not yet composed this tale.</p>
  {/if}

  <h2>Summary</h2>
  {#if data.session.summary}
    <div class="prose">{@html renderMarkdown(data.session.summary)}</div>
  {:else}
    <p class="empty">Not yet available.</p>
  {/if}

  <h2>Transcript</h2>
  {#if data.session.transcript}
    <pre class="transcript">{data.session.transcript}</pre>
  {:else}
    <p class="empty">Not yet available.</p>
  {/if}
</div>

<style>
  .session-date {
    margin-top: -0.5rem;
  }
  .status {
    margin-top: -0.5rem;
  }
  .prose {
    line-height: 1.7;
  }
  .prose :global(p) {
    margin: 0.75em 0;
  }
  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3) {
    font-family: var(--font-display);
    color: var(--gold);
    margin: 1.25em 0 0.5em;
  }
  .prose :global(ul),
  .prose :global(ol) {
    padding-left: 1.5em;
    margin: 0.75em 0;
  }
  .prose :global(li) {
    margin: 0.25em 0;
  }
  .prose :global(strong) {
    color: var(--text-emphasis, var(--gold));
  }
  .prose :global(em) {
    font-style: italic;
  }
  .transcript {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
    background: var(--surface-sunken);
    border: 1px solid var(--edge);
    border-left: 3px solid var(--gold);
    border-radius: 4px;
    padding: 1rem 1.2rem;
    overflow-x: auto;
  }
</style>
